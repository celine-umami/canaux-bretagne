# 🚀 Mise en route - Authentification OAuth Huwise

## ✅ Ce qui a été fait

L'architecture OAuth complète a été implémentée avec :

### Backend (Node.js/Express)
- ✅ Serveur Express avec gestion OAuth
- ✅ Routes: `/api/auth/login`, `/api/auth/callback`, `/api/auth/user`, `/api/auth/logout`
- ✅ Gestion sécurisée des tokens (HttpOnly cookies)
- ✅ Validation CSRF (token `state`)
- ✅ Logs pour le débogage

### Client (JavaScript)
- ✅ `AuthManager`: Gestion de l'authentification
- ✅ `AuthUIManager`: Boutons de connexion/déconnexion dans le footer
- ✅ `boatsCardDetails`: Affichage du nom de l'éclusier connecté
- ✅ Événement `authStateChanged` pour synchroniser l'UI

### Documentation
- ✅ `backend/README.md`: Instructions complètes du backend
- ✅ `AUTHENTIFICATION.md`: Guide détaillé du système
- ✅ `.gitignore` pour éviter les fuites de credentials

---

## 📋 Étapes suivantes

### 1. ⚙️ Configuration de Huwise (À faire maintenant)

Vous avez déjà enregistré l'app Huwise et reçu :
- `client_id`
- `client_secret`

**À faire** : Demander à Huwise les 3 URLs suivantes :
```
- HUWISE_AUTH_URL      (ex: https://auth.huwise.fr/oauth/authorize)
- HUWISE_TOKEN_URL     (ex: https://auth.huwise.fr/oauth/token)
- HUWISE_USER_URL      (ex: https://api.huwise.fr/v1/user)
```

### 2. 🔧 Configuration locale du backend

```bash
# Allez dans le backend
cd backend

# Créer le .env à partir de .env.example
cp .env.example .env

# Remplir les variables avec vos infos Huwise
# Éditeur: backend/.env
```

### 3. 📦 Installer et tester localement

```bash
# Terminal 1 - Backend (port 3000)
cd backend
npm install
npm run dev

# Terminal 2 - Client (port 8000)
# À la racine du projet
python3 -m http.server 8000

# Ouvrir http://localhost:8000 et cliquer sur "🔐 Connexion"
```

### 4. 🌐 Déploiement sur CleverCloud

```bash
# À la racine du projet
git add .
git commit -m "Add OAuth authentication"
git push clever main
```

**Important** : Ajouter les variables d'environnement dans le dashboard CleverCloud :
- `HUWISE_CLIENT_ID`
- `HUWISE_CLIENT_SECRET`
- `HUWISE_AUTH_URL`
- `HUWISE_TOKEN_URL`
- `HUWISE_USER_URL`
- `CALLBACK_URL=https://recette-canaux-bretagne.cleverapps.io/api/auth/callback`
- `CLIENT_URL=https://recette-canaux-bretagne.cleverapps.io`
- `NODE_ENV=production`

### 5. ✔️ Mise à jour de Huwise

Après déploiement, **mettre à jour l'URL de callback enregistrée sur Huwise** :

**De** : `http://localhost:3000/api/auth/callback` (dev)  
**À** : `https://recette-canaux-bretagne.cleverapps.io/api/auth/callback` (prod)

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

```
backend/
├── server.js               ← Serveur Express
├── routes/auth.js          ← Routes OAuth
├── .env.example           ← Template de configuration
├── .gitignore             ← Ignore les fichiers sensibles
├── package.json           ← Dépendances Node
└── README.md              ← Doc backend

assets/scripts/managers/
├── auth.js                ← AuthManager (nouveau)
└── authUI.js              ← AuthUIManager (nouveau)

AUTHENTIFICATION.md        ← Guide détaillé du système
MISE_EN_ROUTE.md          ← Ce fichier
```

### Fichiers modifiés

```
assets/scripts/
├── main.js                ← Import AuthManager et AuthUIManager
└── ui/boatsCardDetails.js ← Paramètre authenticatedUserName

assets/scripts/managers/
└── navigation.js          ← Passage du userName à createBoatDetailsCard
```

---

## 🔑 Points d'intégration clés

### Dans `main.js` (Application class)

```javascript
// AuthManager s'initialise automatiquement
this.authManager = new AuthManager(this, window.location.origin);
this.authUIManager = new AuthUIManager(this);

// Dans init()
this.authUIManager.init(); // Ajoute les boutons au footer
```

### Dans le footer (HTML)

