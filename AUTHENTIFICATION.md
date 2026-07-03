/**
 * GUIDE: Authentification OAuth avec Huwise
 * 
 * Ce fichier explique comment fonctionne le système d'authentification
 * côté client pour l'application Canaux Bretagne
 */

/**
 * ============================================================================
 * 1. ARCHITECTURE
 * ============================================================================
 * 
 * L'authentification fonctionne en trois parties:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        CLIENT (Navigateur)                       │
 * │  ┌──────────────────────────────────────────────────────────┐   │
 * │  │ 1. AuthManager: Gère l'état d'authentification           │   │
 * │  │ 2. AuthUIManager: Gère les boutons connexion/déconnexion │   │
 * │  │ 3. boatsCardDetails: Affiche le nom de l'éclusier        │   │
 * │  └──────────────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                  BACKEND (Node.js/Express)                       │
 * │  ┌──────────────────────────────────────────────────────────┐   │
 * │  │ /api/auth/login       → Redirige vers Huwise            │   │
 * │  │ /api/auth/callback    → Reçoit le code et l'échange     │   │
 * │  │ /api/auth/user        → Récupère les infos utilisateur  │   │
 * │  │ /api/auth/logout      → Déconnecte l'utilisateur       │   │
 * │  └──────────────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    HUWISE OAuth Server                           │
 * │  - Authentifie l'utilisateur                                     │
 * │  - Retourne un token d'accès au backend                         │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 */

/**
 * ============================================================================
 * 2. FLUX DE CONNEXION
 * ============================================================================
 * 
 * 1. Utilisateur clique sur le bouton "🔐 Connexion" (dans le footer)
 * 
 * 2. AuthUIManager.handleLogin() → window.location.href = '/api/auth/login'
 * 
 * 3. Backend: GET /api/auth/login
 *    - Génère un token CSRF `state`
 *    - Redirige vers Huwise avec les params:
 *      ?client_id=xxx&redirect_uri=callback&response_type=code&state=yyy
 * 
 * 4. Huwise: L'utilisateur se connecte et autorise l'app
 * 
 * 5. Huwise redirige vers: /api/auth/callback?code=zzz&state=yyy
 * 
 * 6. Backend: GET /api/auth/callback
 *    - Valide le state CSRF
 *    - Échange le code contre un token (appel sécurisé serveur-à-serveur)
 *    - Récupère les infos utilisateur depuis Huwise
 *    - Stocke le token en HttpOnly cookie (inaccessible au JS)
 *    - Stocke les infos utilisateur en cookie lisible
 *    - Redirige vers le client: ?auth=success
 * 
 * 7. Client: AuthUIManager détecte ?auth=success
 *    - Recharge les infos utilisateur depuis les cookies
 *    - Met à jour l'UI (affiche le nom, cache le bouton connexion)
 *    - Nettoie l'URL
 * 
 */

/**
 * ============================================================================
 * 3. MODULES JAVASCRIPT
 * ============================================================================
 */

/**
 * AuthManager (assets/scripts/managers/auth.js)
 * ─────────────────────────────────────────────────────────────────
 * 
 * Responsabilités:
 * - Charge les infos utilisateur depuis les cookies
 * - Gère l'état d'authentification (isAuthenticated, currentUser)
 * - Lance le flux de connexion
 * - Permet la déconnexion
 * - Notifie les écouteurs quand l'état change
 * 
 * Utilisation:
 * 
 *   // Dans Application (main.js)
 *   this.authManager = new AuthManager(this, window.location.origin);
 *   
 *   // Pour se connecter
 *   app.authManager.login();
 *   
 *   // Pour se déconnecter
 *   app.authManager.logout();
 *   
 *   // Pour récupérer les infos
 *   const userName = app.authManager.getUserName(); // "Jean Dupont"
 *   const isAuth = app.authManager.isAuthenticated;
 *   
 *   // Pour écouter les changements
 *   app.authManager.onAuthStateChanged((isAuthenticated, user) => {
 *       console.log('État changé:', isAuthenticated);
 *   });
 * 
 */

