# Backend OAuth Huwise - Canaux Bretagne

Serveur Node.js unifié qui sert à la fois:
- 🔐 L'API OAuth2 avec Huwise
- 📁 Le frontend statique (HTML, CSS, JS, images)

## 🏗️ Architecture

```
server.js
├── /api/auth/login      → Redirige vers Huwise
├── /api/auth/callback   → Échange le code contre un token
└── /*                   → Sert les fichiers statiques
```

Le frontend et le backend sont sur le **même serveur**, donc:
- ✅ Pas de CORS
- ✅ Pas de conflit de ports  
- ✅ Déploiement simple sur CleverCloud

## 📋 Structure

```
backend/
├── server.js              ← Serveur Express principal + fichiers statiques
├── routes/
│   └── auth.js            ← Routes OAuth (login, callback)
├── .env                   ← Variables (local)
├── .env.local             ← Variables locales (développement)
├── .env.example           ← Template
└── package.json
```

## 🚀 Installation & Utilisation

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration

**Pour développement local:**

Le fichier `.env` est déjà configuré pour localhost. Vérifiez:

```env
HUWISE_CLIENT_ID=0a0c7a402e4f4b169d1e32a3c1046320
HUWISE_CLIENT_SECRET=9f674ddd2bf240c594b6edf42c79717a
CALLBACK_URL=http://localhost:3000/api/auth/callback
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Pour la recette:**

Avant de déployer sur recette, mettre à jour `backend/.env` avec:

```env
CALLBACK_URL=https://recette-canaux-bretagne.cleverapps.io/api/auth/callback
CLIENT_URL=https://recette-canaux-bretagne.cleverapps.io
NODE_ENV=production
```

### 3. Lancer le serveur

**Développement** (auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

L'application est accessible sur http://localhost:3000

## 🔐 Flux OAuth2

1. **Utilisateur clique "Connexion"** → `/api/auth/login`
2. **Backend génère un state CSRF** et redirige vers Huwise
3. **Utilisateur s'authentifie chez Huwise**
4. **Huwise redirige vers** `/api/auth/callback?code=xxx&state=yyy`
5. **Backend échange le code contre un token** (serveur-à-serveur sécurisé)
6. **Token stocké en HttpOnly cookie** (inaccessible au JavaScript)
7. **Redirection vers l'accueil** avec le token en cookie

## 📝 Variables d'environnement

| Variable | Usage | Exemple |
|---|---|---|
| `HUWISE_CLIENT_ID` | OAuth Client ID | `0a0c7a402e4f4b169d1e32a3c1046320` |
| `HUWISE_CLIENT_SECRET` | OAuth Client Secret | `9f674ddd2bf240c594b6edf42c79717a` |
| `HUWISE_AUTH_URL` | Endpoint authorization Huwise | `https://data.bretagne.bzh/oauth2/authorize` |
| `HUWISE_TOKEN_URL` | Endpoint token Huwise | `https://data.bretagne.bzh/oauth2/token` |
| `CALLBACK_URL` | URL retour OAuth (doit correspondre exactement à Huwise) | `https://recette-canaux-bretagne.cleverapps.io/api/auth/callback` |
| `CLIENT_URL` | URL frontend (pour CORS & redirect) | `https://recette-canaux-bretagne.cleverapps.io` |
| `PORT` | Port du serveur | `3000` |
| `NODE_ENV` | Environment | `development` ou `production` |

## 🔒 Sécurité

- ✅ **Token en HttpOnly cookie** → inaccessible au JavaScript (XSS protection)
- ✅ **CSRF state validation** → Chaque requête a un state unique
- ✅ **Client secret jamais exposé** → Échange code/token côté serveur
- ✅ **HTTPS en production** → Secure flag automatique si `NODE_ENV=production`
- ✅ **SameSite=Lax** → Protection contre les attaques cross-site

## 🚀 Déploiement sur CleverCloud

1. **Push le code avec git** (incluant `backend/`)
2. **CleverCloud détecte** `backend/package.json`
3. **Lance automatiquement** `npm start`
4. **Variables d'env** configurées via le dashboard CleverCloud

Voir [MISE_EN_ROUTE.md](../MISE_EN_ROUTE.md) pour les étapes complètes.

## 📚 Endpoints API

### `GET /api/auth/login`

Redirige vers Huwise pour authentification.

- Génère un state CSRF
- Stocke le state en cookie (10 min)
- Redirige vers Huwise

**Réponse:** Redirection HTTP

### `GET /api/auth/callback`

Reçoit le code OAuth depuis Huwise et l'échange contre un token.

- Valide le state CSRF
- Échange le code contre un token
- Stocke le token en HttpOnly cookie
- Redirige vers le frontend

**Paramètres:**
- `code` (string) - Code OAuth de Huwise
- `state` (string) - State CSRF

**Réponse:** Redirection vers CLIENT_URL

### `GET /health`

Health check du serveur.

**Réponse:**
```json
{ "status": "ok" }
```

## 📞 Support

