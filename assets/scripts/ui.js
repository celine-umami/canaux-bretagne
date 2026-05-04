/**
 * Module de gestion de l'interface utilisateur
 * Gère les interactions DOM, le dropdown et la modal
 */

class UIManager {
    constructor() {
        this.elements = {
            channelSelect: document.getElementById('channel-select'),
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

        // Ajouter les options
        channels.forEach(channel => {
            const option = document.createElement('option');
            // Utiliser displayName si disponible (pour les sections), sinon voie_navigable
            const displayText = channel.displayName || channel.voie_navigable;
            // Utiliser id comme value si disponible, sinon voie_navigable
            const value = channel.id || channel.voie_navigable;

            option.value = value;
            option.textContent = displayText;
            this.elements.channelSelect.appendChild(option);
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
    }

    /**
     * Réactive le dropdown
     */
    enableChannelSelect() {
        this.elements.channelSelect.disabled = false;
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