/**
 * AuthUIManager (assets/scripts/managers/authUI.js)
 * ─────────────────────────────────────────────────────────────────
 * 
 * Responsabilités:
 * - Crée les boutons de connexion/déconnexion dans le footer
 * - Gère l'affichage de ces boutons selon l'état d'auth
 * - Traite les callbacks OAuth (?auth=success ou ?auth=error)
 * - Met à jour l'UI en temps réel
 * 
 * Utilisation:
 * 
 *   // Dans Application (main.js)
 *   this.authUIManager = new AuthUIManager(this);
 *   this.authUIManager.init(); // Ajoute les boutons au footer
 * 
 */

/**
 * boatsCardDetails.js
 * ─────────────────────────────────────────────────────────────────
 * 
 * Modification:
 * - La fonction createBoatDetailsCard() accepte maintenant un paramètre:
 *   authenticatedUserName (optionnel)
 * 
 * - Si l'utilisateur est connecté, on affiche son nom à la place
 *   du champ "Éclusier" du bateau
 * 
 * Utilisation:
 * 
 *   // Sans authentification (affiche les infos du bateau)
 *   const card = createBoatDetailsCard(boat);
 *   
 *   // Avec authentification (affiche le nom de l'utilisateur)
 *   const userName = app.authManager.getUserName();
 *   const card = createBoatDetailsCard(boat, userName);
 * 
 */

/**
 * ============================================================================
 * 4. COOKIES UTILISÉS
 * ============================================================================
 */

/**
 * oauth_token (HttpOnly)
 * ───────────────────────────
 * - Stocké par le backend lors du callback
 * - Contient le token d'accès Huwise
 * - HttpOnly: inaccessible depuis le JavaScript (sécurité XSS)
 * - Utilisé automatiquement dans les requêtes vers le backend
 * - Durée: 24 heures
 */

/**
 * user_info
 * ─────────
 * - Stocké par le backend lors du callback
 * - Contient: { name, email, id }
 * - NON-HttpOnly: accessible depuis le JavaScript
 * - Utilisé par AuthManager pour charger les infos au démarrage
 * - Durée: 24 heures
 */

/**
 * oauth_state (HttpOnly)
 * ──────────────────────
 * - Généré par le backend lors de /api/auth/login
 * - Utilisé pour valider le callback CSRF
 * - HttpOnly: inaccessible au JavaScript
 * - Durée: 10 minutes
 * - Supprimé lors de la déconnexion
 */

/**
 * ============================================================================
 * 5. ÉVÉNEMENTS ET OBSERVATIONS
 * ============================================================================
 */

/**
 * Événement: authStateChanged
 * ──────────────────────────
 * Déclenché quand l'état d'authentification change.
 * 
 * Utilisation:
 * 
 *   window.addEventListener('authStateChanged', (event) => {
 *       const { isAuthenticated, user } = event.detail;
 *       console.log('Nouvel état:', isAuthenticated);
 *       console.log('Utilisateur:', user);
 *   });
 * 
 */

/**
 * Paramètres d'URL: auth
 * ─────────────────────
 * Après le callback OAuth, les paramètres suivants peuvent être présents:
 * 
 * ?auth=success
 *   → Authentification réussie
 *   → AuthUIManager recharge les infos et met à jour l'UI
 * 
 * ?auth=error&message=...
 *   → Erreur lors de l'authentification
 *   → Message d'erreur à afficher
 * 
 * Ces paramètres sont supprimés de l'URL après traitement.
 */

/**
 * ============================================================================
 * 6. MODE ANONYME vs MODE AUTHENTIFIÉ
 * ============================================================================
 */

/**
 * DIFFÉRENCES:
 * 
 * Mode Anonyme (Pas connecté):
 * ─────────────────────────────
 * - Bouton "🔐 Connexion" visible dans le footer
 * - Les détails du bateau affichent le champ "Éclusier" du bateau
 * - Exemple: "Jean Martin (données API)"
 * 
 * Mode Authentifié (Connecté):
 * ─────────────────────────────
 * - Affichage "👤 Jean Dupont" dans le footer
 * - Bouton "🚪 Déco" disponible
 * - Les détails du bateau affichent le nom de l'utilisateur connecté
 * - Exemple: "Jean Dupont (utilisateur connecté)"
 * 
 * ⚠️ IMPORTANT: C'est la SEULE différence dans l'UI
 *    Tout le reste de l'application reste identique
 */

