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
     * Ajoute les marqueurs des bateaux sur la carte
     * @param {Array} boats - Tableau des bateaux
     * @param {Function} onBoatClick - Callback quand on clique sur un bateau
     */
    addBoats(boats, onBoatClick) {
        if (!boats || boats.length === 0) {
            return;
        }

        boats.forEach(boat => {
            const marker = L.marker(boat.position, {
                icon: this.createBoatIcon(),
                title: boat.name
            });

            // Ajouter les informations du bateau au popup
            const popupContent = `
                <strong>${boat.name}</strong><br/>
                <small>Propriétaire: ${boat.owner}</small><br/>
                <small>Type: ${boat.type}</small><br/>
                <small>Statut: ${boat.status}</small>
            `;
            marker.bindPopup(popupContent);

            // Enregistrer le handler pour ce bateau
            marker.on('click', () => onBoatClick(boat));

            marker.addTo(this.markersLayer);
            this.currentMarkers.push(marker);
        });
    }

    /**
     * Crée une icône personnalisée pour les bateaux
     * @returns {L.DivIcon} Icône customisée
     */
    createBoatIcon() {
        return L.divIcon({
            className: 'custom-icon boat-icon',
            html: '⛵',
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
                //fetchBoatsForChannel(channel.voie_navigable)
            ]);


            this.addLocks(locks.results);
            //this.addBoats(boats, onBoatClick);

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
