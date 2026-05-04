import { sortBoatsByTimeDescending } from "./utils/dateTimeutils.js";
import { createBoatDetailsCard } from "./ui/boatsCardDetails.js";
import { getNextEcluses } from "./utils/eclus.js";

/** @typedef {import('./types/Boat').Boat} Boat */

export default class NavigationManager {
    /** @type {Element | null} */
    pagesHome;

    /** @type {Element | null} */
    pagesMap;

    /** @type {Element | null} */
    bntHomeFooter;

    /**
     * @typedef {Object} UIElements
     * @property {HTMLElement | null} boatsModal
     * @property {HTMLElement | null} boatsList
     * @property {HTMLElement | null} modalClose
     * @property {HTMLElement | null} modalTitle
     */
    elements;

    constructor() {
        this.pagesHome = document.querySelector("#home-page");
        this.pagesMap = document.querySelector("#map-page");
        this.bntHomeFooter = document.querySelector("#bnt-home-footer");

        this.elements = {
            boatsModal: document.getElementById('boats-modal'),
            boatsList: document.getElementById('boats-list'),
            modalClose: document.querySelector('.modal-close'),
            modalTitle: document.querySelector('.modal-content h2'),
        };

        this.setupEventListeners();
    }

    /**
     * setup des évent listeners pour la navigation
     */
    setupEventListeners() {
        // Fermer la modal au clic sur le background
        this.elements.boatsModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.boatsModal) {
                this.closeModal();
            }
        });

        // Fermeture de la modal
        this.elements.modalClose?.addEventListener('click', () => this.closeModal());

        // Fermer la modal avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Pour nagiver vers une page
     * @param {"home" | "map"} pageName Le nom de la page vers laquelle naviguer
     */
    navigate(pageName) {
        this.pagesHome && pageName === "home" ? this.pagesHome.classList.remove("hidden") : this.pagesHome?.classList.add("hidden");
        this.pagesMap && pageName === "map" ? this.pagesMap.classList.remove("hidden") : this.pagesMap?.classList.add("hidden");

        // change l'état du bouton home dans le footer
        pageName === "home" ? this.bntHomeFooter?.classList.add("active") : this.bntHomeFooter?.classList.remove("active");
    }

    /**
     * ouvre le modal de détails des bateaux
     * @param {Boat[]} boats - Liste des bateaux à afficher (déjà filtrés par jour via l'API)
     * @param {"eclus" | "nombreBoats"} titleType - eclus affiche entre les 2 écluses actuel, nombreBoats affiche le nombre de bateaux à cet endroit
     */
    openModal(boats, titleType) {
        this.elements.boatsList.innerHTML = '';

        if (boats && boats.length === 0) {
            this.elements.boatsList.innerHTML =
                '<p style="text-align: center; color: #999;">Pas de bateaux à cet endroit</p>';
        } else {
            // Trier les bateaux par heure décroissante (plus récents d'abord)
            const sortedBoats = sortBoatsByTimeDescending(boats);

            sortedBoats.forEach(boat => {
                const boatEl = createBoatDetailsCard(boat);
                this.elements.boatsList.appendChild(boatEl);
            });
        }

        this.elements.boatsModal.classList.remove('hidden');

        const newtEcluses = getNextEcluses(boats[0]?.ecluse || "", boats[0]?.sens || "").nextEcluse;

        // change le titre de la modal
        this.elements.modalTitle.textContent = titleType === "eclus" ?
            `${boats[0]?.ecluse || ''} / ${newtEcluses || ''}` :
            `${boats.length} bateau${boats.length > 1 ? 'x' : ''}`;

        // Scroll vers le haut de la modal
        setTimeout(() => {
            this.elements.boatsList.scrollTop = 0;
        }, 0);
    }

    /**
     * Ferme la modal de détails des bateaux
     */
    closeModal() {
        this.elements.boatsModal.classList.add('hidden');
    }
}