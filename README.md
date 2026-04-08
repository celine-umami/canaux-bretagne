# Suivi du Trafic Fluvial - Bretagne

Application web mobile-first pour visualiser et suivre le trafic des bateaux sur les canaux bretons.

## 📋 Description

Cette application permet de :
- Sélectionner un canal breton via un menu dropdown
- Visualiser le tracé du canal sur une carte interactive (Leaflet)
- Voir les écluses présentes sur le canal
- Identifier les bateaux en circulation avec leurs positions
- Obtenir des détails sur les bateaux en cliquant sur leurs marqueurs

## 🎯 Spécifications V1

- **Technologie**: HTML5, CSS3, JavaScript vanilla
- **Responsive**: Mobile-first, adapté pour tous les appareils
- **Pages**: 1 seule page pour la V1
- **Carte**: Leaflet
- **Données**: Hardcodées pour les canaux, mock pour les écluses et bateaux

## 📁 Structure du projet

```
canaux-bretagne/
├── index.html                    # Page HTML principale
├── assets/
│   ├── styles/
│   │   ├── main.css             # Styles globaux et responsive
│   │   └── map.css              # Styles personnalisés Leaflet
│   ├── scripts/
│   │   ├── main.js              # Point d'entrée - orchestration
│   │   ├── map.js               # Gestion de la carte Leaflet
│   │   ├── data.js              # Gestion des données (fetch)
│   │   ├── channels.js          # Données hardcodées des canaux
│   │   └── ui.js                # Gestion de l'interface
│   ├── images/
│   │   └── icons/               # Icônes personnalisées
│   └── data/
│       └── sample-data.json     # (Optionnel) Données de test
├── data-sources/
│   └── api-specs.md             # Documentation des APIs externes
└── README.md                     # Ce fichier
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

### Modules

#### `main.js`
Point d'entrée de l'application. Orchestrat les interactions entre les modules.

#### `map.js` (`MapManager`)
Gère tout ce qui concerne la carte Leaflet:
- Initialisation de la carte
- Affichage du tracé du canal
- Positionnement des marqueurs (écluses, bateaux)
- Manipulation des contrôles Leaflet

#### `data.js`
Module de gestion des données externes:
- `fetchLocksForChannel()` - Récupère les écluses d'un canal
- `fetchBoatsForChannel()` - Récupère les bateaux d'un canal

**À adapter**: Remplacer les données mock par des appels API réels.

#### `channels.js`
Données hardcodées des canaux bretons:
- Noms et IDs
- Coordonnées géographiques
- Tracé du canal

#### `ui.js` (`UIManager`)
Gère l'interface utilisateur:
- Initialisation du dropdown
- Affichage/fermeture de la modal
- Messages d'erreur
- Gestion des événements DOM

### Flux de données

```
┌─────────────────────────────────────────────────────┐
│         Utilisateur interagit (dropdown)           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │  handleChannelChange │
         └────────┬─────────┘
                  │
        ┌─────────┴─────────────────────┐
        │                               │
        ▼                               ▼
  ┌──────────────────┐      ┌─────────────────────┐
  │  getChannelById │      │ initMap (Leaflet)  │
  └────────┬────────┘      └──────────┬──────────┘
           │                          │
           ▼                          ▼
    ┌──────────────┐       ┌──────────────────────┐
    │ Coordonnées  │       │ drawChannelPath     │
    │   tracé      │       └──────────┬───────────┘
    └──────────────┘                  │
                          ┌───────────┴────────────┐
                          │                        │
                          ▼                        ▼
                  ┌─────────────────────────────────────┐
                  │  fetchLocksForChannel / fetchBoats │
                  │  (données mock ou API)             │
                  └─────────┬──────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
          ┌──────────────┐      ┌──────────────┐
          │  addLocks()  │      │  addBoats()  │
          └──────────────┘      └──────────────┘
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │ Carte affichée  │
                    └─────────────────┘
```

### Interaction avec les bateaux

```
┌──────────────────────────┐
│  Clic sur marqueur bateau │
└────────────┬─────────────┘
             │
             ▼
      ┌──────────────────┐
      │ handleBoatClick  │
      └────────┬─────────┘
               │
               ▼
        ┌──────────────────────┐
        │  showBoatsModal()    │
        │  (affiche détails)   │
        └──────────────────────┘
