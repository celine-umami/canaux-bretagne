import { fetchFromAPI } from "./data.js";

/**
 * @typedef {Object} OdsReponse
 * @property {number} total_count - nombre total de résultats disponibles dans api (peut être supérieur à results.length si pagination)
 * @property {Object[]} results - tablaux avec la data demandée
 */

/**
 * Class pour construire des requêtes vers ODS
 */
export class OdsReqeust {

    /** nombre maximal de request par sous request de pagination */
    requestLimit = 10;

    /** Token OAuth optionnel pour l'authentification */
    token = null;

    /**
     * @param {URL} baseUrl - URL de l'api avec ses paramètres en class URL
     */
    url;

    /**
     * @param {string} baseUrl
     */
    constructor(baseUrl) {
        this.url = new URL(baseUrl);
    }

    /**
     * Définir le token OAuth
     * @param {string} token - Token d'authentification
     */
    setToken(token) {
        this.token = token;
        return this;
    }

    /**
     * ajoute un paramètre simple
     * @param {string} key
     * @param {string | number} value
     */
    addParam(key, value) {
        this.url.searchParams.set(key, value);
        return this;
    }

    /**
     * ajoute un filtre where
     * @param {string} condition
     */
    addWhere(condition) {
        const current = this.url.searchParams.get("where");

        if (!current) {
            this.url.searchParams.set("where", condition);
        } else {
            this.url.searchParams.set(
                "where",
                `${current} AND ${condition}`
            );
        }

        return this;
    }

    /**
     * tri
     * @param {string} field
     * @param {"ASC" | "DESC"} direction
     */
    orderBy(field, direction = "ASC") {
        this.url.searchParams.set(
            "order_by",
            `${field} ${direction}`
        );

        return this;
    }

    /**
     * retourne URL finale
     * @param {URL} [paramUrl] - un autre URL pour build cette autre URL
     * @returns {string}
     */
    build(paramUrl) {
        const url = paramUrl || this.url;
        return url.toString();
    }

    /**
     * exécute la requête et retourne les données
     * @param {boolean} fetchAllPages - fait autant d'appels que nécessaire pour récupérer toutes les pages de résultats (limité de nombre de request par this.requestLimit)
     * @returns {Promise<OdsReponse>}
     */
    async execute(fetchAllPages = true) {
        // prépare et exectute la première requête pour récupérer le total_count et les premiers résultats
        const request = new URL(this.url);
        request.searchParams.set("limit", 100);

        const url = this.build(request);

        const reponse = await fetchFromAPI(url, this.token);


        // si il a moins de 100 résultats ou que on veut pas tout fetche on retourne la réponse telle quelle
        if (reponse.total_count <= 100 || !fetchAllPages) return reponse;

        // détermine le nombre de pages a récupérer (avec un maximum de this.requestLimit pour éviter de faire trop de requêtes)
        const totalPages = Math.ceil(reponse.total_count / 100);
        const pagesToFetch = Math.min(totalPages, this.requestLimit);


        // tableux qui va stocker tout les promesses de fetch
        const requests = [];

        // crée les request pour chaque page mais attend avant de les fetche
        for (let i = 1; i < pagesToFetch; i++) {
            const pageRequest = new URL(request);
            pageRequest.searchParams.set("offset", i * 100);
            requests.push(fetchFromAPI(pageRequest.toString(), this.token));
        }

        // fetche tout en parallèle
        const responses = await Promise.all(requests);

        // compact tout les résultats dans un seul tableau
        const allResults = responses.reduce((acc, r) => {
            if (r.results) acc.push(...r.results)
            return acc;
        }, reponse.results || []);

        // reconstruit le tableux comme su caittait ods qui l'avait envoyé
        return {
            total_count: reponse.total_count,
            results: allResults
        };

    }
}