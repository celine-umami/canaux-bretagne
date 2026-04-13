/**
 * Configuration de l'application
 * Centralize les URLs des APIs, clés d'accès et paramètres globaux
 */

export const API_CONFIG = {
    // URLs des APIs
    DATA_URL: 'https://data.bretagne.bzh/api/explore/v2.1/catalog/datasets/2026-form-vn-stat/records',
    // DATA_URL: 'https://data.bretagne.bzh/api/explore/v2.1/catalog/datasets/2026-formulaire-canaux-saisies/records',
    ECLUSE_DATA: 'https://data.bretagne.bzh/api/explore/v2.1/catalog/datasets/ref-ecluse-biefs/records',
    // Authentification
    API_KEY: '4dec0b70a035e76a34bf11a4f8aa175ff989f968ddb19d61fdd25962',

    // Timeouts (en ms)
    FETCH_TIMEOUT: 10000,

    // Configuration Leaflet
    MAP_TILES_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    MAP_ATTRIBUTION: '© OpenStreetMap contributors',

    // Environnement
    DEBUG: false,
    ENV: 'development'
};

/**
 * Valide si la configuration est prête pour utiliser les APIs
 * @returns {boolean} True si configuration valide
 */
export function isConfigValid() {
    const hasLocksUrl = !!API_CONFIG.LOCKS_URL;
    const hasBoatsUrl = !!API_CONFIG.BOATS_URL;

    if (API_CONFIG.DEBUG) {
        console.info('Configuration API:', {
            locksUrl: hasLocksUrl ? '✓' : '✗',
            boatsUrl: hasBoatsUrl ? '✓' : '✗',
            apiKey: API_CONFIG.API_KEY ? '✓ (défini)' : '✗ (vide)'
        });
    }

    return hasLocksUrl && hasBoatsUrl;
}

/**
 * Log les informations de configuration (DEBUG uniquement)
 */
export function logConfig() {
    if (API_CONFIG.DEBUG) {
        console.group('🔧 Configuration Application');
        console.table({
            Environnement: API_CONFIG.ENV,
            'URL Écluses': API_CONFIG.LOCKS_URL,
            'URL Bateaux': API_CONFIG.BOATS_URL,
            'Clé API': API_CONFIG.API_KEY ? 'définie' : 'non définie',
            'Timeout (ms)': API_CONFIG.FETCH_TIMEOUT
        });
        console.groupEnd();
    }
}