Pour des questions sur:
- **Huwise**: Voir la documentation Huwise
- **OAuth2**: Voir [RFC 6749](https://tools.ietf.org/html/rfc6749)
- **Ce projet**: Voir [STRUCTURE_OAUTH.txt](../STRUCTURE_OAUTH.txt)

### 3. Installer les dépendances

```bash
npm install
```

### 4. Démarrer le serveur

**En développement** (avec rechargement automatique) :
```bash
npm run dev
```

**En production** :
```bash
npm start
```

Le serveur démarre sur le port `3000` (ou celui configuré dans `.env`).

---

## 📡 Endpoints API

### 1. **GET /api/auth/login**
Lance le flux d'authentification Huwise.

```
GET https://recette-canaux-bretagne.cleverapps.io/api/auth/login
→ Redirige vers Huwise pour l'authentification
```

### 2. **GET /api/auth/callback**
Endpoint de callback OAuth (enregistré sur Huwise).

```
GET https://recette-canaux-bretagne.cleverapps.io/api/auth/callback?code=xxx&state=yyy
← Huwise envoie le code d'autorisation ici
→ Le backend l'échange contre un token
→ Stocke le token en HttpOnly cookie (sécurisé)
→ Redirige vers le client avec ?auth=success
```

### 3. **GET /api/auth/user**
Récupère les infos de l'utilisateur actuellement connecté.

```
GET https://recette-canaux-bretagne.cleverapps.io/api/auth/user
← Retourne : { authenticated: true, user: { name, email, id } }
```

### 4. **POST /api/auth/logout**
Déconnecte l'utilisateur en supprimant les cookies.

```
POST https://recette-canaux-bretagne.cleverapps.io/api/auth/logout
← Retourne : { success: true, message: "Déconnexion réussie" }
```

---

## 🔐 Flux de sécurité

1. **Client** : Utilisateur clique sur "Connexion"
2. **Client → Backend** : Redirection vers `/api/auth/login`
3. **Backend → Huwise** : Redirection vers Huwise avec `client_id`
4. **Huwise → Client** : L'utilisateur se connecte sur Huwise
5. **Huwise → Backend** : Callback avec le code d'autorisation
6. **Backend → Huwise** : Échange du code contre un token (sécurisé serveur-à-serveur)
7. **Backend → Client** : Stockage du token en **HttpOnly cookie** (inaccessible au JS)
8. **Backend → Client** : Redirection vers le client avec `?auth=success`

### Points de sécurité clés :
- ✅ **Token stocké en HttpOnly cookie** : Protégé contre XSS
- ✅ **Client secret jamais exposé** : Reste côté serveur
- ✅ **État CSRF** : Validation du paramètre `state`
- ✅ **Tokens à courte durée** : 24h (configurable)

---

## 🔗 Intégration avec le client

Le client JS (`AuthManager`) communique avec ce backend :

1. **Connexion** : `window.location.href = '/api/auth/login'`
2. **Vérifier l'état** : `GET /api/auth/user` (lecture des cookies)
3. **Déconnexion** : `POST /api/auth/logout`

Les informations utilisateur sont stockées en cookie **non-HttpOnly** nommé `user_info` pour que le client puisse y accéder et afficher le nom.

---

## 📦 Déploiement sur CleverCloud

### 1. Créer un fichier `clevercloud/nodejs.json` (à la racine du projet)

```json
{
  "deploy": {
    "module": "backend/server.js"
  }
}
```

### 2. Pousser sur CleverCloud

```bash
git push clever main
```

### 3. Configurer les variables d'environnement sur CleverCloud

Via le dashboard CleverCloud :
- `HUWISE_CLIENT_ID`
- `HUWISE_CLIENT_SECRET`
- `HUWISE_AUTH_URL`
- `HUWISE_TOKEN_URL`
- `HUWISE_USER_URL`
- `CALLBACK_URL`
- `CLIENT_URL`
- `NODE_ENV=production`

---

## 🐛 Débogage

### Logs du backend

Tous les appels OAuth sont loggés en console :

```
🔐 Redirection vers Huwise: https://...
📦 Code OAuth reçu: abc123...
✅ Token reçu: xyz789...
👤 Utilisateur: Jean Dupont
🎉 Authentification réussie pour Jean Dupont
```

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Configuration manquante` | `.env` mal rempli | Vérifier `HUWISE_CLIENT_ID`, `CALLBACK_URL` |
| `État CSRF invalide` | Le `state` ne correspond pas | Normal en dev - vérifier les logs |
| `Code OAuth manquant` | Huwise n'a pas redirigé correctement | Vérifier l'URL de callback sur Huwise |
| `Token manquant` | Huwise n'a pas retourné de token | Vérifier les credentials Huwise |

---

## 📝 Notes

- Les tokens Huwise expireront après **24h** (configurable)
- Les cookies sont **HttpOnly** et **Secure** en production
- Le CORS est configuré pour accepter les requêtes du client uniquement
- En développement, les URLs peuvent être `http://localhost:8000`

---

## ❓ Support Huwise

Si vous avez des questions sur l'API Huwise :
- 📖 Documentation : https://developer.huwise.fr
- 💬 Support : support@huwise.fr
