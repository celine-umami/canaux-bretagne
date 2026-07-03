# Authentification OAuth2 avec Huwise (PHP)

## 📋 Architecture

```
Utilisateur clique "Connexion"
                 ↓
        /api/auth/login.php
        ├─ Génère state CSRF
        ├─ Stocke en session
        └─ Redirige vers Huwise
                 ↓
        Huwise (authentification)
                 ↓
        /api/auth/callback.php
        ├─ Vérifie state CSRF
        ├─ Échange code → token
        ├─ Stocke token en HttpOnly cookie
        └─ Redirige vers accueil
```

## 🔐 Flux OAuth2

1. **Login** (`/api/auth/login.php`)
   - Génère un state aléatoire pour la sécurité CSRF
   - Redirige vers `https://data.bretagne.bzh/oauth2/authorize` avec :
     - `client_id=0a0c7a402e4f4b169d1e32a3c1046320`
     - `redirect_uri=/api/auth/callback.php`
     - `response_type=code`
     - `state=<random>`

2. **Callback** (`/api/auth/callback.php`)
   - Reçoit `code` et `state` depuis Huwise
   - Vérifie que le `state` correspond (CSRF validation)
   - Échange le `code` contre un `access_token` (serveur-à-serveur)
   - Stocke le token en **HttpOnly cookie** (sécurisé)
   - Redirige vers l'accueil

## 📝 Fichiers

### `/api/auth/login.php`
- Point d'entrée pour la connexion
- Génère et stocke le state en session
- Redirige vers Huwise

### `/api/auth/callback.php`
- Reçoit le code OAuth de Huwise
- Échange code → token
- Stocke token en cookie HttpOnly
- Gère les erreurs

## 🔒 Sécurité

✅ **HttpOnly Cookie** - Token inaccessible au JavaScript (XSS protection)
✅ **CSRF Protection** - State validation sur chaque requête
✅ **Client Secret Sécurisé** - Jamais exposé au client
✅ **HTTPS en Production** - Secure flag automatique

## 🧪 Testing

### Local
```bash
# 1. Cliquer sur "Connexion"
# → Redirige vers /api/auth/login.php

# 2. Vous authentifier chez Huwise
# → Huwise redirige vers /api/auth/callback.php

# 3. Token stocké en cookie
# → Redirection vers accueil avec ?auth=success
```

### Production (CleverCloud)
- Les fichiers PHP sont automatiquement exécutés
- Les cookies sont sécurisés (HTTPS)
- Les logs sont disponibles dans le dashboard CleverCloud

## 📚 Documentation Huwise

- OAuth2 Endpoint: `https://data.bretagne.bzh/oauth2/authorize`
- Token Endpoint: `https://data.bretagne.bzh/oauth2/token`
- Client ID: `0a0c7a402e4f4b169d1e32a3c1046320`
- Client Secret: Voir `.env` ou variables d'environnement

## 🚀 Prochaines étapes

1. Vérifier que PHP fonctionne sur CleverCloud
2. Utiliser le token en cookie pour les appels API
3. Implémenter la récupération des infos utilisateur
4. Afficher l'état authentifié dans l'UI
