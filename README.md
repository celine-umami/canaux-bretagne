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
  - **Division intelligente**: Le canal "Canal de Nantes à Brest" (219 écluses) est automatiquement divisé en 3 sections pour optimiser les requêtes API
  - Chaque section dispose d'un identifiant unique (`Canal de Nantes à Brest_section_1`, etc.)
- `fetchLocksForChannel(channel)` - Récupère les écluses d'un canal/section depuis l'API
  - Accepte les noms simples ou les objets canal avec plages `minEcluse/maxEcluse`
  - Gère la pagination automatique (3 requêtes parallèles pour les grands canaux)
- `fetchBoatsForChannel(channel)` - Récupère les bateaux présents sur un canal
  - **Filtrage par date** au niveau API: récupère uniquement les bateaux des 48 dernières heures
  - Utilise le champ `idtech` (timestamp) pour filtrer hier + aujourd'hui
  - Élimine les bateaux dupliqués (garde le plus récent par nom)
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
- **addLocks()**: Ajoute les marqueurs des écluses 
  - Icônes minimales (4x4px) pour un affichage discret
  - **Opacité variable selon zoom**: 0 (zoom < 10) → 0.6 (zoom 10-11) → 0.8 (zoom 12) → 1 (zoom 13+)
  - Améliore la lisibilité lors du dézoom
- **addBoats()**: Place les bateaux sur la carte avec groupage intelligent
  - **Groupage par position géographique** (lat, lng) pour consolider les bateaux convergents
  - Bateaux positionnés à leur écluse correspondante (`point_geo_bief`)
  - Respecte la direction (Montant/Descendant) pour chaque bateau
  - Les bateaux de directions opposées au même endroit partagent un marqueur
- **createLockIcon()**: Icône minimale pour les écluses
- **createBoatIcon()**: Icône personnalisée avec compteurs directionnels
  - Badge "M" pour les bateaux Montant
  - Badge "D" pour les bateaux Descendant
  - Affichage combiné des deux directions quand applicable
- **deduplicateBoats()**: Garde la position la plus récente par bateau (par nom)
- **setupLockMarkersZoomListener()**: Gère l'opacité dynamique des marqueurs selon le niveau de zoom

#### `ui.js` - Classe `UIManager`
Gestion complète de l'interface utilisateur:
- **initChannelSelect()**: Configure le dropdown des canaux
  - Affiche les sections du "Canal de Nantes à Brest" avec leurs plages d'écluses
- **showBoatsModal()**: Affiche la modal avec détails des bateaux d'un groupe
  - **Tri décroissant**: Bateaux affichés du plus récent au plus ancien (par timestamp `idtech`)
- **closeModal()**: Ferme la modal (gère aussi Escape, clic background)
- **showLoading() / hideLoading()**: Affiche/cache l'indicateur de chargement
- **showError()**: Affiche un message d'erreur à l'utilisateur
- **handleOrientationChange()**: Adaptation du layout au changement d'orientation
## ✨ Fonctionnalités

### En temps réel
- 🔄 Données dynamiques depuis l'API Bretagne Data
- 📍 Positions réelles des bateaux et écluses
- 🗺️ Tracés géographiques précis des canaux
- ⚡ Chargement et rafraîchissement rapides

### Gestion des bateaux
- 🚢 Déduplication automatique des bateaux (garde le plus récent par nom)
- 🎯 **Groupage par position géographique** (lat, lng) - consolide les bateaux qui convergent au même endroit
- 🧭 **Compteurs directionnels**: Affiche les bateaux Montant (M) et Descendant (D) séparément
- ⏰ **Filtrage temporel**: Récupère uniquement les bateaux des 48 dernières heures (hier + aujourd'hui)
- 📝 Modal détaillée avec informations complètes, **triées par heure décroissante** (plus récent en premier)
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
      "id": "Canal de Nantes à Brest_section_1",
      "displayName": "Canal de Nantes à Brest écluse n°1 à 73",
      "voie_navigable": "Canal de Nantes à Brest",
      "minEcluse": 1,
      "maxEcluse": 73
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
      "sens": "Montant",
      "point_geo_bief": {
        "lat": 47.8456,
        "lon": -3.3621
      },
      "geo_point": "47.8456, -3.3621"
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
      "num_ecluse": "5",
      "sens": "Montant",
      "idtech": "2026-04-21T10:56:06.683+01:00"
    }
  ]
}
```

**Notes importantes:**
- Les champs `point_geo_bief` (objet avec lat/lon) ou `geo_point` (string) contiennent les coordonnées précises
- Le champ `idtech` (timestamp ISO 8601) est utilisé pour le tri descendant et le filtrage temporel
- `sens` peut être "Montant" ou "Descendant"
- `num_ecluse` identifie l'écluse de référence du bateau

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

## 🚀 Optimisations & Performance

### Optimisations implémentées
- ✅ **Division des grands canaux**: "Canal de Nantes à Brest" (219 écluses) divisé en 3 sections pour réduire la charge API
- ✅ **Filtrage API côté serveur**: Date filtering au niveau de l'API (hier + aujourd'hui) plutôt que client
- ✅ **Groupage géographique**: Bateaux consolidés par position (lat, lng) pour réduire les marqueurs affichés
- ✅ **Opacité variable des écluses**: Améliore les performances visuelles lors du zoom
- ✅ **Zero-dépendance** (CDN Leaflet seulement)
- ✅ **Modules ES6 statiques** (pas de build)
- ✅ **Gestion erreurs API** avec messages utilisateur

## 🚀 Évolutions futures possibles

- 📌 **Page de navigation** (déjà planifiée): Liste des canaux avec comptage en temps réel des bateaux
- 🔄 Fonction NavigationManager pour le pré-traitement des chaînes de navigation
- 🔙 Bouton "Retour" pour naviguer entre page de sélection et carte
- Filtrer les bateaux par type
- Historiques des trajets
- Notifications en temps réel
- WebSockets pour le suivi en direct
- Données réelles depuis des APIs tierces supplémentaires

## 📝 Notes

- Liaison Leaflet via CDN unpkg (pas d'installation npm requise)
- Pas de framework front-end (vanilla JS)
- Données mock facilement remplaçables
- Architecture modulaire pour éviter les dépendances circulaires

## 📋 Évolutions récentes (Avril 2026)

### v1.2 - Optimisation du groupage et du filtrage
- ✨ **Groupage géographique des bateaux**: Changement du modèle de groupage de (num_ecluse|sens) vers (lat, lng)
  - Bateaux de directions opposées au même endroit partagent maintenant un marqueur
  - Améliore la clarté visuelle sur la carte
- 🎯 **Compteurs directionnels**: Les icônes de bateaux affichent "M" (Montant) et "D" (Descendant) séparément
- ⏰ **Filtrage temporel API**: Les bateaux sont filtrés au niveau API (hier + aujourd'hui)
- 📊 **Tri des détails**: Les bateaux dans la modal sont triés du plus récent au plus ancien
- 🏗️ **Optimisation des grands canaux**: Division du "Canal de Nantes à Brest" en 3 sections

### v1.1 - Amélioration visuelle et UX
- 🔍 Marqueurs d'écluse minimisés (4x4px) pour moins distraire de la vue principale
- 📈 Opacité dynamique des écluses selon le niveau de zoom
- 🎨 Meilleure hiérarchie visuelle entre bateaux et infrastructure

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
