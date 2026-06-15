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

        // Construire la requête avec le filtre secteur_appli
        const url = new OdsReqeust(API_CONFIG.DATA_URL)
            .addWhere(`type_embarcation != "Canoë / Kayak"`)
            .addWhere(`secteur_appli="${secteurAppli}"`);

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

        return await url.execute();
    } catch (error) {
        console.error(`Erreur lors du chargement des bateaux:`, error);
        throw error;
    }
}

/**
 * Effectue une requête fetch simple et retourne le JSON
 * @param {string} url - L'URL à requêter
 * @returns {Promise<Object>} Les données JSON reçues
 */
export async function fetchFromAPI(url) {
    try {
        if (API_CONFIG.DEBUG) {
            console.info(`🔄 Fetch: ${url}`);
        }

        // Construire les headers
        const headers = {
            'Accept': 'application/json'
        };

        // Ajouter la clé API si disponible
        if (API_CONFIG.API_KEY) {
            headers['Authorization'] = `apikey ${API_CONFIG.API_KEY}`;
            if (API_CONFIG.DEBUG) {
                console.info(`🔐 Avec authentification API`);
            }
        }

        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: headers
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