Les boutons sont ajoutés dynamiquement par `AuthUIManager.createAuthButtons()` :
- Bouton "🔐 Connexion" (visible si non connecté)
- Affichage "👤 Jean Dupont" + Bouton "🚪 Déco" (visible si connecté)

### Dans `boatsCardDetails.js`

```javascript
// La fonction accepte maintenant le nom de l'utilisateur connecté
createBoatDetailsCard(boat, authenticatedUserName)
```

### Dans `navigation.js`

```javascript
// Passer le userName lors de la création de la carte
const authenticatedUserName = this.app.authManager?.getUserName() || null;
const boatEl = createBoatDetailsCard(boat, authenticatedUserName);
```

---

## 🧪 Tester le flux complet

1. **Ouvrir l'app** sur `http://localhost:8000`
2. **Cliquer** sur "🔐 Connexion" (dans le footer)
3. **Être redirigé** vers Huwise
4. **Se connecter** avec vos credentials Huwise
5. **Autoriser** l'accès de l'app
6. **Être redirigé** vers l'app avec `?auth=success`
7. **Voir** le nom dans le footer "👤 Jean Dupont"
8. **Cliquer** sur un bateau → voir le nom de l'éclusier connecté
9. **Cliquer** sur "🚪 Déco" → être déconnecté

---

## 📊 Vérification de l'implémentation

### Checklist avant production

- [ ] `.env.example` est rempli avec les bonnes URLs Huwise
- [ ] `backend/.env` local contient les credentials
- [ ] Backend démarre sans erreur : `npm run dev`
- [ ] Client voit le bouton "🔐 Connexion" dans le footer
- [ ] Flux OAuth complet fonctionne en local
- [ ] Callback URL sur Huwise = `localhost:3000/api/auth/callback` (dev)
- [ ] Logs du backend affichent les messages d'authentification
- [ ] Token stocké en HttpOnly cookie (vérifier Developer Tools)
- [ ] Nom utilisateur s'affiche dans le footer après connexion
- [ ] Nom utilisateur s'affiche dans la modal des bateaux
- [ ] Déconnexion supprime les cookies et recharge l'app

### Avant de déployer sur CleverCloud

- [ ] Variables d'env configurées dans le dashboard CleverCloud
- [ ] Callback URL mise à jour sur Huwise = `https://recette-canaux-bretagne.cleverapps.io/api/auth/callback`
- [ ] Déploiement via `git push clever main`
- [ ] Tester le flux complet en prod
- [ ] Mettre à jour la prod finale quand prêt (changement d'URL)

---

## 🔒 Sécurité

Points de sécurité implémentés :

✅ **Token Huwise** : Stocké en HttpOnly cookie (inaccessible au JS)  
✅ **Client Secret** : Jamais exposé au client, gardé serveur seulement  
✅ **Validation CSRF** : Token `state` généré et validé  
✅ **HTTPS** : Cookies `Secure` en production  
✅ **CORS** : Limitée à l'URL du client  
✅ **Expiration** : Tokens expiraent après 24h  

---

## ❓ Questions fréquentes

### Q: Peut-on utiliser localhost en production ?
**R:** Non, il faut une URL HTTPS valide. Le backend sur CleverCloud aura une URL stable.

### Q: Que faire si l'utilisateur ferme le navigateur ?
**R:** Les cookies persistent (24h), donc l'utilisateur reste connecté jusqu'à expiration ou déconnexion manuelle.

### Q: Peut-on utiliser OAuth avec d'autres providers (Google, GitHub) ?
**R:** Oui, la structure OAuth est générique. Il suffirait de changer les URLs Huwise par celles du provider.

### Q: Où sont stockés les tokens ?
**R:** 
- `oauth_token` : HttpOnly cookie (serveur côté)
- `user_info` : Cookie lisible (côté client pour l'affichage)

### Q: Comment renouveler un token ?
**R:** Actuellement, les tokens expirent après 24h. Pour un refresh token, il faudrait implémenter une route supplémentaire.

---

## 📞 Support

Si vous avez besoin de :

- **Aide pour le backend** : Voir `backend/README.md`
- **Comprendre le flux** : Voir `AUTHENTIFICATION.md`
- **Configurer Huwise** : Contacter support Huwise
- **Déployer sur CleverCloud** : Voir la doc CleverCloud

---

## 🎉 Prochaines étapes

Une fois que tout fonctionne :

1. ✅ Mode anonyme vs authentifié fonctionne
2. ✅ Affichage du nom de l'éclusier en mode authentifié
3. 📌 **Futur** : Autres fonctionnalités basées sur l'authentification ?
   - Profil utilisateur
   - Historique de connexion
   - Permissions par rôle
   - etc.

Bonne chance ! 🚀
