# SI Logistique Fruits & Légumes — Spécifications Fonctionnelles

## Vue d'ensemble

Ce dossier contient l'ensemble des spécifications fonctionnelles du Système d'Information (SI)
de gestion des stocks et mouvements pour une entreprise de logistique fruits & légumes.

## Objectifs du SI

- Suivre en temps réel les **mouvements** (réceptions, transferts, expéditions, pertes)
- Consulter les **stocks** par zone, produit, lot
- Appliquer les **règles de stockage** (incompatibilités, températures, humidité)
- Rester **léger et opérationnel** — orienté terrain, pas bureaucratique

## Documents

| Fichier | Contenu |
|--------|---------|
| `01-architecture.md` | Architecture globale, modules, flux de données |
| `02-referentiels.md` | Données de référence (produits, fournisseurs, entrepôts, emplacements) |
| `03-regles-stockage.md` | Règles d'incompatibilité, zones thermiques, contraintes |
| `04-processus-mouvements.md` | Processus métier : réception, transfert, expédition, perte |
| `05-ecrans.md` | Catalogue des écrans avec wireframes et descriptions champs |
| `06-cas-usage-carotte.md` | Mise en situation complète : réception d'une cargaison de carottes |

## Périmètre v1

```
[Réception] → [Contrôle qualité] → [Mise en stock] → [Transfert] → [Expédition]
                                                                  → [Perte/Casse]
```

## Hors périmètre v1

- Gestion des commandes clients
- Facturation et comptabilité
- Gestion RH / planning opérateurs
- Traçabilité aval (livraison au client final)
