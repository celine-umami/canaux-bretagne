/**
 * Routes OAuth pour Huwise
 * Simplifié: login -> callback
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();

// LOGIN: Redirige vers Huwise
// GET /api/auth/login
router.get('/login', (req, res) => {
    try {
        const clientId = process.env.HUWISE_CLIENT_ID;
        const redirectUri = process.env.CALLBACK_URL;
        const authUrl = process.env.HUWISE_AUTH_URL;

        if (!clientId || !redirectUri || !authUrl) {
            return res.status(500).json({ 
                error: 'Configuration manquante: HUWISE_CLIENT_ID, CALLBACK_URL, ou HUWISE_AUTH_URL' 
            });
        }

        // État aléatoire pour la sécurité CSRF
        const state = Math.random().toString(36).substring(7);
        res.cookie('oauth_state', state, { 
            httpOnly: true, 
            maxAge: 10 * 60 * 1000 // 10 min
        });

        // Construire l'URL d'autorisation Huwise
        const huWiseAuthUrl = `${authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;

        console.log(`🔐 Redirection vers Huwise`);
        res.redirect(huWiseAuthUrl);
    } catch (error) {
        console.error('❌ Erreur dans /login:', error);
        res.status(500).json({ error: 'Erreur lors de la redirection' });
    }
});

// CALLBACK: Reçoit le code OAuth et l'échange contre un token
// GET /api/auth/callback?code=xxx&state=yyy
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const storedState = req.cookies.oauth_state;

        // Vérifier l'état CSRF
        if (state !== storedState) {
            console.error('❌ État CSRF invalide');
            return res.status(400).json({ error: 'État CSRF invalide' });
        }

        if (!code) {
            console.error('❌ Code OAuth manquant');
            return res.status(400).json({ error: 'Code OAuth manquant' });
        }

        console.log(`📦 Code OAuth reçu`);

        // Échanger le code contre un token (appel serveur-à-serveur sécurisé)
        const tokenResponse = await axios.post(
            process.env.HUWISE_TOKEN_URL,
            {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.CALLBACK_URL,
                client_id: process.env.HUWISE_CLIENT_ID,
                client_secret: process.env.HUWISE_CLIENT_SECRET
            },
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const { access_token } = tokenResponse.data;

        if (!access_token) {
            console.error('❌ Token manquant dans la réponse Huwise');
            return res.status(400).json({ error: 'Token manquant' });
        }

        console.log(`✅ Token reçu`);

        // Stocker le token en HttpOnly cookie (inaccessible au client)
        res.cookie('oauth_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 24 * 60 * 60 * 1000 // 24h
        });

        console.log(`🎉 Authentification réussie`);

        // Rediriger vers l'app
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:8000';
        res.redirect(clientUrl);

    } catch (error) {
        console.error('❌ Erreur dans le callback OAuth:', error.message);
        
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:8000';
        res.redirect(`${clientUrl}?auth=error&message=${encodeURIComponent(error.message)}`);
    }
});

export default router;
