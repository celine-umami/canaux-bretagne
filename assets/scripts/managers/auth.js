/**
 * Module de gestion de l'authentification
 * Vérifie et gère le token OAuth et met à jour l'UI en conséquence
 */

/**
 * État d'authentification
 */
let authState = {
    isAuthenticated: false,
    token: null
};

/**
 * Élément du bouton de connexion/déconnexion
 */
let authButton = null;

/**
 * Initialise le module d'authentification
 */
export async function initAuth() {
    authButton = document.querySelector('.btn-connexion');
    
    if (!authButton) {
        console.warn('⚠️ Bouton de connexion non trouvé');
        return;
    }

    // Vérifier l'état d'authentification au chargement
    await checkAuthStatus();

    // Ajouter l'event listener au bouton
    authButton.addEventListener('click', handleAuthButtonClick);
}

/**
 * Vérifie le statut d'authentification actuel
 */
export async function checkAuthStatus() {
    try {
        const response = await fetch('/api/token', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();

        authState.isAuthenticated = data.authenticated;
        authState.token = data.access_token;

        // Mettre à jour le bouton selon l'état
        updateAuthButton();

        if (authState.isAuthenticated) {
            console.info('🔐 Utilisateur connecté');
        } else {
            console.info('👤 Mode anonyme');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du token:', error);
    }
}

/**
 * Met à jour l'apparence du bouton selon l'état d'authentification
 */
function updateAuthButton() {
    if (!authButton) return;

    if (authState.isAuthenticated) {
        // Utilisateur connecté → afficher "Déconnexion"
        authButton.textContent = 'Déconnexion';
        authButton.classList.add('btn-deconnexion');
        authButton.classList.remove('btn-connexion');
        authButton.href = '#'; // Empêcher la navigation
        authButton.style.cursor = 'pointer';
    } else {
        // Utilisateur anonyme → afficher "Connexion"
        authButton.textContent = 'Connexion';
        authButton.classList.remove('btn-deconnexion');
        authButton.classList.add('btn-connexion');
        authButton.href = '/api/auth/login.php'; // Autoriser la navigation
        authButton.style.cursor = 'pointer';
    }
}

/**
 * Gère le clic sur le bouton de connexion/déconnexion
 */
async function handleAuthButtonClick(e) {
    if (authState.isAuthenticated) {
        // L'utilisateur est connecté → déconnexion
        e.preventDefault();
        await logout();
    }
    // Sinon, laisser le lien de connexion faire sa navigation normale
}

/**
 * Déconnecte l'utilisateur
 */
export async function logout() {
    try {
        const response = await fetch('/api/auth/logout.php', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            console.info('✅ Déconnexion réussie');

            // Mettre à jour l'état
            authState.isAuthenticated = false;
            authState.token = null;

            // Mettre à jour le bouton
            updateAuthButton();

            // Recharger les bateaux pour afficher les données publiques
            // Importer à la volée pour éviter les cycles de dépendances
            const { fetchBoatsForChannel } = await import('../data/data.js');
            const app = window.app; // L'application est exposée globalement dans main.js

            if (app && app.currentChannel) {
                try {
                    app.boats = await fetchBoatsForChannel(app.currentChannel.secteur_appli);
                    app.mapManager.renderBoats(app.boats);
                    console.info('🚤 Données publiques rechargées');
                } catch (error) {
                    console.error('❌ Erreur lors du rechargement des bateaux:', error);
                }
            }
        } else {
            console.error('❌ Erreur lors de la déconnexion:', data.message);
        }
    } catch (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
    }
}

/**
 * Retourne l'état d'authentification actuel
 */
export function getAuthState() {
    return { ...authState };
}
