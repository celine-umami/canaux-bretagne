/**
 * Module de gestion des données
 * Récupère les écluses et bateaux depuis une source externe
 */

import { API_CONFIG } from './config.js';
import { OdsReqeust } from './odsRequest.js';

/**
 * Récupère la liste des canaux disponibles groupés par secteur_appli
 */
export async function fetchChannel() {
    try {
        const url = new OdsReqeust(API_CONFIG.ECLUSE_DATA)
            .addParam("group_by", "secteur_appli,voie_navigable")

        const data = await url.execute();

        // Formater les résultats et filtrer ceux sans secteur_appli
        const processedResults = data.results
            .filter((result) => result.secteur_appli != null)
            .map((result) => {
                return {
                    id: result.secteur_appli,
                    secteur_appli: result.secteur_appli,
                    ...result
                };
            });


        return { ...data, results: processedResults };
    } catch (error) {
        console.error('Erreur lors du chargement des canaux:', error);
        throw error;
    }
}

/**
 * Récupère les écluses pour un secteur_appli spécifique
 * @param {string} secteurAppli - Le secteur d'application pour filtrer les écluses
 */
export async function fetchLocksForChannel(secteurAppli) {

    try {
        const url = new OdsReqeust(API_CONFIG.ECLUSE_DATA);

        // Filtrer uniquement par secteur_appli
        if (secteurAppli) {
            url.addWhere(`secteur_appli="${secteurAppli}"`);
        } else {
            throw new Error('secteur_appli est requis pour fetcher les écluses');
        }

        const data = url.execute()

        return data;
    } catch (error) {
        console.error(`Erreur lors du chargement des écluses:`, error);
        throw error;
    }
}

/**
 * Extrait les limites d'écluses d'un ID de canal CNB
 * @param {string} channelId - ID du canal (ex: "CNB 18 à 111")
 * @returns {Object|null} Objet avec minEcluse et maxEcluse, ou null si non applicable
 */
function extractEcluseLimits(channelId) {
    // Vérifier que channelId n'est pas null/undefined
    if (!channelId || typeof channelId !== 'string') {
        return null;
    }
    // Cherche un motif comme "18 à 111"
    const match = channelId.match(/(\d+)\s+à\s+(\d+)/);
    if (match) {
        return {
            minEcluse: parseInt(match[1]),
            maxEcluse: parseInt(match[2])
        };
    }
    return null;
}

/**
 * Récupère les bateaux présents dans un secteur_appli spécifique
 * Utilise le token OAuth automatiquement s'il est disponible
 * @param {string} secteurAppli - Le secteur d'application (ex: "CNB 18 à 111" ou "Blavet")
 * @param {Date} targetDate - (Optionnel) Date spécifique pour filtrer les bateaux. Si null, récupère aujourd'hui
 */
export async function fetchBoatsForChannel(secteurAppli, targetDate = null) {
    try {
        // Sécurité : vérifier que secteurAppli existe
        if (!secteurAppli) {
            console.error('secteurAppli est requis pour fetcher les bateaux');
            return { results: [] };
        }

        // Récupérer le token OAuth via l'endpoint /api/token
        let token = null;
        try {
            const tokenResponse = await fetch('/api/token', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            const tokenData = await tokenResponse.json();
            token = tokenData.access_token;
            
            if (token) {
                console.info('🔐 Token OAuth récupéré et prêt à être utilisé');
            } else {
                console.warn('⚠️ Aucun token OAuth disponible - requête en mode public');
            }
        } catch (e) {
            console.warn('⚠️ Impossible de récupérer le token:', e.message);
        }

        // Construire la requête avec le filtre secteur_appli
        const url = new OdsReqeust(API_CONFIG.DATA_URL)
            .addWhere(`type_embarcation != "Canoë / Kayak"`)
            .addWhere(`secteur_appli="${secteurAppli}"`)
            .setUseApiKey(false); // Pas de clé API pour les bateaux

        // Définir le token si disponible
        if (token) {
            url.setToken(token);
        }

        // Filtrer par date
        if (targetDate) {
            const targetDateStr = targetDate.toISOString().split('T')[0];
            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];

            url
                .addWhere(`date >= date'${targetDateStr}'`)
                .addWhere(`date < date'${nextDateStr}'`);
        } else {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayStr = today.toISOString().split('T')[0];
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            url
                .addWhere(`date >= date'${todayStr}'`)
                .addWhere(`date < date'${tomorrowStr}'`);
        }

        // Exécuter la requête
        return await url.execute();
    } catch (error) {
        console.error(`Erreur lors du chargement des bateaux:`, error);
        throw error;
    }
}

/**
 * Effectue une requête fetch simple et retourne le JSON
 * @param {string} url - L'URL à requêter
 * @param {string} token - (Optionnel) Token OAuth à inclure dans l'en-tête Authorization
 * @param {boolean} useApiKey - (Optionnel) Utiliser la clé API si pas de token. Default: true
 * @returns {Promise<Object>} Les données JSON reçues
 */
export async function fetchFromAPI(url, token = null, useApiKey = true) {
    try {
        // Ajouter un cache-buster (timestamp) pour éviter le cache HTTP du navigateur
        // Important après authentification pour recharger avec le nouveau token
        const cacheBuster = Date.now();
        const separator = url.includes('?') ? '&' : '?';
        const urlWithCacheBuster = `${url}${separator}_t=${cacheBuster}`;

        if (API_CONFIG.DEBUG) {
            console.info(`🔄 Fetch: ${urlWithCacheBuster}`);
        }

        // Construire les headers
        const headers = {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };

        // Ajouter le token OAuth si disponible
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            if (API_CONFIG.DEBUG) {
                console.info(`🔐 Avec token OAuth`);
            }
        }

        // Ajouter la clé API si disponible (et pas de token OAuth ET useApiKey = true)
        if (useApiKey && API_CONFIG.API_KEY && !token) {
            headers['Authorization'] = `apikey ${API_CONFIG.API_KEY}`;
            if (API_CONFIG.DEBUG) {
                console.info(`🔐 Avec clé API`);
            }
        }

        const response = await fetch(urlWithCacheBuster, {
            method: 'GET',
            mode: 'cors',
            headers: headers,
            cache: 'no-store'
        });

        if (API_CONFIG.DEBUG) {
            console.info(`↳ Status: ${response.status}`);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`✗ Erreur API (${response.status}):`, errorData);
            throw new Error(`HTTP ${response.status} - ${errorData.message || 'Erreur API'}`);
        }

        const data = await response.json();

        if (API_CONFIG.DEBUG) {
            console.info(`✓ Données reçues:`, data);
        }

        return data;
    } catch (error) {
        console.error(`✗ Erreur fetch:`, error);
        throw error;
    }
}
