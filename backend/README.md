# Backend OAuth Huwise - Canaux Bretagne

Ce backend Express gère l'authentification OAuth2 avec Huwise pour l'application Canaux Bretagne.

## 📋 Architecture

```
backend/
├── server.js           ← Serveur Express principal
├── routes/
│   └── auth.js        ← Routes OAuth (login, callback, user, logout)
├── .env               ← Variables d'environnement (à créer)
├── .env.example       ← Template (fourni)
└── package.json
```

## 🚀 Installation

### 1. Copier le fichier `.env.example` en `.env`

```bash
cd backend
cp .env.example .env
```

### 2. Remplir les variables d'environnement

Ouvrez `backend/.env` et remplissez avec vos identifiants Huwise :

```env
# Du portail Huwise OAuth
HUWISE_CLIENT_ID=your_client_id_here
HUWISE_CLIENT_SECRET=your_client_secret_here

# URLs Huwise (demander à Huwise si différentes)
HUWISE_AUTH_URL=https://auth.huwise.fr/oauth/authorize
HUWISE_TOKEN_URL=https://auth.huwise.fr/oauth/token
HUWISE_USER_URL=https://api.huwise.fr/v1/user

# URL de redirection (doit correspondre exactement à celle enregistrée sur Huwise)
CALLBACK_URL=https://recette-canaux-bretagne.cleverapps.io/api/auth/callback

# URL du client (pour redirection après auth)
CLIENT_URL=https://recette-canaux-bretagne.cleverapps.io

# Configuration serveur
PORT=3000
NODE_ENV=development
```

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
