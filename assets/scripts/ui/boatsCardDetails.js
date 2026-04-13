import { escapeHtml } from '../utils/htmlUtils.js';
import { extractTimeFromTimestamp } from '../utils/dateTimeutils.js';

/**
 * Configuration pour les différentes directions de navigation
 * @typedef {Object} DirectionConfig
 * @property {string} letter - Lettre représentant la direction (ex: "D" pour descendant)
 * @property {string} text - Texte complet de la direction (ex: "Descendant")
 * @property {string} color - Couleur associée à la direction (ex: "#AACB56")
 */

/**
 * Récupère la configuration de direction (lettre, texte, couleur) en fonction du sens de navigation
 * @param {string} sens - Sens de navigation du bateau (ex: "descendant", "montant")
 * @returns {DirectionConfig} Configuration du sens de navigation
 */
function getConfigDirection(sens) {
    const sensNormalized = (sens || "").toLowerCase();

    const config = {
        descendant: {
            letter: "D",
            text: "Descendant",
            color: "#AACB56"
        },
        montant: {
            letter: "M",
            text: "Montant",
            color: "#F1B453"
        }
    };

    const configDefault = {
        letter: "?",
        text: "Non renseigné",
        color: "#9E9E9E"
    };

    return config[sensNormalized] || configDefault;
}


/**
 * Détermine la destination du bateau en fonction des écluses prévues
 * @param {string | undefined} ecluses - Liste des écluses prévues par le bateux
 * @param {string} sens - Sens de navigation du bateau (ex: "descendant", "montant")
 * @returns {string} - Destination du bateau
 */
function getBoatDestination(ecluses, sens) {
    if (!ecluses) return "Inconnue";

    const eclusesList = ecluses.split(";").filter(ecluse => ecluse.trim() !== "");

    if (eclusesList.length === 0) return "Inconnue";

    let destination = "Inconnue";

    if (sens === "descendant") {
        destination = eclusesList.pop();
    } else if (sens === "montant") {
        destination = eclusesList.shift();
    }

    return eclusesList.pop();
}


/**
 * Un detail de la carte bateau (HTML)
 * @param {string} label - Label de l'information
 * @param {string} imgUrl - URL de l'icône associée à l'information
 * @param {string} info - Valeur de l'information à afficher
 * @returns {string} - HTML d'une informations d'un détail de la carte bateau
 */
function createBoatDetailsUniteInfo(label, imgUrl, info) {
    const htmlDetails = `
        <div class="boat-card-detail">
            <div class="boat-card-center-img-text">
                <img class="boat-card-img-title" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(label)} icon">
                <p class="boat-card-detail-title">${escapeHtml(label)}</p>
            </div>
            <p class="boat-card-detail-info">${escapeHtml(info)}</p>
        </div>
    `;
    return htmlDetails;
};


/**
 * Retourne une carte de détails (HTML) pour un bateau donné
 * @param {any} boat - objet contenant les informations du bateau
 * @returns {string} Carte HTML pour le bateau
 */
export function createBoatDetailsCard(boat) {

    const boatCard = document.createElement("div");
    boatCard.className = "boat-card";

    const directionConfig = getConfigDirection(boat.sens);

    boatCard.innerHTML = `
        <div class="boat-card-header" style="background-color: ${escapeHtml(directionConfig.color)}">
            <div class="boat-card-header-left">
                <div class="boat-card-center-img-text">
                    <img class="boat-card-img-boat" src="/assets/images/icons/boat.svg" alt="boat icon">
                    <p class="boat-card-name-boat">
                        ${escapeHtml(boat.nom_bateau)}
                    </p>
                </div>
                <p class="boat-card-type-boat">${escapeHtml(boat.type_embarcation)}</p>
            </div>
            <div class="boat-card-tag-direction">
                <p class="boat-card-tag-direction-letter" style="background-color: ${escapeHtml(directionConfig.color)}">
                    ${escapeHtml(directionConfig.letter)}
                </p>
                <p class="boat-card-tag-direction-text">${escapeHtml(directionConfig.text)}</p>
            </div>
        </div>

        <div class="boat-card-body">
            ${boat.idtech && createBoatDetailsUniteInfo("Passage", "/assets/images/icons/tabler_clock.svg", extractTimeFromTimestamp(boat.idtech))}
            ${boat.ecluse && createBoatDetailsUniteInfo("Destination", "/assets/images/icons/mdi_target.svg", getBoatDestination(boat.ecluses, directionConfig.text))}
            ${createBoatDetailsUniteInfo("Ecluse", "/assets/images/icons/boxicons_bridge.svg", boat.ecluse)}
            ${createBoatDetailsUniteInfo("Eclusier", "/assets/images/icons/ooui_user-avatar-outline.svg", [boat.identite, boat.prenom].filter(v => v != null && v !== "").join(" ") || "N/A")}
        </div>
    `;

    return boatCard;
}