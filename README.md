# Rap Lyrics Video Generator

Générateur de vidéos TikTok/YouTube avec paroles de rap et explications de termes, utilisant Remotion.

## Installation

```bash
npm install
```

## Utilisation

### Lancer le studio Remotion

```bash
npm start
```

### Rendre une vidéo

```bash
npm run build
```

## Structure du JSON

Le fichier JSON contient toutes les informations nécessaires pour générer la vidéo :

```json
{
  "id": "unique-id",
  "track": {
    "title": "Titre de la chanson",
    "artist": "Nom de l'artiste",
    "album": "Nom de l'album",
    "year": 2024
  },
  "lyrics": [
    {
      "id": "line-001",
      "text": "Texte de la ligne",
      "startTime": 0,
      "endTime": 3,
      "terms": [
        {
          "term": "mot",
          "definition": "Explication du terme",
          "category": "argot"
        }
      ],
      "showExplanation": true
    }
  ],
  "style": {
    "backgroundColor": "#0a0a0f",
    "textColor": "#ffffff",
    "highlightColor": "#ff6b35",
    "fontSize": 52,
    "animationStyle": "slide"
  },
  "config": {
    "width": 1080,
    "height": 1920,
    "fps": 30
  }
}
```

## Catégories de termes

- `argot` - Argot français
- `verlan` - Mots en verlan
- `reference` - Références culturelles
- `anglicisme` - Mots empruntés à l'anglais
- `expression` - Expressions idiomatiques

## Styles d'animation

- `fade` - Fondu entrant/sortant
- `slide` - Glissement vertical
- `bounce` - Effet rebond
- `typewriter` - Effet machine à écrire

## Formats de sortie

- **TikTok** (1080x1920) - Format vertical 9:16
- **YouTube Shorts** (1080x1920) - Format vertical 9:16
- **YouTube Standard** (1920x1080) - Format horizontal 16:9
