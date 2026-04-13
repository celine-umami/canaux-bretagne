/**
 * Extrait l'heure d'un timestamp ISO 8601
 * @param {string} timestamp - Format: 2026-03-13T10:56:06.683+01:00
 * @returns {string} L'heure au format HH:MM
 */
export function extractTimeFromTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        const date = new Date(timestamp);

        const time = date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });

        return time;
    } catch (error) {
        console.error('Erreur extraction heure:', error);
        return timestamp;
    }
}