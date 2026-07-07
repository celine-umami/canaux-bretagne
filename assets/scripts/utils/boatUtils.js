/**
 * Utilitaires pour la gestion des bateaux
 */

/**
 * Déduplique les bateaux en gardant le plus récent par nom
 * @param {Array} boats - Tableau des bateaux
 * @returns {Array} Bateaux dédupliqués (le plus récent par nom_bateau)
 */
export function deduplicateBoats(boats) {
    const boatsByName = new Map();

    boats.forEach(boat => {
        const name = boat.nom_bateau;
        if (!name) return;

        const existing = boatsByName.get(name);

        // Comparer les timestamps idtech
        if (!existing) {
            boatsByName.set(name, boat);
        } else {
            // Garder le plus récent (idtech le plus grand)
            const existingTime = new Date(existing.idtech).getTime();
            const newTime = new Date(boat.idtech).getTime();

            if (newTime > existingTime) {
                boatsByName.set(name, boat);
            }
        }
    });

    return Array.from(boatsByName.values());
}
