/**
 * Module de gestion des données
 * Récupère les écluses et bateaux depuis une source externe
 */

import { API_CONFIG } from './config.js';

/**
 * Récupère toutes les écluses pour un canal spécifique (avec pagination)
 */
async function fetchAllLocksForSpecificChannel(channelName) {
    try {
        const whereClause = encodeURIComponent(`voie_navigable="${channelName}"`);
        const requests = [0, 100, 200].map(offset => {
            const url = `${API_CONFIG.ECLUSE_DATA}?where=${whereClause}&limit=100&offset=${offset}`;
            return fetchFromAPI(url);
        });
        
        const responses = await Promise.all(requests);
        const allLocks = responses.flatMap(r => r.results || []);
        return allLocks;
    } catch (error) {
        console.error(`Erreur lors du chargement des écluses pour ${channelName}:`, error);
        throw error;
    }
}

/**
 * Récupère la liste des canaux disponibles
 * Divise "Canal de Nantes à Brest" en 3 sections
 */
export async function fetchChannel() {
    try {
        const url = `${API_CONFIG.ECLUSE_DATA}?group_by=voie_navigable&limit=20`;
        const data = await fetchFromAPI(url);
        
        const processedResults = [];
        
        for (const result of data.results) {
            if (result.voie_navigable === "Canal de Nantes à Brest") {
                // Récupérer toutes les écluses de ce canal (en 3 requêtes)
                const locks = await fetchAllLocksForSpecificChannel("Canal de Nantes à Brest");
                
                if (locks.length === 0) {
                    processedResults.push(result);
                    continue;
                }
                
                // Trier par num_ecluse
                locks.sort((a, b) => a.num_ecluse - b.num_ecluse);
                
                // Diviser en 3 parties
                const third = Math.ceil(locks.length / 3);
                const sections = [
                    {
                        locks: locks.slice(0, third),
                        minNum: locks[0].num_ecluse,
                        maxNum: locks[third - 1].num_ecluse
                    },
                    {
                        locks: locks.slice(third, 2 * third),
                        minNum: locks[third].num_ecluse,
                        maxNum: locks[2 * third - 1].num_ecluse
                    },
                    {
                        locks: locks.slice(2 * third),
                        minNum: locks[2 * third].num_ecluse,
                        maxNum: locks[locks.length - 1].num_ecluse
                    }
                ];
                
                // Ajouter les 3 sections comme channels
                sections.forEach((section, idx) => {
                    processedResults.push({
                        id: `${result.voie_navigable}_section_${idx + 1}`,
                        voie_navigable: result.voie_navigable,
                        displayName: `${result.voie_navigable} écluse n°${section.minNum} à ${section.maxNum}`,
                        minEcluse: section.minNum,
                        maxEcluse: section.maxNum,
                        id_section: idx + 1
                    });
                });
            } else {
                result.id = result.id || result.voie_navigable;
                processedResults.push(result);
            }
        }
        
        return { ...data, results: processedResults };
    } catch (error) {
        console.error('Erreur lors du chargement des canaux:', error);
        throw error;
    }
}

/**
 * Récupère les écluses pour un canal donné
 * @param {string|Object} channel - Soit un nom de canal (string), soit un objet channel avec voie_navigable, minEcluse, maxEcluse
 */
export async function fetchLocksForChannel(channel) {
    try {
        let whereClause;
        let channelName;
        
        // Si channel est un objet
        if (typeof channel === 'object') {
            channelName = channel.voie_navigable;
            
            // Si c'est un canal divisé (minEcluse/maxEcluse), ajouter les limites d'écluse
            if (channel.minEcluse !== undefined && channel.maxEcluse !== undefined) {
                whereClause = encodeURIComponent(
                    `voie_navigable="${channelName}" AND num_ecluse >= ${channel.minEcluse} AND num_ecluse <= ${channel.maxEcluse}`
                );
            } else {
                // Cas normal: juste par voie_navigable
                whereClause = encodeURIComponent(`voie_navigable="${channelName}"`);
            }
        } else {
            // Cas où channel est une string (rétro-compatibilité)
            channelName = channel;
            whereClause = encodeURIComponent(`voie_navigable="${channel}"`);
        }
        
        const url = `${API_CONFIG.ECLUSE_DATA}?where=${whereClause}&limit=100`;

        return await fetchFromAPI(url);
    } catch (error) {
        console.error(`Erreur lors du chargement des écluses:`, error);
        throw error;
    }
}

/**
 * Récupère les bateaux présents sur un canal pour aujourd'hui uniquement
 * @param {string|Object} channel - Soit un nom de canal (string), soit un objet channel avec voie_navigable
 */
export async function fetchBoatsForChannel(channel) {
    try {
        let channelName;
        
        // Si channel est un objet
        if (typeof channel === 'object') {
            channelName = channel.voie_navigable;
        } else {
            // Cas normal: channel est une string (nom du canal)
            channelName = channel;
        }
        
        channelName = channelName === "Blavet" ? "Canal du Blavet" : channelName;
        
        // Calculer les dates pour le filtre (aujourd'hui)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Format ISO: YYYY-MM-DD
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Filtrer par voie_navigable et par date (bateaux d'aujourd'hui)
        const whereClause = encodeURIComponent(
            `voie_navigable="${channelName}" AND date >= date'${todayStr}' AND date < date'${tomorrowStr}'`
        );
        const url = `${API_CONFIG.DATA_URL}?where=${whereClause}&limit=100`;

        return await fetchFromAPI(url);
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
