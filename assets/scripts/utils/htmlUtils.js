/**
 * Utilitaire: échappe les caractères HTML
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
export function escapeHtml(text) {
    // crée une balise p html
    const element = document.createElement("p");

    // ajoute le texte échappé a l'élément
    element.textContent = text;

    // retourne élément HTML sous forme de string
    return element.innerHTML;
}