```

## 🔄 Flux de données - Détail

### 1. Initialisation
- Application charge les données hardcodées des canaux
- UIManager initialise le dropdown
- Carte Leaflet est initialisée
- Premier canal est chargé par défaut

### 2. Changement de canal
- L'utilisateur sélectionne un canal dans le dropdown
- `handleChannelChange` est appelé
- `loadChannel` orchestre le chargement:
  - Fetch les données du canal (hardcodées)
  - Affiche le tracé sur la carte
  - Fetch les écluses (données mock)
  - Fetch les bateaux (données mock)
  - Ajoute les marqueurs à la carte

### 3. Interaction utilisateur
- Clic sur un marqueur de bateau
- `handleBoatClick` extrait les données du bateau
- Modal affiche les détails

## 📊 Format des données

### Canaux
```javascript
{
    id: 'nantes-brest',
    name: 'Canal Nantes-Brest',
    bounds: [[lat1, lng1], [lat2, lng2]],
    center: [lat, lng],
    zoom: 9,
    pathCoordinates: [[lat, lng], ...]
}
```

### Écluses
```javascript
{
    id: 'lock-1',
    name: 'Écluse de X',
    position: [lat, lng],
    level: 1
}
```

### Bateaux
```javascript
{
    id: 'boat-1',
    name: 'Le Navigateur',
    owner: 'Jean Dupont',
    position: [lat, lng],
    type: 'Péniche',
    status: 'En circulation',
    direction: 'Nord',
    length: 38.5
}
```

## 🔌 Intégration des APIs externes

Le module `data.js` contient les fonctions pour récupérer les données:

```javascript
// À remplacer par votre endpoint réel
export async function fetchLocksForChannel(channelId) {
    const response = await fetch(`/api/locks?channel=${channelId}`);
    return response.json();
}

export async function fetchBoatsForChannel(channelId) {
    const response = await fetch(`/api/boats?channel=${channelId}`);
    return response.json();
}
```

Voir `data-sources/api-specs.md` pour documenter vos APIs.

## 📱 Responsive Design

- **Mobile (< 480px)**: Optimisé pour téléphones
- **Tablette (480px - 768px)**: Interface adaptée
- **Desktop (> 768px)**: Amélioration cosmétique

Points clés du responsive:
- Header: Flexbox, ajustement de padding
- Dropdown: 100% sur mobile, limité en largeur sur desktop
- Modal: Overlay en bas sur mobile, centré sur desktop
- Carte: 100% de la hauteur disponible

## 🛠️ Développement

### Ajouter un nouveau canal
Modifier `assets/scripts/channels.js`:
```javascript
export const CHANNELS = [
    // ... canaux existants
    {
        id: 'nouveau-canal',
        name: 'Nouveau Canal',
        // ... autres propriétés
    }
];
```

### Modifier les données mock
Modifier les fonctions dans `assets/scripts/data.js`:
- `getMockLocks()`
- `getMockBoats()`

### Intégrer une API réelle
1. Modifier les fonctions `fetch*` dans `data.js`
2. Adapter le format des réponses
3. Gérer les erreurs réseau

### Ajouter des styles personnalisés
- Styles globaux: `assets/styles/main.css`
- Styles Leaflet: `assets/styles/map.css`

Les deux fichiers CSS sont importés dans `index.html`.

## 🎨 Customisation

### Couleurs
Vous pouvez modifier les couleurs dans `main.css` et `map.css`:
- Bleu primaire: `#4a90e2`
- Rouge (bateaux): `#ff6b6b`
- Orange (écluses): `#ffa500`
- Gris: `#f5f5f5`

### Icônes des marqueurs
Éditer les emojis ou créer des SVG dans `map.js`:
```javascript
createBoatIcon() {
    return L.divIcon({
        html: '⛵', // Modifier cet emoji ou utiliser du HTML SVG
        // ...
    });
}
```

## 🚢 V2 et évolutions futures

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
