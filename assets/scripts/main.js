/**
 * Point d'entrée principal de l'application
 * Orchestration entre les différents modules
 */

import { fetchChannel, fetchBoatsForChannel, fetchLocksForChannel } from './data.js';
import { logConfig } from './config.js';
import MapManager from './map.js';
import UIManager from './ui.js';
import NavigationManager from "./navigation.js";
import { HomePageManager } from "./home.js";

/** @typedef {import('./types/Boat').Boat} Boat */

/**
 * Formate une date au format "XX mois XXXX"
 * @param {Date} date - La date à formater
 * @returns {string} La date formatée
 */
function formatDateToFrench(date) {
    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

class Application {
    constructor() {
        /** @type {MapManager} */
        this.mapManager = new MapManager('map');

        /** @type {UIManager} */
        this.uiManager = new UIManager();

        /** @type {NavigationManager} */
        this.navigationManager = new NavigationManager();

        /** @type {HomePageManager} */
        this.homePageManager = new HomePageManager();

        this.channels = [];
        this.currentChannel = null;
        this.boats = [];
        this.locks = [];

        /**
         * @type {Object.<string, Object.<string, Boat[]>>} allBoats - un objet avec une clé par cannal et tout les bateaux d'un canal
         */
        this.allBoats = {};
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
            // Initialiser le footer
            this.initFooter();

            // Récupérer la liste des canaux (dynamique ou mock)
            this.channels = await fetchChannel();
            // Récupére tout les bateaux pour les stocker et les utiliser plus tard
            await Promise.all(
                this.channels.results
                    .map(async (ch) => {
                        const boatsForChannel = this.mapManager.deduplicateBoats((await fetchBoatsForChannel(ch)).results || []);

                        // Filtrer les bateaux pour correspondre à la plage d'écluses du sous-canal
                        const filteredBoats = boatsForChannel.filter(boat => {
                            if (!ch.minEcluse && !ch.maxEcluse) return true; // Si pas de plage d'écluses, on prend tous les bateaux
                            return (boat.num_ecluse >= ch.minEcluse && boat.num_ecluse <= ch.maxEcluse)
                        });

                        if (!this.allBoats[ch.voie_navigable]) {
                            this.allBoats[ch.voie_navigable] = {};
                        }

                        this.allBoats[ch.voie_navigable][ch.id] = filteredBoats;
                    })
            );

            this.homePageManager.renderChannelList(this.channels.results);


            if (!this.channels.results || this.channels.results.length === 0) {
                throw new Error('Aucun canal disponible');
            }

            // Initialiser le dropdown avec les canaux
            this.uiManager.initChannelSelect(this.channels.results, (channelId) =>
                this.handleChannelChange(channelId)
            );

            // Charger le canal par défaut (le premier de la liste)
            await this.loadChannel(this.channels.results[0]);

            this.navigationManager.navigate("home");

        } catch (error) {
            this.uiManager.showError('Erreur lors de l\'initialisation de l\'application');
            console.error(error);
        }
    }

    /**
     * Initialise le footer avec les dates
     */
    initFooter() {
        // Gérer la date de aujourd'hui et hier
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Formater les dates
        const todayStr = formatDateToFrench(today);
        const yesterdayStr = formatDateToFrench(yesterday);

        // Remplir les boutons
        const btnToday = document.getElementById('btn-today');
        const btnTodayText = btnToday.querySelector('p');
        const btnYesterday = document.getElementById('btn-yesterday');

        if (btnTodayText) {
            // met le texte dans la balise p à l'intérieur du bouton
            btnTodayText.textContent = todayStr;
        }

        // Ajouter les event listeners
        const btnHome = document.querySelector('.footer-home');
        if (btnHome) {
            btnHome.addEventListener('click', () => {
                this.navigationManager.navigate("home");
                // À implémenter: navigation vers page d'accueil
            });
        }

        if (btnToday) {
            btnToday.addEventListener('click', () => {
                // Activer le bouton today
                if (btnYesterday) btnYesterday.classList.remove('active');
                btnToday.classList.add('active');

                const today = new Date();
                this.reloadBoatsForDate(today);
            });
        }

        if (btnYesterday) {
            btnYesterday.addEventListener('click', () => {
                // Activer le bouton yesterday
                if (btnToday) btnToday.classList.remove('active');
                btnYesterday.classList.add('active');

                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                this.reloadBoatsForDate(yesterday);
            });
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

            // Récupérer et stocker les écluses pour les utiliser plus tard
            const locksResponse = await fetchLocksForChannel(channel);
            this.locks = locksResponse.results || [];

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
     * Recharge les bateaux pour une date spécifique
     * @param {Date} targetDate - La date pour laquelle afficher les bateaux
     */
    async reloadBoatsForDate(targetDate) {
        try {
            this.uiManager.showLoading();

            if (!this.currentChannel) {
                throw new Error('Aucun canal sélectionné');
            }

            // Récupérer les bateaux pour la date spécifiée
            const boatsResponse = await fetchBoatsForChannel(this.currentChannel, targetDate);
            this.boats = boatsResponse.results || [];

            // Appeler loadChannel en passant les locks et bateaux déjà chargés
            // Cela gère le nettoyage propre des marqueurs et l'ajout des nouveaux
            await this.mapManager.loadChannel(
                this.currentChannel,
                (boatGroup) => this.handleBoatClick(boatGroup),
                this.locks,
                this.boats
            );

            this.uiManager.hideLoading();
        } catch (error) {
            this.uiManager.hideLoading();
            console.error('Erreur lors du rechargement des bateaux:', error);
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
    window.navigationManager = app.navigationManager;
});
