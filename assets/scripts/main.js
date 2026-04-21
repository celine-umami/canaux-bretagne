/**
 * Point d'entrée principal de l'application
 * Orchestration entre les différents modules
 */

import { fetchChannel, fetchBoatsForChannel } from './data.js';
import { logConfig } from './config.js';
import MapManager from './map.js';
import UIManager from './ui.js';

class Application {
    constructor() {
        this.mapManager = new MapManager('map');
        this.uiManager = new UIManager();
        this.channels = [];
        this.currentChannel = null;
        this.boats = [];
    }

    /**
     * Trouve un canal par son ID
     * @param {string} channelId - L'ID unique du canal (voie_navigable ou voie_navigable_section_X)
     * @returns {Object|null} Le canal trouvé ou null
     */
    getChannelById(channelId) {
        return this.channels.results.find(ch => (ch.id || ch.voie_navigable) === channelId) || null;
    }

    /**
     * Initialise l'application
     */
    async init() {
        try {

            // Récupérer la liste des canaux (dynamique ou mock)
            this.channels = await fetchChannel();


            if (!this.channels.results || this.channels.results.length === 0) {
                throw new Error('Aucun canal disponible');
            }

            // Initialiser le dropdown avec les canaux
            this.uiManager.initChannelSelect(this.channels.results, (channelId) =>
                this.handleChannelChange(channelId)
            );

            // Charger le canal par défaut (le premier de la liste)
            await this.loadChannel(this.channels.results[0]);
        } catch (error) {
            this.uiManager.showError('Erreur lors de l\'initialisation de l\'application');
            console.error(error);
        }
    }

    /**
     * Charge un canal et affiche ses données
     * @param {Object} channel - L'objet canal à charger
     */
    async loadChannel(channel) {
        try {
            this.uiManager.showLoading();

            if (!channel) {
                throw new Error(`Canal non valide`);
            }

            this.currentChannel = channel;

            // Charger les données et afficher la carte
            await this.mapManager.loadChannel(channel, (boat) =>
                this.handleBoatClick(boat)
            );

            // Récupérer les bateaux pour les utiliser later
            this.boats = await fetchBoatsForChannel(channel);



            this.uiManager.hideLoading();
        } catch (error) {
            this.uiManager.hideLoading();
            this.uiManager.showError(`Erreur lors du chargement du canal: ${error.message}`);
            console.error(error);
        }
    }

    /**
     * Gère le changement de canal via le dropdown
     * @param {string} channelId - L'ID unique du canal sélectionné
     */
    async handleChannelChange(channelId) {
        const channel = this.getChannelById(channelId);
        if (channel) {
            await this.loadChannel(channel);
        }
    }

    /**
     * Gère le clic sur un marqueur de bateau (groupe de bateaux dans un bief)
     * @param {Array} boats - Tableau des bateaux du bief cliqué
     */
    handleBoatClick(boats) {
        if (!Array.isArray(boats)) {
            boats = [boats];
        }

        // Afficher la modal avec tous les bateaux du bief
        this.uiManager.showBoatsModal(boats);
    }
}

// Initialiser l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init();

    // Rendre l'instance globale pour le debug et les operations externes
    window.app = app;
    window.mapManager = app.mapManager;
    window.uiManager = app.uiManager;
});
