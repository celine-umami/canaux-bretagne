/**
 * Point d'entrée principal de l'application
 * Orchestration entre les différents modules
 */

import { fetchChannel, fetchBoatsForChannel, fetchLocksForChannel } from './data/data.js';
import { logConfig } from './data/config.js';
import MapManager from './managers/map.js';
import UIManager from './managers/ui.js';
import NavigationManager from "./managers/navigation.js";
import HomePageManager from "./managers/home.js";
import { formatDateToFrench } from './utils/dateTimeutils.js';

/** @typedef {import('./types/Boat').Boat} Boat */
/** @typedef {import('./types/Channel').Channel} Channel */
/** @typedef {import('./types/Lock').Lock} Lock */

class Application {
    constructor() {
        /** @type {MapManager} */
        this.mapManager = new MapManager(this, 'map');

        /** @type {UIManager} */
        this.uiManager = new UIManager(this);

        /** @type {NavigationManager} */
        this.navigationManager = new NavigationManager(this);

        /** @type {HomePageManager} */
        this.homePageManager = new HomePageManager(this);

        /** @type {Channel[]} */
        this.channels = [];

        this.currentChannel = null;
        this.boats = [];

        /** @type {Lock[]} */
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

            await this.loadAllBoats();

            this.homePageManager.renderChannelList(this.channels.results);


            if (!this.channels.results || this.channels.results.length === 0) {
                throw new Error('Aucun canal disponible');
            }

            // Initialiser le dropdown avec les canaux
            this.uiManager.initChannelSelect(this.channels.results, (channelId) => this.handleChannelSelect(channelId));

            // Charger le canal par défaut (le premier de la liste)
            await this.loadChannel(this.channels.results[0]);

            // Initialiser la page d'accueil (masque le bouton yesterday et affiche le footer correctement)
            this.navigationManager.navigate("home");

        } catch (error) {
            this.uiManager.showError('Erreur lors de l\'initialisation de l\'application');
            console.error(error);
        }
    }

    /**
     * Charge tous les bateaux pour tous les cannaux et les stocke dans this.allBoats pour un accès rapide
     * @param {Date | null} [targetDate] - la date du jour pour laquelle on veut charger les bateaux (aujourd'hui ou hier)
     */
    async loadAllBoats(targetDate = null) {
        // Récupére tout les bateaux pour les stocker et les utiliser plus tard
        await Promise.all(
            this.channels.results
                .map(async (ch) => {
                    const boatsForChannel = this.mapManager.deduplicateBoats((await fetchBoatsForChannel(ch, targetDate)).results || []);

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
    }

    /**
     * change le canal afficher correctement en changeant les dropdown et en affichant la bonne section ou sous section
     * @param {string} channelId id du canal ou de la sous section à afficher
     */
    handleChannelSelect(channelId) {
        const channelSelected = this.channels.results.find(ch => (ch.id || ch.voie_navigable) === channelId);

        if (channelSelected) {
            // change le visuel des dropdown pour correspondre au canal sélectionné
            this.uiManager.handleChangeCannel(channelSelected, this.channels.results);
        }

        this.handleChannelChange(channelId)
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
            });
        }

        // boutton pour aujourd'hui
        if (btnToday) {
            btnToday.addEventListener('click', () => {
                // Activer le bouton today
                if (btnYesterday) btnYesterday.classList.remove('active');
                btnToday.classList.add('active');

                const today = new Date();
                this.navigationManager.setNewSelectedDay(null);
            });
        }

        // boutton pour hier
        if (btnYesterday) {
            btnYesterday.addEventListener('click', () => {
                // Activer le bouton yesterday
                if (btnToday) btnToday.classList.remove('active');
                btnYesterday.classList.add('active');

                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                this.navigationManager.setNewSelectedDay(yesterday);
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
            this.boats = await fetchBoatsForChannel(channel, this.navigationManager.selectedDay);



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
        this.navigationManager.openModal(boats, "eclus");
    }
}

// export de l'application pour avoir acces au typage
export default Application;

// Initialiser l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init();

    // Rendre l'instance globale pour le debug et les operations externes
    window.app = app;
    window.mapManager = app.mapManager;
    window.uiManager = app.uiManager;
    window.navigationManager = app.navigationManager;
    window.homePageManager = app.homePageManager;
});