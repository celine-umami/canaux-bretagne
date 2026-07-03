/**
 * Serveur Express pour gestion OAuth Huwise
 * Endpoints:
 * - GET /api/auth/login      → Redirige vers Huwise
 * - GET /api/auth/callback   → Reçoit le code OAuth et échange contre token
 * - GET /api/user            → Retourne les infos utilisateur
 * - POST /api/auth/logout    → Détruit la session
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS - autoriser les requêtes du client
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8000',
    credentials: true // Important pour les cookies
}));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur OAuth démarré sur le port ${PORT}`);
    console.log(`📍 Huwise Auth URL: ${process.env.HUWISE_AUTH_URL}`);
    console.log(`📍 Callback URL: ${process.env.CALLBACK_URL}`);
});
