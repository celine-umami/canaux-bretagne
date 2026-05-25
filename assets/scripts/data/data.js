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
            .addParam("group_by", "secteur_appli")

        const data = await url.execute();


        // Formater les résultats et filtrer ceux sans secteur_appli
        const processedResults = data.results
            .filter((result) => result.secteur_appli != null)
            .map((result) => {
                return {
                    id: result.secteur_appli,
                    secteur_appli: result.secteur_appli,
                    voie_navigable: result.secteur_appli,
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
    console.log("🚀 --- secteurAppli:", secteurAppli);

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
 * Récupère les bateaux présents sur une voie navigable
 * @param {string} voieNavigable - Le nom de la voie navigable
 * @param {Date} targetDate - (Optionnel) Date spécifique pour filtrer les bateaux. Si null, récupère hier + aujourd'hui
 */
export async function fetchBoatsForChannel(voieNavigable, targetDate = null) {
    try {
        // Adapter le nom du canal si nécessaire
        const channelName = voieNavigable === "Blavet" ? "Canal du Blavet" : voieNavigable;

        const url = new OdsReqeust(API_CONFIG.DATA_URL)
            .addWhere(`type_embarcation != "Canoë / Kayak"`) // exclure les canoës/kayaks du filtrage
            .addWhere(`voie_navigable="${channelName}"`);

        if (targetDate) {
            // Filtrer sur une date spécifique
            const targetDateStr = targetDate.toISOString().split('T')[0];
            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];

            // ajoute une condition a la request pour que les bateux soit sur une plage de date
            url
                .addWhere(`date >= date'${targetDateStr}'`)
                .addWhere(`date < date'${nextDateStr}'`)
        } else {
            // Comportement par défaut: hier et aujourd'hui
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Format ISO: YYYY-MM-DD
            const todayStr = today.toISOString().split('T')[0];
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // Filtrer par voie_navigable et par date (bateaux d'hier et d'aujourd'hui)
            url
                .addWhere(`date >= date'${todayStr}'`)
                .addWhere(`date < date'${tomorrowStr}'`)
        }

        const results = await url.execute()

        return results;
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
