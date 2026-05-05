/**
 * Module de gestion de l'interface utilisateur
 * Gère les interactions DOM, le dropdown et la modal
 */

/** @typedef {import('./types/Channel').Channel} Channel */

class UIManager {
    /**
     * @typedef {Object} UiElements
     * @property {HTMLSelectElement | null} channelSelect
     * @property {HTMLSelectElement | null} subChannelSelect
     * @property {HTMLElement | null} mapContainer
     */
    /** @type {UiElements} */
    elements;

    constructor() {
        this.elements = {
            channelSelect: document.getElementById('channel-select'),
            subChannelSelect: document.getElementById('subchannel-select'),
            mapContainer: document.getElementById('map')
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

        // les voie navigable qui on une sous section déja rajouter au dropdown pour éviter les doublons
        const voieNavigableSousSection = [];

        // Ajouter les options
        channels.forEach(channel => {

            // si il a pas de sous section grace a displayName c'est une section, sinon c'est un canal
            if (!channel.displayName || !voieNavigableSousSection.includes(channel.voie_navigable)) {
                const option = document.createElement('option');
                // Utiliser displayName si disponible (pour les sections), sinon voie_navigable
                const displayText = channel.voie_navigable;
                // Utiliser id comme value si disponible, sinon voie_navigable
                const value = channel.id || channel.voie_navigable;

                option.value = value;
                option.textContent = displayText;
                this.elements.channelSelect.appendChild(option);

                if (channel.displayName) {
                    voieNavigableSousSection.push(channel.voie_navigable);
                }
            }
        });

        // Sélectionner le premier canal par défaut
        if (channels.length > 0) {
            const firstChannelValue = channels[0].id || channels[0].voie_navigable;
            this.elements.channelSelect.value = firstChannelValue;
        }

        // Écouter les changements
        this.elements.channelSelect.addEventListener('change', (e) => {
            onChannelChange(e.target.value);
        });

        // Écouter les changements de la sous section
        this.elements.subChannelSelect.addEventListener('change', (e) => {
            onChannelChange(e.target.value, true);
        });
    }


    /**
     * Réinitialise le dropdown des sous-canaux (le vide et remet le bonne option par défaut)
     * @param {Channel} channelSelected - Le canal sélectionné pour remplir les sous sections
     * @param {Channel[]} allChannels - La liste de tous les canaux pour trouver les sous sections du canal sélectionné
     */
    resetSubChannelSelect(channelSelected, allChannels) {
        // supprime les options précédentes
        this.elements.subChannelSelect.innerHTML = '';

        // Ajouter les options
        allChannels.forEach(channel => {

            // si il a pas de sous section grace a displayName c'est une section, sinon c'est un canal
            if (channel.voie_navigable === channelSelected.voie_navigable) {
                const option = document.createElement('option');
                const displayText = channel.displayName || channel.voie_navigable;
                const value = channel.id || channel.voie_navigable;

                option.value = value;
                option.textContent = displayText;
                this.elements.subChannelSelect.appendChild(option);
            }
        });

        this.elements.subChannelSelect.classList.remove('hidden');
        this.elements.subChannelSelect.value = channelSelected.id || channelSelected.voie_navigable;
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
     * Change le canal sélectionné dans le dropdown
     * @param {string} channelId 
     */
    handleChangeCannel(channelId) {
        this.elements.channelSelect.value = channelId;
    }

    /**
     * Affiche un indicateur de chargement
     */
    showLoading() {
        this.elements.mapContainer.classList.add('loading');
        this.disableChannelSelect();
    }

    /**
     * Cache l'indicateur de chargement
     */
    hideLoading() {
        this.elements.mapContainer.classList.remove('loading');
        this.enableChannelSelect();
    }
}

export default UIManager;
