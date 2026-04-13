/**
 * Module de gestion des données
 * Récupère les écluses et bateaux depuis une source externe
 */

import { API_CONFIG } from './config.js';

/**
 * Récupère la liste des canaux disponibles
 */
export async function fetchChannel() {
    try {
        const url = `${API_CONFIG.ECLUSE_DATA}?group_by=voie_navigable&limit=20`;
        return await fetchFromAPI(url);
    } catch (error) {
        console.error('Erreur lors du chargement des canaux:', error);
        throw error;
    }
}

/**
 * Récupère les écluses pour un canal donné
 */
export async function fetchLocksForChannel(channelId) {
    try {
        const whereClause = encodeURIComponent(`voie_navigable="${channelId}"`);
        const url = `${API_CONFIG.ECLUSE_DATA}?where=${whereClause}&limit=50`;

        return await fetchFromAPI(url);
    } catch (error) {
        console.error(`Erreur lors du chargement des écluses (${channelId}):`, error);
        throw error;
    }
}

/**
 * Récupère les bateaux présents sur un canal
 */
export async function fetchBoatsForChannel(channelId) {
    try {
        channelId = channelId === "Blavet" ? "Canal du Blavet" : channelId;
        const whereClause = encodeURIComponent(`voie_navigable="${channelId}"`);
        const url = `${API_CONFIG.DATA_URL}?where=${whereClause}&limit=100`;

        return await fetchFromAPI(url);
    } catch (error) {
        console.error(`Erreur lors du chargement des bateaux (${channelId}):`, error);
        throw error;
    }
}

/**
 * Effectue une requête fetch simple et retourne le JSON
 * @param {string} url - L'URL à requêter
 * @returns {Promise<Object>} Les données JSON reçues
 */
async function fetchFromAPI(url) {
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
