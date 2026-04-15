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

/**
 * Filtre les bateaux pour ne garder que ceux d'aujourd'hui
 * @param {Array} boats - Liste des bateaux
 * @returns {Array} Bateaux filtrés pour aujourd'hui
 */
export function filterBoatsByToday(boats) {
    if (!boats || !Array.isArray(boats)) {
        return [];
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return boats.filter(boat => {
        if (!boat.idtech) return false;
        
        try {
            const boatDate = new Date(boat.idtech);
            console.log("🚀 --- boatDate:", boatDate);

            boatDate.setHours(0, 0, 0, 0);
                console.log("🚀 --- today:", today);

            return boatDate.getTime() === today.getTime();
        } catch (error) {
            console.error('Erreur filtre date:', error);
            return false;
        }
    });
}

/**
 * Trie les bateaux par heure de passage décroissante (plus récents d'abord)
 * @param {Array} boats - Liste des bateaux
 * @returns {Array} Bateaux triés par heure décroissante
 */
export function sortBoatsByTimeDescending(boats) {
    if (!boats || !Array.isArray(boats)) {
        return [];
    }

    return [...boats].sort((boatA, boatB) => {
        try {
            const timeA = new Date(boatA.idtech).getTime();
            const timeB = new Date(boatB.idtech).getTime();
            
            return timeB - timeA; // Décroissant (plus récent d'abord)
        } catch (error) {
            console.error('Erreur tri date:', error);
            return 0;
        }
    });
}