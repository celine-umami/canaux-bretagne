/**
 * Module de gestion de la carte Leaflet
 * Responsable de l'initialisation et du rendu de la carte
 */

import { fetchLocksForChannel, fetchBoatsForChannel } from '../data/data.js';
import { deduplicateBoats } from '../utils/boatUtils.js';
import Application from "../main.js";

/** @typedef {import('../types/Boat.js').Boat} Boat */
/** @typedef {import('../types/Channel.js').Channel} Channel */
/** @typedef {import('../types/Lock.js').Lock} Lock */

class MapManager {
    /** @type {Application} */
    app;


    /**
     * @param {Application} app - Instance de l'application principale pour accéder aux autres managers et données partagées
     * @param {string} containerId - ID de l'élément DOM où la carte sera rendue
     */
    constructor(app, containerId) {
        this.app = app;
        this.containerId = containerId;
        this.map = null;
        this.pathLayer = null;
        this.markersLayer = null;
        this.labelsLayer = null;
        this.currentMarkers = [];
        this.lockMarkers = [];
        this.boatsClickHandlers = new Map();
        this.zoomThreshold = 12; // Seuil de zoom pour afficher les labels
    }

    /**
     * Initialise la carte Leaflet
     * @param {Object} channel - L'objet canal
     */
    initMap(channel) {
        try {
            if (this.map) {
                // Réinitialiser la vue avec des coordonnées par défaut
                this.map.setView([48, -2], 8);
            } else {
                // Créer la carte avec un centre par défaut (centre de la Bretagne)
                this.map = L.map(this.containerId).setView([48, -2], 8);

                // Ajouter la couche CartoDB VoyagerNoLabels (gris avec contraste pour le bleu)
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; CartoDB contributors',
                    maxZoom: 19,
                    maxNativeZoom: 18,
                    subdomains: 'abcd'
                }).addTo(this.map);

                // ajoute le contrôle de plein écran
                this.map.addControl(new L.Control.FullScreen());

                // Créer des couches pour les éléments
                this.pathLayer = L.featureGroup().addTo(this.map);
                this.markersLayer = L.featureGroup().addTo(this.map);
                this.labelsLayer = L.featureGroup().addTo(this.map);
            }

