import { createBoatDetailsCard } from "./ui/boatsCardDetails.js";
/**
 * Module de gestion de l'interface utilisateur
 * Gère les interactions DOM, le dropdown et la modal
 */

class UIManager {
    constructor() {
        this.elements = {
            channelSelect: document.getElementById('channel-select'),
            boatsModal: document.getElementById('boats-modal'),
            boatsList: document.getElementById('boats-list'),
            modalClose: document.querySelector('.modal-close'),
            mapContainer: document.getElementById('map')
        };

        this.setupEventListeners();
    }

    /**
     * Configure les event listeners
     */
    setupEventListeners() {
        // Fermeture de la modal
        this.elements.modalClose?.addEventListener('click', () => this.closeModal());

        // Fermer la modal au clic sur le background
        this.elements.boatsModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.boatsModal) {
                this.closeModal();
            }
        });

        // Fermer la modal avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

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
            // Adapter au format de l'API qui utilise voie_navigable
            option.value = channel.voie_navigable || channel.id;
            option.textContent = channel.voie_navigable || channel.name;
            this.elements.channelSelect.appendChild(option);
        });

        // Sélectionner le premier canal par défaut
        if (channels.length > 0) {
            this.elements.channelSelect.value = channels[0].voie_navigable || channels[0].id;
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
     * Affiche la modal avec les détails des bateaux
     * @param {Array} boats - Liste des bateaux à afficher
     */
    showBoatsModal(boats) {
        this.elements.boatsList.innerHTML = '';

        if (boats.length === 0) {
            this.elements.boatsList.innerHTML =
                '<p style="text-align: center; color: #999;">Pas de bateaux à cet endroit</p>';
        } else {
            boats.forEach(boat => {
                const boatEl = createBoatDetailsCard(boat);
                this.elements.boatsList.appendChild(boatEl);
            });
        }

        this.elements.boatsModal.classList.remove('hidden');

        // Scroll vers le haut de la modal
        setTimeout(() => {
            this.elements.boatsList.scrollTop = 0;
        }, 0);
    }

    /**
     * Ferme la modal
     */
    closeModal() {
        this.elements.boatsModal.classList.add('hidden');
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
