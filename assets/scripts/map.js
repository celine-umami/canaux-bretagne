/**
 * Module de gestion de la carte Leaflet
 * Responsable de l'initialisation et du rendu de la carte
 */

import { fetchLocksForChannel, fetchBoatsForChannel } from './data.js';

class MapManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.pathLayer = null;
        this.markersLayer = null;
        this.currentMarkers = [];
        this.boatsClickHandlers = new Map();
    }

    /**
     * Initialise la carte Leaflet
     * @param {Object} channel - L'objet canal
     */
    initMap(channel) {
        if (this.map) {
            // Réinitialiser la vue avec des coordonnées par défaut
            this.map.setView([48, -2], 8);
        } else {
            // Créer la carte avec un centre par défaut (centre de la Bretagne)
            this.map = L.map(this.containerId).setView([48, -2], 8);

            // Ajouter la couche OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution:
                    '© OpenStreetMap contributors',
                maxZoom: 19,
                maxNativeZoom: 18
            }).addTo(this.map);

            // ajoute le contrôle de plein écran
            this.map.addControl(new L.Control.FullScreen());

            // Créer des couches pour les éléments
            this.pathLayer = L.featureGroup().addTo(this.map);
            this.markersLayer = L.featureGroup().addTo(this.map);
        }

        // Nettoyer les marqueurs précédents
        this.clearMarkers();
    }

    /**
     * Affiche le tracé d'un canal sur la carte
     * @param {Array} pathCoordinates - Tableau des coordonnées [lat, lng] du canal
     */
    drawChannelPath(pathCoordinates) {
        // Supprimer l'ancien tracé
        this.pathLayer.clearLayers();

        if (!pathCoordinates || pathCoordinates.length === 0) {
            return;
        }

        // Dessiner la ligne du canal
        const polyline = L.polyline(pathCoordinates, {
            color: '#4a90e2',
            weight: 4,
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round'
        });

        polyline.addTo(this.pathLayer);

        // Ajuster la vue pour afficher le canal
        if (pathCoordinates.length > 0) {
            this.map.fitBounds(L.latLngBounds(pathCoordinates), {
                padding: [50, 50]
            });
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

        locks.forEach(lock => {
            // Parser geo_point "lat, lng" en coordonnées
            const [lat, lng] = lock.geo_point.split(',').map(coord => parseFloat(coord.trim()));

            if (isNaN(lat) || isNaN(lng)) {
                console.warn('Coordonnées invalides pour écluse:', lock.nom);
                return;
            }

            const marker = L.marker([lat, lng], {
                icon: this.createLockIcon(),
                title: lock.nom
            });

            marker.bindPopup(`
                <strong>${lock.nom_formulaire || lock.nom}</strong><br/>
                <small>Numéro: ${lock.num_ecluse}</small><br/>
                <small>Sens: ${lock.sens || 'N/A'}</small>
            `);

            marker.addTo(this.markersLayer);
        });
    }

    /**
     * Déduplique les bateaux en gardant le plus récent par nom
     * @param {Array} boats - Tableau des bateaux
     * @returns {Array} Bateaux dédupliqués (le plus récent par nom_bateau)
     */
    deduplicateBoats(boats) {
        const boatsByName = new Map();

        boats.forEach(boat => {
            const name = boat.nom_bateau;
            if (!name) return;

            const existing = boatsByName.get(name);

            // Comparer les timestamps idtech
            if (!existing) {
                boatsByName.set(name, boat);
            } else {
                // Garder le plus récent (idtech le plus grand)
                const existingTime = new Date(existing.idtech).getTime();
                const newTime = new Date(boat.idtech).getTime();

                if (newTime > existingTime) {
                    boatsByName.set(name, boat);
                }
            }
        });

        const deduped = Array.from(boatsByName.values());
        return deduped;
    }

    /**
     * Génère un point aléatoire entre deux coordonnées
     */
    getRandomPointBetween(lat1, lng1, lat2, lng2) {
        const offsetLat = (Math.random() - 0.5) * 0.01;
        const offsetLng = (Math.random() - 0.5) * 0.01;
        const randomLat = lat1 + (lat2 - lat1) * (0.3 + Math.random() * 0.4) + offsetLat;
        const randomLng = lng1 + (lng2 - lng1) * (0.3 + Math.random() * 0.4) + offsetLng;
        return [randomLat, randomLng];
    }

    /**
     * Groupe les bateaux par bief (paire d'écluses)
     * @param {Array} boats - Tableau des bateaux
     * @param {Array} locks - Tableau des écluses
     * @returns {Map} Map avec clé "numEcluse|sens" et valeur = tableau de bateaux
     */
    groupBoatsByBief(boats, locks) {
        const boatsByBief = new Map();


        // Grouper les bateaux par bief
        boats.forEach(boat => {
            const numEcluse = boat.num_ecluse;
            const sens = boat.sens;

            if (numEcluse === null || numEcluse === undefined || !sens) {
                console.warn(`⚠️ Bateau ${boat.nom_bateau} sans num_ecluse ou sens`);
                return;
            }

            // Clé pour identifier le bief: "numEcluse|sens"
            const biefKey = `${numEcluse}|${sens}`;

            if (!boatsByBief.has(biefKey)) {
                boatsByBief.set(biefKey, []);
            }
            boatsByBief.get(biefKey).push(boat);

        });

        return boatsByBief;
    }

    /**
     * Trouve les coordonnées des deux écluses d'un bief
     * @param {number} numEcluse - Numéro de l'écluse
     * @param {string} sens - Direction (Montant ou Descendant)
     * @param {Array} locks - Tableau de toutes les écluses
     * @returns {Object|null} {lock1, lock2} ou null si non trouvable
     */
    findBiefLocks(numEcluse, sens, locks) {
        // Trouver l'écluse actuelle
        const currentLock = locks.find(l => l.num_ecluse === numEcluse);

        if (!currentLock) return null;

        if (sens === "Montant") {
            // Montant: chercher l'écluse suivante (numéro + 1)
            const nextLock = locks.find(l => l.num_ecluse === numEcluse + 1);
            return nextLock ? { lock1: currentLock, lock2: nextLock } : null;
        } else {
            // Descendant: chercher l'écluse précédente (numéro - 1)
            const prevLock = locks.find(l => l.num_ecluse === numEcluse - 1);
            return prevLock ? { lock1: prevLock, lock2: currentLock } : null;
        }
    }

    /**
     * Ajoute les marqueurs des bateaux groupés par bief
     * @param {Array} boats - Tableau des bateaux
     * @param {Array} locks - Tableau des écluses
     * @param {Function} onBoatClick - Callback pour le clic
     */
    addBoats(boats, locks, onBoatClick) {

        if (!boats || boats.length === 0 || !locks || locks.length === 0) {
            console.warn("⚠️ Pas de bateaux ou d'écluses");
            return;
        }

        try {
            // Dédupliquer les bateaux (garder le plus récent par nom)
            const deduplicatedBoats = this.deduplicateBoats(boats);

            // Grouper les bateaux par bief
            const boatsByBief = this.groupBoatsByBief(deduplicatedBoats, locks);

            if (boatsByBief.size === 0) {
                console.warn("⚠️ Aucun bateau groupé!");
            }

            // Créer les marqueurs pour chaque bief
            boatsByBief.forEach((boatsInBief, biefKey) => {
                const [numEcluseStr, sens] = biefKey.split('|');
                const numEcluse = parseInt(numEcluseStr, 10);

                // Trouver les deux écluses du bief
                const biefLocks = this.findBiefLocks(numEcluse, sens, locks);
                if (!biefLocks) {
                    console.warn(`⚠️ Biefs locks non trouvés pour: #${numEcluse} (${sens})`);
                    return;
                }

                // Placer un marqueur aléatoire entre les deux écluses
                const [lat1, lng1] = biefLocks.lock1.geo_point.split(',').map(c => parseFloat(c.trim()));
                const [lat2, lng2] = biefLocks.lock2.geo_point.split(',').map(c => parseFloat(c.trim()));

                const [markerLat, markerLng] = this.getRandomPointBetween(lat1, lng1, lat2, lng2);


                // compte le nombre de bateux par direction
                const countByDirection = boatsInBief.reduce((acc, boat) => {
                    const direction = boat.sens || 'Inconnu';
                    acc[direction] = (acc[direction] || 0) + 1;
                    return acc;
                }, {});

                // Créer le marqueur
                const marker = L.marker([markerLat, markerLng], {
                    icon: this.createBoatIcon(countByDirection['Montant'], countByDirection['Descendant']),
                    title: `${boatsInBief.length} bateau(x)`
                });

                // Ajouter un callback pour le clic
                marker.on('click', () => {
                    if (onBoatClick) {
                        onBoatClick(boatsInBief);
                    }
                });

                marker.addTo(this.markersLayer);
                this.currentMarkers.push(marker);

                // L.marker([markerLat, markerLng]).addTo(this.markersLayer);
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
            html: '',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        });
    }

    /**
     * Charge tous les éléments pour un canal (tracé, écluses, bateaux)
     * @param {Object} channel - L'objet canal
     * @param {Function} onBoatClick - Callback pour le clic sur un bateau
     */
    async loadChannel(channel, onBoatClick) {
        this.initMap(channel);

        try {
            // Charger les écluses et bateaux en parallèle
            const [locks, boats] = await Promise.all([
                fetchLocksForChannel(channel.voie_navigable),
                fetchBoatsForChannel(channel.voie_navigable)
            ]);

            this.addLocks(locks.results);
            this.addBoats(boats.results, locks.results, onBoatClick);


            // Ajuster la vue pour afficher toutes les écluses
            if (locks && locks.results.length > 0) {
                const bounds = locks.results.map(lock => {
                    const [lat, lng] = lock.geo_point.split(',').map(coord => parseFloat(coord.trim()));
                    return [lat, lng];
                });
                this.map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
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
        this.boatsClickHandlers.clear();
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
