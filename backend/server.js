/**
 * Serveur Express pour gestion OAuth Huwise + Serveur web statique
 * 
 * Architecture unifiée :
 * - GET /api/auth/login      → Redirige vers Huwise
 * - GET /api/auth/callback   → Reçoit le code OAuth et échange contre token
 * - GET /*                   → Fichiers statiques (HTML, CSS, JS, images)
 * 
 * Ce serveur sert à la fois l'API et le frontend
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';

// Charger les variables d'environnement
// En développement: .env.local (local) puis .env
// En production: .env ou variables d'environnement de CleverCloud
dotenv.config({ path: '.env.local' }); // Développement local
dotenv.config(); // Production ou fallback

// Créer __dirname pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Chemins
const staticDir = path.join(__dirname, '..'); // Racine du projet (où sont assets/, index.html, etc.)

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS - autoriser les requêtes du client (utile pour développement)
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8000',
    credentials: true
}));

// 🔸 SERVIR LES FICHIERS STATIQUES
// Assets (CSS, JS, images, fonts)
app.use('/assets', express.static(path.join(staticDir, 'assets')));

// 🔸 ROUTES API
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 🔸 SERVIR LE FRONTEND (Single Page App)
// Pour toute route non-API, servir index.html (SPA)
app.get('/', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

// Catch-all pour SPA (toute route non-API redirige vers index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📁 Fichiers statiques: ${staticDir}`);
    console.log(`🔐 OAuth Huwise:`);
    console.log(`   Auth URL: ${process.env.HUWISE_AUTH_URL}`);
    console.log(`   Callback: ${process.env.CALLBACK_URL}`);
    console.log(`📍 Frontend: http://localhost:${PORT}`);
});
