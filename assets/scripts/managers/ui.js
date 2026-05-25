/**
 * Module de gestion de l'interface utilisateur
 * Gère les interactions DOM, le dropdown et la modal
 */

import Application from '../main.js';
/** @typedef {import('../types/Channel.js').Channel} Channel */

class UIManager {
    /**
     * @typedef {Object} UiElements
     * @property {HTMLSelectElement | null} channelSelect
     * @property {HTMLSelectElement | null} subChannelSelect
     * @property {HTMLElement | null} mapContainer
     * @property {HTMLElement | null} bntHierFooter
     * @property {HTMLElement | null} bntHaujourdiFooter
     * @property {HTMLElement | null} bntHomeFooter
     */
    /** @type {UiElements} */
    elements;

    /** @type {Application} */
    app;

    /**
     * @param {Application} app - L'instance de l'application principale pour accéder aux données et méthodes globales
     */
    constructor(app) {
        this.app = app;
        this.elements = {
            channelSelect: document.getElementById('channel-select'),
            subChannelSelect: document.getElementById('subchannel-select'),
            mapContainer: document.getElementById('map'),
            bntHierFooter: document.querySelector("#btn-yesterday"),
            bntHaujourdiFooter: document.querySelector("#btn-today"),
            bntHomeFooter: document.querySelector("#bnt-home-footer"),
        };

        this.setupEventListeners();
    }

    /**
     * Configure les event listeners
     */
    setupEventListeners() {
        // Gestion de l'orientation (mobile)
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });
    }

    /**
     * Initialise le dropdown avec les canaux
     * @param {Array} channels - Liste des canaux
     * @param {Function} onChannelChange - Callback quand le canal change
     */
    initChannelSelect(channels, onChannelChange) {

        // Vider le dropdown
        this.elements.channelSelect.innerHTML = '';

        // Ajouter chaque canal comme une option
        channels.forEach(channel => {
            const option = document.createElement('option');
            const displayText = channel.secteur_appli || channel.voie_navigable;
            const value = channel.id;

            option.value = value;
            option.textContent = displayText;
            this.elements.channelSelect.appendChild(option);
        });

        // Sélectionner le premier canal par défaut
        if (channels.length > 0) {
            this.elements.channelSelect.value = channels[0].id;
        }

        // Écouter les changements
        this.elements.channelSelect.addEventListener('change', (e) => {
            onChannelChange(e.target.value);
        });

        // Écouter les changements de la sous section
        this.elements.subChannelSelect.addEventListener('change', (e) => {
            onChannelChange(e.target.value);
        });
    }


    /**
     * Réinitialise le dropdown des sous-canaux (maintenant non utilisé)
     */
    resetSubChannelSelect(channelSelected, allChannels) {
        this.hideSubChannelSelect();
    }

    /**
     * Change les dropdown pour correspondre au canal sélectionner
     * @param {Channel} channel 
     * @param {Channel[]} allChannel 
     */
    handleChangeCannel(channel, allChannel) {
        // Cache le dropdown des sous-sections (non utilisé maintenant)
        this.hideSubChannelSelect();

        // change le dropdown de canal pour correspondre au canal sélectionner
        this.elements.channelSelect.value = channel.id;
    }

    hideSubChannelSelect() {
        this.elements.subChannelSelect.classList.add('hidden');
    }

    /**
     * Récupère l'ID du canal sélectionné
     * @returns {string} L'ID du canal
     */
    getSelectedChannelId() {
        return this.elements.channelSelect.value;
    }

    /**
     * Désactive le dropdown (pendant le chargement)
     */
    disableChannelSelect() {
        this.elements.channelSelect.disabled = true;
        this.elements.subChannelSelect.disabled = true;
    }

    /**
     * Réactive le dropdown
     */
    enableChannelSelect() {
        this.elements.channelSelect.disabled = false;
        this.elements.subChannelSelect.disabled = false;
    }

    /**
     * Affiche un message d'erreur
     * @param {string} message - Le message d'erreur
     */
    showError(message) {
        // Créer un élément pour l'erreur
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.position = 'fixed';
        errorEl.style.top = '1rem';
        errorEl.style.left = '1rem';
        errorEl.style.right = '1rem';
        errorEl.style.zIndex = '999';

        document.body.appendChild(errorEl);

        // Supprimer après 5 secondes
        setTimeout(() => {
            errorEl.remove();
        }, 5000);

        console.error(message);
    }

    /**
     * Gère le changement d'orientation (mobile)
     */
    handleOrientationChange() {
        // Attendre que le DOM se redessine
        setTimeout(() => {
            // Redimensionner la carte
            const mapInstance = window.mapManager;
            if (mapInstance) {
                mapInstance.resize();
            }
        }, 100);
    }

    /**
     * Affiche un indicateur de chargement
     */
    showLoading() {
        [
            this.elements.mapContainer,
            this.elements.bntHierFooter,
            this.elements.bntHaujourdiFooter,
            this.elements.bntHomeFooter
        ].forEach(el => el.classList.add("loading"));

        this.disableChannelSelect();

        // désactive pendant le chargement les bouton de la home page dynamique pour allez sur la map le temps que les données se charge
        document.querySelectorAll("#channel-list-container .canal-card__button, #channel-list-container .canal-card__metric").forEach((bnt) => {
            bnt.classList.add("loading");
        });
    }

    /**
     * Cache l'indicateur de chargement
     */
    hideLoading() {
        [
            this.elements.mapContainer,
            this.elements.bntHierFooter,
            this.elements.bntHaujourdiFooter,
            this.elements.bntHomeFooter
        ].forEach(el => el.classList.remove("loading"));

        this.enableChannelSelect();

        // réactve les boutton de la home page dynamique une fois que les données sont chargées
        document.querySelectorAll("#channel-list-container .canal-card__button, #channel-list-container .canal-card__metric").forEach((bnt) => {
            bnt.classList.remove("loading");
        });
    }
}

export default UIManager;
