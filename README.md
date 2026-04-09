# Suivi du Trafic Fluvial - Bretagne

Application web mobile-first pour visualiser et suivre le trafic des bateaux sur les canaux bretons en temps réel.

## 📋 Description

Cette application permet de :
- Sélectionner un canal breton via un menu dropdown (données en temps réel depuis l'API)
- Visualiser le tracé du canal sur une carte interactive (Leaflet)
- Voir les écluses et biefs présents sur le canal
- Identifier les bateaux en circulation avec leurs positions réelles
- Consulter les détails des bateaux en cliquant sur leurs marqueurs
- Modal interactive pour explorer tous les bateaux présents dans un bief

## 🎯 Spécifications Actuelles

- **Technologie**: HTML5, CSS3, JavaScript ES6+ (modules)
- **Architecture**: Modulaire avec classes (Application, MapManager, UIManager)
- **Responsive**: Mobile-first, adapté pour tous les appareils
- **Pages**: 1 seule page SPA
- **Carte**: Leaflet 1.9.4
- **Données**: API Bretagne Data (data.bretagne.bzh)
  - Canaux et navigation: groupe-by voie navigable
  - Écluses et biefs: ref-ecluse-biefs
  - Bateaux: 2026-form-vn-stat

## 📁 Structure du projet

```
canaux-bretagne/
├── index.html                    # Page HTML principale (SPA)
├── assets/
│   ├── styles/
│   │   ├── main.css             # Styles globaux et responsive
│   │   └── map.css              # Styles personnalisés Leaflet
│   ├── scripts/
│   │   ├── main.js              # Classe Application - orchestration et init
│   │   ├── map.js               # Classe MapManager - gestion de la carte Leaflet
│   │   ├── data.js              # Fonctions de fetch API (canaux, écluses, bateaux)
│   │   ├── ui.js                # Classe UIManager - gestion de l'interface DOM
│   │   └── config.js            # Configuration centralisée (URLs API, clés, paramètres)
│   ├── images/
│   │   ├── logo.png             # Logo de l'application
│   │   └── icons/               # Icônes personnalisées (écluses, bateaux)
└── data-sources/
    └── api-specs.md             # Documentation des APIs externes
```

## 🚀 Installation et démarrage

### Prérequis
- Aucun! L'application est en HTML/CSS/JS pur sans dépendances externes
- Un serveur web local (pour éviter les problèmes CORS)

### Démarrage rapide

1. **Avec Python 3** (recommandé) :
```bash
cd canaux-bretagne
python3 -m http.server 8000
```

2. **Avec Node.js (http-server)** :
```bash
npm install -g http-server
cd canaux-bretagne
http-server
```

3. **Avec PHP** :
```bash
cd canaux-bretagne
php -S localhost:8000
```

Accédez ensuite à `http://localhost:8000` dans votre navigateur.

## 🗂️ Architecture

### Orchestration

L'application utilise une **architecture modulaire ES6+** avec 3 classes principales qui communiquent ensemble:

```
Application (main.js)
    ↓
    ├→ MapManager (map.js)     [Gestion de la carte Leaflet]
    ├→ UIManager (ui.js)       [Gestion de l'interface DOM]
    └→ data.js (fonctions)     [Récupération des données API]
```

### Modules détaillés

#### `config.js`
Configuration centralisée de l'application:
- **API_CONFIG.DATA_URL**: Dataset des bateaux en navigation (2026-form-vn-stat)
- **API_CONFIG.ECLUSE_DATA**: Dataset des écluses et biefs (ref-ecluse-biefs)
- **Paramètres Leaflet**: URLs des tuiles, attributions
- **Timeouts**: Configuration des délais d'API

#### `data.js`
Fonctions d'accès aux données externes:
- `fetchChannel()` - Récupère la liste des canaux (groupés par voie_navigable)
- `fetchLocksForChannel(channelId)` - Récupère les écluses d'un canal depuis l'API
- `fetchBoatsForChannel(channelId)` - Récupère les bateaux présents sur un canal
- Gestion des erreurs et des timeouts

#### `main.js` - Classe `Application`
Point d'entrée et orchestration de l'application:
- **init()**: Initialise l'app, récupère les canaux, configure le dropdown
- **loadChannel(channelId)**: Charge un canal, ses écluses et bateaux
- **handleChannelChange()**: Callback du changement de canal
- **handleBoatClick()**: Gère l'affichage de la modal des bateaux

#### `map.js` - Classe `MapManager`
Gestion complète de la carte Leaflet:
- **initMap()**: Crée la carte, ajoute les couches (tuiles, tracé, marqueurs)
- **loadChannel()**: Charge et affiche un canal (tracé, écluses, bateaux)
- **drawChannelPath()**: Dessine le tracé du canal (polyline)
- **addLocks()**: Ajoute les marqueurs des écluses avec popups
- **addBoats()**: Place les bateaux sur la carte avec groupage par bief
- **deduplicateBoats()**: Garde la position la plus récente par bateau
- **createLockIcon() / createBoatIcon()**: Crée les custom icons Leaflet

#### `ui.js` - Classe `UIManager`
Gestion complète de l'interface utilisateur:
- **initChannelSelect()**: Configure le dropdown des canaux
- **showBoatsModal()**: Affiche la modal avec détails des bateaux d'un bief
- **closeModal()**: Ferme la modal (gère aussi Escape, clic background)
- **showLoading() / hideLoading()**: Affiche/cache l'indicateur de chargement
- **showError()**: Affiche un message d'erreur à l'utilisateur
- **handleOrientationChange()**: Adaptation du layout au changement d'orientation

#### `ui.js` (`UIManager`)
Gère l'interface utilisateur:
- Initialisation du dropdown
- Affichage/fermeture de la modal
- Messages d'erreur
- Gestion des événements DOM
## ✨ Fonctionnalités

### En temps réel
- 🔄 Données dynamiques depuis l'API Bretagne Data
- 📍 Positions réelles des bateaux et écluses
- 🗺️ Tracés géographiques précis des canaux
- ⚡ Chargement et rafraîchissement rapides

### Gestion des bateaux
- 🚢 Déduplication automatique des bateaux (garde le plus récent par nom)
- 🎯 Groupage des bateaux par bief (section de canal)
- 📝 Modal détaillée avec informations complètes
- 🖱️ Interaction au clic pour explorer les bateaux

### Interface utilisateur
- 🎨 Design mobile-first et responsive
- 🖥️ Adaptation dynamique selon l'orientation (portrait/paysage)
- ⌨️ Fermeture de modal avec touche Escape
- 📱 Contrôles tactiles optimisés

## 🔄 Flux de l'application

### Initialisation
```
1. Page charge (DOMContentLoaded)
2. Application() créée et initialise
3. MapManager prépare la carte Leaflet
4. UIManager configure le dropdown
5. fetchChannel() récupère les canaux de l'API
6. Premier canal chargé automatiquement
```

### Changement de canal
```
Sélection dropdown
    ↓
handleChannelChange()
    ↓
loadChannel(channelId)
    ├→ MapManager.loadChannel()
    │   ├→ drawChannelPath()
    │   ├→ fetchLocksForChannel() + addLocks()
    │   ├→ fetchBoatsForChannel() + addBoats()
    │   └→ deduplicateBoats() [garde le plus récent]
    │
    └→ UIManager.hideLoading()
```

### Interaction utilisateur
```
Clic sur marqueur bateau
    ↓
handleBoatClick(boats)
    ↓
UIManager.showBoatsModal(boats)
    ↓
Modal affichée avec détails
```

## 📊 Format des données API

### Réponse fetchChannel()
```json
{
  "results": [
    {
      "voie_navigable": "Canal de Nantes à Brest",
      // autres champs regroupés
    }
  ]
}
```

### Réponse fetchLocksForChannel()
```json
{
  "results": [
    {
      "nom": "Écluse de Violettes",
      "nom_formulaire": "Écluse des Violettes",
      "num_ecluse": "1",
      "geo_point": "47.8456, -3.3621",
      "sens": "Amont"
    }
  ]
}
```

### Réponse fetchBoatsForChannel()
```json
{
  "results": [
    {
      "nom_bateau": "Mon Bateau",
      "voie_navigable": "Canal Nantes-Brest",
      "idtech": "2026-03-13T10:56:06.683+01:00",
      "geo_point": "47.8456, -3.3621"
    }
  ]
}
```

## 🔌 Intégration API

### Configuration centralisée
Voir `config.js` pour les URLs des 2 datasets Bretagne Data:
- **DATA_URL**: Bateaux en navigation (2026-form-vn-stat)
- **ECLUSE_DATA**: Écluses et biefs (ref-ecluse-biefs)

Les données sont récupérées dynamiquement par `data.js` selon le canal sélectionné.

## 📱 Responsive & Accessibilité

- ✅ Mobile-first (< 480px)
- ✅ Tablette (480px - 768px)
- ✅ Desktop (> 768px)
- ✅ Gestion orientation portrait/paysage
- ✅ Clavier (Escape pour fermer modal)
- ✅ Labels accessibles (aria-label)

## 🎨 Customisation

### Couleurs principales
- Tracé canal: `#4a90e2` (bleu)
- Marqueurs bateaux: `#ff6b6b` (rouge)
- Marqueurs écluses: `#ffa500` (orange)

### Modification des icônes
Éditer `MapManager.createLockIcon()` et `createBoatIcon()` dans `map.js`:
```javascript
createBoatIcon() {
    return L.divIcon({
        html: '⛵', // Changer l'emoji ou SVG
        iconSize: [32, 32],
        // ...
    });
}
```

## 🚀 Déploiement & Performance

- ✅ Zero-dépendance (CDN Leaflet seulement)
- ✅ Modules ES6 statiques (pas de build)
- ✅ Logs debug dans console (window.app, window.mapManager)
- ✅ Gestion erreurs API avec messages utilisateur

## 🚀 Évolutions futures possibles

- Ajouter 2 pages supplémentaires (navigation principale)
- Filtrer les bateaux par type
- Historiques des trajets
- Notifications en temps réel
- WebSockets pour le suivi en direct
- Données réelles depuis des APIs tierces

## 📝 Notes

- Liaison Leaflet via CDN unpkg (pas d'installation npm requise)
- Pas de framework front-end (vanilla JS)
- Données mock facilement remplaçables
- Architecture modulaire pour éviter les dépendances circulaires

## 🐛 Debug

Les instances globales sont disponibles dans la console:
```javascript
window.app              // Instance Application
window.mapManager       // Instance MapManager
window.uiManager        // Instance UIManager
```

Utilisez-les pour tester rapidement:
```javascript
// Charger un canal spécifique
window.app.loadChannel('vilaine');

// Afficher les bateaux actuels
console.log(window.app.boats);

// Contrôler la carte directement
window.mapManager.getMap().setZoom(10);
```

## 📄 Licence

À définir

## 👥 Auteur

Créé pour le suivi du trafic fluvial breton