            // Nettoyer les marqueurs précédents
            this.clearMarkers();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la carte:', error);
            throw error;
        }
    }


    /**
     * Ajoute les marqueurs des écluses sur la carte
     * @param {Array} locks - Tableau des écluses depuis l'API
     */
    addLocks(locks) {
        if (!locks || locks.length === 0) {
            return;
        }

        this.lockMarkers = []; // Réinitialiser les marqueurs d'écluse
        this.labelsLayer.clearLayers(); // Vider les labels précédents

        locks.forEach(lock => {
            // Parser geo_point "lat, lng" en coordonnées
            const [lat, lng] = lock.geo_point.split(',').map(coord => parseFloat(coord.trim()));

            if (isNaN(lat) || isNaN(lng)) {
                console.warn('Coordonnées invalides pour écluse:', lock.nom);
                return;
            }

            // Créer le HTML de l'étiquette (utilisé pour le label)
            const labelHtml = `<div id="lock-label" style="
                background-color: white;
                padding: 7px 10px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: 600;
                border: 1px solid #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;                
                text-align: center;                
                color: #333;
            ">${lock.nom_formulaire || lock.nom}</div>`;

            const marker = L.marker([lat, lng], {
                icon: this.createLockIcon(),
                title: lock.nom
            });

            // Stocker les infos du lock dans le marker pour les utiliser plus tard
            marker.lock = lock;
            marker.labelHtml = labelHtml;

            marker.addTo(this.markersLayer);
            this.lockMarkers.push(marker); // Stocker le marqueur

            // Créer le label avec le même HTML
            const labelIcon = L.divIcon({
                className: 'lock-label lock-label-icon',
                html: labelHtml,
                iconSize: [120, 35],
                iconAnchor: [52.5, 35],
            });

            const label = L.marker([lat, lng], { icon: labelIcon });
            label.addTo(this.labelsLayer);
        });

        // Initialiser la visibilité des labels
        this.updateLabelsVisibility();
    }

    /**
     * Met à jour la visibilité des labels des écluses selon le zoom
     * Affiche les labels à partir du zoom défini par this.zoomThreshold
     */
    updateLabelsVisibility() {
        const currentZoom = this.map.getZoom();

        if (currentZoom >= this.zoomThreshold) {
            // Afficher les labels
            if (!this.map.hasLayer(this.labelsLayer)) {
                this.labelsLayer.addTo(this.map);
            }
        } else {
            // Masquer les labels
            if (this.map.hasLayer(this.labelsLayer)) {
                this.map.removeLayer(this.labelsLayer);
            }
        }
    }

    /**
     * Configure le listener de zoom pour afficher/masquer les labels des écluses
     * Cette fonction doit être appelée APRÈS que addLocks() ait créé les labels
     */
    setupLockLabelsZoomListener() {
        console.log('[MapManager] Configuration du listener de zoom');
        
        // Retirer l'ancien listener s'il existe
        if (this._zoomListener) {
            this.map.off('zoomend', this._zoomListener);
        }
        
        // Créer le nouveau listener
        this._zoomListener = () => {
            const zoom = this.map.getZoom();
            this.updateLabelsVisibility();
        };
        
        // Ajouter le listener
        this.map.on('zoomend', this._zoomListener);
        
        // Appeler une première fois pour initialiser
        this.updateLabelsVisibility();
    }

    /**
     * Ajoute les marqueurs des bateaux
     * @param {Boat[]} boats - Tableau des bateaux
     * @param {Lock} locks - Tableau des écluses
     * @param {Channel} channel - Tableau des écluses
     * @param {Function} onBoatClick - Callback pour le clic
     */
    addBoats(boats, locks, channel, onBoatClick) {

        if (!boats || boats.length === 0) {
            console.warn("⚠️ [MapManager.addBoats()] Pas de bateaux");
            return;
        }

        if (!locks || locks.length === 0) {
            console.warn("⚠️ [MapManager.addBoats()] Pas d'écluses");
            return;
        }

        try {
            // Dédupliquer les bateaux (garder le plus récent par nom)
            const deduplicatedBoats = deduplicateBoats(boats);


            // Grouper les bateaux par position géographique (lat, lng)
            // Les bateaux Montant/Descendant au même endroit seront ensemble
            const boatsByGeoPosition = new Map();

            deduplicatedBoats.forEach(boat => {
                const numEcluse = boat.id_ecluse;
                const sens = boat.sens;

                if (numEcluse === null || numEcluse === undefined) {
                    console.warn(`⚠️ [MapManager.addBoats()] Bateau ${boat.nom_bateau} sans id_ecluse`);
                    return;
                }

                if (!sens) {
                    console.warn(`⚠️ [MapManager.addBoats()] Bateau ${boat.nom_bateau} sans sens`);
                    return;
                }

                // Trouver l'écluse qui correspond EXACTEMENT à ce bateau (id_ecluse + sens)
                const lock = locks.find(l => l.id_ecluse === numEcluse && l.sens === sens);


                if (!lock) {
                    console.warn(`⚠️ [MapManager.addBoats()] Écluse non trouvée pour #${numEcluse} (${sens})`);
                    return;
                }

                if (!lock.point_geo_bief) {
                    console.warn(`⚠️ [MapManager.addBoats()] point_geo_bief manquant pour #${numEcluse} (${sens})`);
                    return;
                }

                // Clé de position: utiliser les coordonnées géographiques
                // Cela regroupe les bateaux à la même position physique
                const geoKey = `${lock.point_geo_bief.lat},${lock.point_geo_bief.lon}`;

                if (!boatsByGeoPosition.has(geoKey)) {
                    boatsByGeoPosition.set(geoKey, {
                        boats: [],
                        lat: lock.point_geo_bief.lat,
                        lng: lock.point_geo_bief.lon
                    });
                }

                boatsByGeoPosition.get(geoKey).boats.push(boat);
            });

            // Créer les marqueurs pour chaque position géographique
            boatsByGeoPosition.forEach((data, geoKey) => {
                const boatList = data.boats;

                // Compter les bateaux par direction
                const countByDirection = boatList.reduce((acc, boat) => {
                    const direction = boat.sens || 'Inconnu';
                    acc[direction] = (acc[direction] || 0) + 1;
                    return acc;
                }, {});

                // Créer le marqueur avec les totaux montant et descendant
                const marker = L.marker([data.lat, data.lng], {
                    icon: this.createBoatIcon(countByDirection['Montant'] || 0, countByDirection['Descendant'] || 0),
                    title: `${boatList.length} bateau(x)`
                });

                // Ajouter un callback pour le clic
                marker.on('click', () => {
                    if (onBoatClick) {
                        onBoatClick(boatList);
                    }
                });

                marker.addTo(this.markersLayer);
                this.currentMarkers.push(marker);
            });
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout des bateaux:', error);
        }
    }

    /**
     * Crée une icône personnalisée pour les bateaux
     * @param {number} nbMontant - Nombre de bateaux montant
     * @param {number} nbDescendant - Nombre de bateaux descendant
     * @returns {L.DivIcon} Icône customisée
     */
    createBoatIcon(nbMontant = 0, nbDescendant = 0) {
        return L.divIcon({
            className: 'custom-icon boat-icon',
            html: `
                <div style="position:relative; width:100%; height:100%;">
                    <img src="/assets/images/icons/boat.svg" alt="Bateau" style="width: 100%; height: 100%; object-fit: contain;">
                    ${nbMontant > 0 || nbDescendant > 0 ? `
                        <div class="marker-infos">
                            ${nbDescendant > 0 ? `<div class="marker-direction">
                                <p class="marker-letter" style="background-color: #AFCB56;">D</p>
                                <p class="marker-count">${nbDescendant}</p>
                            </div>` : ""}
                            ${nbMontant > 0 ? `<div class="marker-direction">
                                <p class="marker-letter" style="background-color: #F1B453;">M</p>
                                <p class="marker-count">${nbMontant}</p>
                            </div>` : ""}
                        </div>`
                    : ""}
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    }

    /**
     * Crée une icône personnalisée pour les écluses
     * @returns {L.DivIcon} Icône customisée
     */
    createLockIcon() {
        return L.divIcon({
            className: 'custom-icon lock-icon',
            html: '<div style="pointer-events: none; cursor: default;"></div>',
            iconSize: [3, 3],
            iconAnchor: [1, 1],
        });
    }

    /**
     * Configure la visibilité des marqueurs d'écluse en fonction du zoom
     * Les marqueurs d'écluse deviennent progressivement moins visibles au dézoom
     */
    setupLockMarkersZoomListener() {
        const updateLockMarkersOpacity = () => {
            const currentZoom = this.map.getZoom();

            let opacity = 0.4;
            if (currentZoom >= 13) {
                opacity = 1;
            } else if (currentZoom >= 12) {
                opacity = 0.8;
            } else if (currentZoom >= 10) {
                opacity = 0.6;
            }

            this.lockMarkers.forEach(marker => {
                const element = marker.getElement();
                if (element) {
                    element.style.opacity = opacity;
                }
            });
        };

        // Appeler une première fois
        updateLockMarkersOpacity();

        // Mettre à jour à chaque changement de zoom
        this.map.on('zoomend', updateLockMarkersOpacity);
    }

    /**
     * @param {Object} channel - L'objet canal
     * @param {Function} onBoatClick - Callback pour le clic sur un bateau
     * @param {Lock[]} locks - (Optionnel) Écluses déjà chargées. Si omis, sont fetchées depuis l'API
     * @param {Array} boats - (Optionnel) Bateaux déjà chargés. Si omis, sont fetchés depuis l'API
     */
    async loadChannel(channel, onBoatClick, locks = null, boats = null) {
        this.initMap(channel);

        try {
            // Si les locks ne sont pas fournis, les fetch depuis l'API
            if (!locks) {
                const locksResponse = await fetchLocksForChannel(channel.secteur_appli);
                locks = locksResponse.results || [];
            }

            // Si les bateaux ne sont pas fournis, les fetch depuis l'API
            if (!boats) {
                const boatsResponse = await fetchBoatsForChannel(channel.secteur_appli, this.app.navigationManager.selectedDay);
                boats = boatsResponse.results || [];
            }

            this.addLocks(locks);
            this.addBoats(boats, locks, channel, onBoatClick);

            // Configurer le listener de zoom pour les labels
            this.setupLockLabelsZoomListener();

            // Ajuster la vue pour afficher toutes les écluses
            if (locks && locks.length > 0) {
                const bounds = locks.map(lock => {
                    if (!lock.geo_point) return null;

                    const [lat, lng] = lock.geo_point
                        .split(',')
                        .map(coord => parseFloat(coord.trim()));

                    if (isNaN(lat) || isNaN(lng)) return null;

                    return [lat, lng];
                }).filter(coord => coord !== null);

                this.map.fitBounds(L.latLngBounds(bounds), { padding: [20, 20] });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données de la carte:', error);
            throw error;
        }
    }

    /**
     * Nettoie tous les marqueurs de la carte
     */
    clearMarkers() {
        this.markersLayer.clearLayers();
        this.currentMarkers = [];
        this.lockMarkers = [];
        this.boatsClickHandlers.clear();

        // Retirer les listeners de zoom
        if (this.map) {
            this.map.off('zoomend');
        }
    }

    /**
     * Redimensionne la carte (utile après un changement d'orientation)
     */
    resize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }

    /**
     * Retourne l'instance de la carte
     * @returns {L.Map} Instance Leaflet
     */
    getMap() {
        return this.map;
    }
}

export default MapManager;
