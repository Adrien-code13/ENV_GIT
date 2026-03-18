# 01 — Architecture Globale

## 1. Modules fonctionnels

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SI LOGISTIQUE F&L                            │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  RÉFÉRENTIELS│  MOUVEMENTS  │    STOCKS    │      ALERTES           │
│              │              │              │                        │
│  • Produits  │  • Réception │  • Vue stock │  • Incompatibilités    │
│  • Fournis.  │  • Transfert │    en temps  │  • DLC/DDM proches     │
│  • Entrepôts │  • Expédition│    réel      │  • Stock bas           │
│  • Zones     │  • Perte     │  • Historique│  • Rupture de chaîne   │
│  • Règles    │              │  • Valoris.  │    du froid            │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
```

## 2. Entités principales

```
FOURNISSEUR ──< RÉCEPTION >── LOT ──< MOUVEMENT >── EMPLACEMENT
                                │                        │
                           PRODUIT                    ZONE
                                │                        │
                         CATÉGORIE                  ENTREPÔT
                         STOCKAGE
```

### Description des entités

| Entité | Description | Clé |
|--------|-------------|-----|
| `Produit` | Fruit ou légume référencé | code_produit |
| `Fournisseur` | Ferme, grossiste, coopérative | code_fournisseur |
| `Entrepôt` | Bâtiment physique | code_entrepot |
| `Zone` | Subdivision d'un entrepôt (température, humidité) | code_zone |
| `Emplacement` | Rack/palette/casier précis dans une zone | code_emplacement |
| `Lot` | Unité de traçabilité (1 réception = 1 ou N lots) | numéro_lot |
| `Mouvement` | Toute entrée/sortie/transfert d'un lot | id_mouvement |
| `Règle stockage` | Incompatibilité entre deux catégories | id_règle |

## 3. Types de mouvements

| Code | Libellé | Sens | Description |
|------|---------|------|-------------|
| `REC` | Réception | Entrée | Arrivée d'une cargaison d'un fournisseur |
| `TRF` | Transfert | Interne | Déplacement entre deux emplacements/zones |
| `EXP` | Expédition | Sortie | Départ vers un client ou un autre entrepôt |
| `PRT` | Perte | Sortie | Casse, pourriture, non-conformité |
| `INV` | Inventaire | Correction | Ajustement suite à comptage physique |

## 4. États d'un lot

```
         ┌─────────┐
  REC ──>│  EN     │──> TRF ──> STOCKÉ
         │ATTENTE  │
         │ (quai)  │──> PRT (refus à la réception)
         └─────────┘
              │
         Contrôle QC
              │
         ┌────▼────┐
         │ STOCKÉ  │──> TRF ──> STOCKÉ (autre zone)
         │         │──> EXP ──> EXPÉDIÉ
         │         │──> PRT ──> PERDU
         └─────────┘
```

## 5. Architecture technique recommandée (orientations)

| Couche | Recommandation |
|--------|----------------|
| Frontend | Application web responsive (tablette/mobile pour les opérateurs terrain) |
| Backend | API REST JSON |
| Base de données | Relationnelle (PostgreSQL) |
| Impression | Génération d'étiquettes lot (PDF/ZPL pour imprimantes thermiques) |
| Notifications | Alertes in-app + email pour les responsables |

## 6. Profils utilisateurs

| Profil | Accès | Écrans principaux |
|--------|-------|-------------------|
| **Opérateur réception** | Créer réceptions, saisir lots | Réception, Contrôle QC |
| **Magasinier** | Saisir transferts et pertes | Mouvements, Stock zone |
| **Responsable entrepôt** | Tout + paramétrage zones | Tous + Config zones |
| **Administrateur** | Tout + référentiels | Tous |
