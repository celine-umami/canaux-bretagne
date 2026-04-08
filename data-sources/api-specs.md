# Spécifications des sources de données

Cette page documente les APIs externes à intégrer pour la V1 et au-delà.

## À déterminer

### 1. API Écluses
**Objectif**: Récupérer la liste des écluses pour un canal donné

**À définir**:
- URL de l'endpoint
- Paramètres de requête (ex: `?channel=nantes-brest`)
- Format de la réponse
- Authentification requise?

**Format de réponse attendue** (à adapter):
```json
{
    "locks": [
        {
            "id": "lock-1",
            "name": "Écluse de Careil",
            "position": {
                "latitude": 47.35,
                "longitude": -1.62
            },
            "level": 1,
            "status": "operational"
        }
    ]
}
```

### 2. API Bateaux
**Objectif**: Récupérer la liste des bateaux en circulation sur un canal

**À définir**:
- URL de l'endpoint
- Paramètres de requête (ex: `?channel=nantes-brest`)
- Format de la réponse
- Fréquence de mise à jour?
- Authentification requise?

**Format de réponse attendue** (à adapter):
```json
{
    "boats": [
        {
            "id": "boat-1",
            "name": "Le Navigateur",
            "owner": "Jean Dupont",
            "type": "Péniche",
            "position": {
                "latitude": 47.42,
                "longitude": -1.65
            },
            "status": "in_transit",
            "direction": "North",
            "length_meters": 38.5,
            "last_updated": "2026-04-08T10:30:00Z"
        }
    ]
}
```

## Notes pour l'intégration

Lors de l'intégration réelle:

1. **Gestion des erreurs**: Adapter les try/catch dans `data.js`
2. **CORS**: Si les APIs sont sur un domaine différent, vérifier les headers CORS
3. **Rate limiting**: Implémenter un cache ou throttle si nécessaire
4. **Timeout**: Ajouter des timeouts aux requêtes fetch
5. **Format des coordonnées**: Vérifier si les APIs utilisent `[lat, lng]` ou `{lat, lng}`
6. **Authentification**: Ajouter headers d'authentification si nécessaire (tokens, API keys, etc.)

## Exemple d'intégration

Remplacer dans `assets/scripts/data.js`:

```javascript
export async function fetchLocksForChannel(channelId) {
    try {
        const response = await fetch(`YOUR_API_URL/locks?channel=${channelId}`, {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Adapter le format de réponse si nécessaire
        return data.locks.map(lock => ({
            id: lock.id,
            name: lock.name,
            position: [lock.position.latitude, lock.position.longitude],
            level: lock.level
        }));
    } catch (error) {
        console.error('Erreur lors du chargement des écluses:', error);
        return [];
    }
}
```

## À déterminer avec le client/équipe

- [ ] URL et authentification des APIs
- [ ] Format exact des réponses
- [ ] Fréquence de rafraîchissement des données en temps réel
- [ ] Gestion des données manquantes ou incohérentes
- [ ] Zones géographiques couvertes (toute la Bretagne ou régions spécifiques?)
- [ ] Quels champs supplémentaires sont importants pour les bateaux?
- [ ] Quels champs supplémentaires sont importants pour les écluses?
