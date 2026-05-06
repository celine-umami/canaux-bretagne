/** @typedef {import('../types/Boat').Boat} Boat */

/**
 * récupère le nom de la prochaine écluse en fonction de l'écluse actuelle et du sens de navigation
 * @param {string} currentEcluse - le nom de l'écluse actuelle
 * @param {Boat['sens']} sens - le sens de navigation ("Montant" ou "Descendant")
 */
export function getNextEcluses(currentEcluse, sens) {
    // récupère tout les écluses du canal qui sont dans le sens de navigation du bateau en enlevant l'autre sens
    const locks = window.app.locks.filter((lock) => {
        return lock.sens === sens
    }) || [];

    // trie les écluses dans l'ordre de navigation du bateau
    const sortedLocks = locks.sort((a, b) => {
        if (sens === "Montant") {
            return b.num_ecluse - a.num_ecluse
        }
        return a.num_ecluse - b.num_ecluse
    });

    // si on ce trouve sur le canal de Nantes a brest on inverse le sens car les écluse sont pas dans le bon sens
    if (sortedLocks[0]?.voie_navigable === "Canal de Nantes à Brest") {
        sortedLocks.reverse();
    }

    // récupère l'index de l'écluse actuelle dans la liste triée
    const currentLockIndex = sortedLocks.findIndex(lock => lock.nom_formulaire === currentEcluse);
    if (currentLockIndex === -1) {
        return { nextEcluse: null, previousEcluse: null };
    }

    // détermine le nom de la prochaine écluse en fonction de l'index de l'écluse actuelle
    const nextEcluse = sortedLocks[currentLockIndex + 1]?.nom_formulaire ?? null;
    const previousEcluse = sortedLocks[currentLockIndex - 1]?.nom_formulaire ?? null;

    // retourne le nom de la prochaine écluse
    return { nextEcluse, previousEcluse };
}