/**
 * ============================================================================
 * 7. CONFIGURATION REQUISE
 * ============================================================================
 */

/**
 * Backend .env:
 * ────────────
 * HUWISE_CLIENT_ID=your_client_id
 * HUWISE_CLIENT_SECRET=your_client_secret
 * HUWISE_AUTH_URL=https://auth.huwise.fr/oauth/authorize
 * HUWISE_TOKEN_URL=https://auth.huwise.fr/oauth/token
 * HUWISE_USER_URL=https://api.huwise.fr/v1/user
 * CALLBACK_URL=https://recette-canaux-bretagne.cleverapps.io/api/auth/callback
 * CLIENT_URL=https://recette-canaux-bretagne.cleverapps.io
 * PORT=3000
 * NODE_ENV=development
 * 
 * Voir: backend/.env.example pour le template
 * Voir: backend/README.md pour les instructions complètes
 */

/**
 * Client (index.html + scripts):
 * ──────────────────────────────
 * - AuthManager et AuthUIManager s'initialisent automatiquement
 * - Boutons OAuth sont ajoutés au footer
 * - Tout fonctionne si le backend est accessible
 */

/**
 * ============================================================================
 * 8. DÉVELOPPEMENT LOCAL
 * ============================================================================
 */

/**
 * Pour tester localement:
 * 
 * 1. Terminal 1 - Backend
 *    $ cd backend
 *    $ npm install
 *    $ npm run dev
 *    → Serveur sur http://localhost:3000
 * 
 * 2. Terminal 2 - Client
 *    $ python3 -m http.server 8000
 *    → Client sur http://localhost:8000
 * 
 * 3. Configurer .env (backend):
 *    HUWISE_AUTH_URL=... (à demander à Huwise)
 *    HUWISE_TOKEN_URL=... (à demander à Huwise)
 *    HUWISE_USER_URL=... (à demander à Huwise)
 *    CALLBACK_URL=http://localhost:3000/api/auth/callback
 *    CLIENT_URL=http://localhost:8000
 * 
 * 4. Enregistrer callback sur Huwise:
 *    http://localhost:3000/api/auth/callback
 * 
 * 5. Cliquer sur "🔐 Connexion" → Flux OAuth Huwise
 */

/**
 * ============================================================================
 * 9. TROUBLESHOOTING
 * ============================================================================
 */

/**
 * "Le bouton de connexion ne s'affiche pas"
 * ──────────────────────────────────────
 * - Vérifier: authUIManager.init() est appelé dans Application.init()
 * - Vérifier: le footer existe dans le HTML
 * - Voir console du navigateur pour les erreurs
 */

/**
 * "La connexion redirige mais rien ne se passe"
 * ──────────────────────────────────────────
 * - Vérifier: backend est démarré (npm run dev)
 * - Vérifier: .env du backend est bien rempli
 * - Vérifier: CALLBACK_URL correspond à celle enregistrée sur Huwise
 * - Voir logs du backend pour les erreurs
 */

/**
 * "Le nom de l'éclusier ne change pas"
 * ───────────────────────────────────
 * - Vérifier: createBoatDetailsCard() reçoit le userName
 * - Vérifier: navigation.js passe le userName via authManager.getUserName()
 * - Vérifier: l'utilisateur est bien connecté (voir footer)
 */

/**
 * "Les cookies ne persistent pas"
 * ────────────────────────────
 * - En développement: vérifier que le navigateur accepte les cookies
 * - En production: vérifier que HTTPS est utilisé (cookie.secure = true)
 * - Vérifier: domain/path du cookie correspondent
 */

export default {
    message: 'Voir ce fichier pour comprendre le système d\'authentification OAuth',
    url_backend_doc: 'backend/README.md',
    url_auth_manager: 'assets/scripts/managers/auth.js',
    url_auth_ui_manager: 'assets/scripts/managers/authUI.js'
};
