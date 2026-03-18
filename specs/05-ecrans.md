# 05 — Catalogue des Écrans

## Navigation principale

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🥕 LogiFL                           [🔔 2 alertes]  [👤 J.Dupont ▼]    │
├──────────┬─────────────────────────────────────────────────────────────  │
│          │                                                               │
│  📦 Stocks│                   CONTENU PRINCIPAL                          │
│  🚛 Mouvem│                                                               │
│  📋 Récept│                                                               │
│  📊 Tableaubord                                                           │
│  ⚙️ Config│                                                               │
│          │                                                               │
└──────────┴───────────────────────────────────────────────────────────────┘
```

---

## MOV-01 — Tableau de bord

**Rôle :** Page d'accueil opérationnelle. Vue synthétique du jour.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TABLEAU DE BORD                               Mercredi 18 Mars 2026     │
├────────────┬─────────────┬────────────────┬─────────────────────────────┤
│ RÉCEPTIONS │ EXPÉDITIONS │ ALERTES        │ STOCK CRITIQUE              │
│   DU JOUR  │   DU JOUR   │                │                             │
│            │             │ ⚠️ 2 DLC < 48h │  CAR-001  1 240 kg   ██░   │
│    3       │     1       │ ❌ 1 rupture   │  LAI-001    320 kg   █░░   │
│ réceptions │ expéditions │    froid       │                             │
│ en cours   │ planifiées  │                │  [Voir stock complet]       │
├────────────┴─────────────┴────────────────┴─────────────────────────────┤
│  DERNIERS MOUVEMENTS                                                     │
├──────────────────┬──────────────────────────────┬────────────┬──────────┤
│ Heure            │ Description                  │ Lot        │ Opérat.  │
├──────────────────┼──────────────────────────────┼────────────┼──────────┤
│ 09:42            │ REC — Carottes (Ferme Morin)  │LOT-260318-7│ M.Leroy  │
│ 08:15            │ EXP — Laitues (Client Métro)  │LOT-260317-3│ S.Martin │
│ 07:30            │ PRT — Tomates (pourriture)    │LOT-260315-1│ M.Leroy  │
└──────────────────┴──────────────────────────────┴────────────┴──────────┘
```

---

## REC-01 — Liste des réceptions

**Rôle :** Vue de toutes les réceptions, filtrable par statut/date.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Réceptions                              [+ Nouvelle réception]  [🔍]   │
├──────────────────────────────────────────────────────────────────────────┤
│  Filtres : [Date ▼] [Fournisseur ▼] [Statut ▼]    [Aujourd'hui] [7j]   │
├──────────────┬──────────────────┬──────────────────┬──────────┬─────────┤
│ N° Réception │ Fournisseur      │ Produits         │ Date     │ Statut  │
├──────────────┼──────────────────┼──────────────────┼──────────┼─────────┤
│ REC-260318-03│ Ferme Morin      │ Carottes (3 lots)│ 18/03/26 │ 🟡 En cours│
│ REC-260318-02│ Coop. Loire Verd.│ Laitues, Brocolis│ 18/03/26 │ ✅ Terminée│
│ REC-260317-05│ Import Soleil    │ Bananes          │ 17/03/26 │ ✅ Terminée│
│ REC-260316-01│ Ferme Petit      │ Pommes de terre  │ 16/03/26 │ ⛔ Refusée│
└──────────────┴──────────────────┴──────────────────┴──────────┴─────────┘
```

---

## REC-02 — Création / En-tête de réception

**Rôle :** Première étape du processus de réception. Saisie des informations générales.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Nouvelle réception — Étape 1/4 : En-tête         [Annuler] [Suivant >]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Fournisseur *                                                            │
│  ┌──────────────────────────────────────────────────────────┐            │
│  │ 🔍 Rechercher un fournisseur...                          │            │
│  │   > Ferme Morin (FARM-042) — Légumes racines             │            │
│  └──────────────────────────────────────────────────────────┘            │
│                                                                           │
│  Date et heure d'arrivée *     Heure arrivée camion *                    │
│  [18/03/2026         ]         [09:35              ]                      │
│                                                                           │
│  N° BL Fournisseur (optionnel)    Température camion à réception *       │
│  [BL-MORIN-20260318  ]            [  3.2  ] °C                           │
│                                                                           │
│  Immatriculation camion           N° Sceau / plombage                    │
│  [AB-123-CD          ]            [SC-44892           ]                   │
│                                                                           │
│  Commentaire                                                              │
│  [                                                               ]        │
│                                                                           │
│  ⚠️ Température camion hors norme ?  Si > température max produit : ALERTE│
└──────────────────────────────────────────────────────────────────────────┘
```

**Règles de validation :**
- Fournisseur : obligatoire, doit exister dans les référentiels
- Température camion : si hors plage du premier produit attendu → avertissement immédiat

---

## REC-03 — Contrôle qualité

**Rôle :** Saisie du résultat du contrôle à l'arrivée.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Réception REC-260318-03 — Étape 2/4 : Contrôle qualité  [< Retour] [Suivant >]│
├──────────────────────────────────────────────────────────────────────────┤
│  Fournisseur : Ferme Morin | Camion : AB-123-CD | T° camion : 3.2°C      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  RÉSULTAT GLOBAL DU CONTRÔLE *                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ● CONFORME                                                      │    │
│  │  ○ CONFORME AVEC RÉSERVES  (commentaire obligatoire)             │    │
│  │  ○ NON-CONFORME PARTIEL    (préciser les lots refusés)           │    │
│  │  ○ NON-CONFORME TOTAL      (refus de la livraison)               │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  DÉTAIL DU CONTRÔLE                                                       │
│  ┌────────────────────────────────────┬────────┬───────────────────────┐ │
│  │ Point de contrôle                  │ Résult.│ Commentaire           │ │
│  ├────────────────────────────────────┼────────┼───────────────────────┤ │
│  │ Intégrité des emballages           │ ✅     │                       │ │
│  │ Absence de moisissures visibles    │ ✅     │                       │ │
│  │ Température produit (sonde)        │ ✅  3°C│                       │ │
│  │ Dates limites / étiquetage         │ ✅     │                       │ │
│  │ Conformité quantité BL             │ ⚠️     │ 2 colis manquants     │ │
│  │ Absence de nuisibles               │ ✅     │                       │ │
│  └────────────────────────────────────┴────────┴───────────────────────┘ │
│                                                                           │
│  Commentaire général                                                      │
│  [2 colis absents signalés au chauffeur — avoir à créer                ]  │
│                                                                           │
│  Photos (optionnel)   [📷 Ajouter photo]                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## REC-04 — Saisie des lots

**Rôle :** Détail produit par produit de ce qui arrive.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Réception REC-260318-03 — Étape 3/4 : Saisie des lots   [+ Ajouter lot]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  LOT 1  ──────────────────────────────────────────────────────── [🗑️]  │
│  Produit *          [🔍 Carotte lavée (CAR-001)              ▼]          │
│  Quantité *         [ 4 800 ] kg   Nb colis : [ 200 ] (auto: 24kg/colis) │
│  Date récolte       [12/03/2026]   DLC calculée : 02/04/2026 (21j) ✅    │
│  N° lot fournisseur [LOT-MORIN-2603-A     ]  (optionnel)                 │
│  Qualité            [● Catégorie I  ○ Catégorie II  ○ Déclassé]          │
│                                                                           │
│  LOT 2  ──────────────────────────────────────────────────────── [🗑️]  │
│  Produit *          [🔍 Carotte sable (CAR-002)              ▼]          │
│  Quantité *         [ 2 400 ] kg   Nb colis : [ 100 ]                    │
│  Date récolte       [10/03/2026]   DLC calculée : 31/03/2026 (21j) ✅    │
│  N° lot fournisseur [LOT-MORIN-2603-B     ]                              │
│  Qualité            [● Catégorie I  ○ Catégorie II  ○ Déclassé]          │
│                                                                           │
│  ─────────────────────────────────────────────────────────────────────── │
│  RÉCAPITULATIF                                                            │
│  Total : 2 lots | 7 200 kg | 300 colis                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## REC-05 — Affectation des emplacements

**Rôle :** Associer chaque lot à un emplacement physique. C'est ici que les règles de stockage sont appliquées.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Réception REC-260318-03 — Étape 4/4 : Affectation emplacements          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  LOT 1 — Carotte lavée (CAR-001) — 4 800 kg  ─────────────────────────  │
│                                                                           │
│  Zones compatibles (filtrage automatique) :                               │
│  ● Zone A — Froid léger (ENT01-ZA) : 0–4°C, 92% hum. — 12 palettes libres│
│  ○ Zone A2 — Froid léger bis (ENT01-ZA2) : 0–4°C, 91% — 4 palettes lib. │
│                                                                           │
│  ⚠️ Zones exclues (règles d'incompatibilité) :                            │
│  ✗ Zone C — Frais (ENT01-ZC) : contient des Pommes Golden → RÈGLE-001    │
│  ✗ Zone E — Ambiant (ENT01-ZE) : contient des Oignons → RÈGLE-002        │
│                                                                           │
│  Emplacement choisi * : [ENT01-ZA-R02-E01 ▼]   Capacité dispo: 6 000 kg │
│                                                                           │
│  ┌────────────────────────────────────────────┐                          │
│  │ ✅ Aucune incompatibilité détectée         │                          │
│  │    Zone A — Froid léger                    │                          │
│  │    Produits présents : Betterave (RACINE_FROID) ✅                    │
│  └────────────────────────────────────────────┘                          │
│                                                                           │
│  LOT 2 — Carotte sable (CAR-002) — 2 400 kg  ─────────────────────────  │
│  Emplacement choisi * : [ENT01-ZA-R02-E02 ▼]                             │
│  ✅ Compatible                                                            │
│                                                                           │
│  ─────────────────────────────────────────────────────────────────────── │
│  [Imprimer étiquettes (2)]         [< Retour]    [✅ Valider réception]  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## STK-01 — Vue des stocks en temps réel

**Rôle :** Consulter le stock global ou par zone/produit.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Stocks en temps réel                          Mis à jour : 09:47        │
├──────────────────────────────────────────────────────────────────────────┤
│  Filtres : [Entrepôt ▼] [Zone ▼] [Produit ▼] [DLC < X jours]  [🔍]     │
│  Vue :     [● Par produit]  [○ Par emplacement]  [○ Par zone]            │
├──────────┬─────────────────┬──────────┬──────────┬──────────┬────────────┤
│ Produit  │ Libellé         │ Quantité │ Unité    │ Nb lots  │ DLC min    │
├──────────┼─────────────────┼──────────┼──────────┼──────────┼────────────┤
│ CAR-001  │ Carotte lavée   │  6 040   │ kg       │   3      │ 28/03/26 🟡│
│ CAR-002  │ Carotte sable   │  2 400   │ kg       │   1      │ 31/03/26 ✅│
│ LAI-001  │ Laitue iceberg  │    320   │ kg       │   1      │ 20/03/26 🔴│
│ BET-001  │ Betterave rouge │  1 800   │ kg       │   2      │ 05/04/26 ✅│
│ BAN-001  │ Banane          │  3 200   │ kg       │   2      │ 22/03/26 🟡│
└──────────┴─────────────────┴──────────┴──────────┴──────────┴────────────┘
  🔴 DLC < 48h   🟡 DLC < 7j   ✅ OK

  [Exporter CSV]  [Rapport inventaire]
```

---

## STK-02 — Détail d'un lot

**Rôle :** Fiche complète d'un lot, historique de ses mouvements.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Lot LOT-260318-0007                                [Transfert] [Perte]  │
├────────────────────────────┬─────────────────────────────────────────────┤
│ IDENTIFICATION             │ LOCALISATION ACTUELLE                       │
│ Produit : Carotte lavée    │ Entrepôt : ENT-01 Principal                 │
│ Code    : CAR-001          │ Zone     : Zone A — Froid léger              │
│ Qté initiale : 4 800 kg    │ Empl.    : ENT01-ZA-R02-E01                 │
│ Qté actuelle : 4 800 kg    │ T° zone  : 3.1°C ✅                         │
│                            │                                             │
│ TRAÇABILITÉ                │ DATES                                       │
│ Fournisseur : Ferme Morin  │ Réception   : 18/03/2026 09:42             │
│ N° lot four.: LOT-MORIN-A  │ Date récolte: 12/03/2026                   │
│ Qualité     : Catégorie I  │ DLC         : 02/04/2026 ✅ (15j restants) │
│ QC          : Conforme     │                                             │
├────────────────────────────┴─────────────────────────────────────────────┤
│  HISTORIQUE DES MOUVEMENTS                                               │
├──────────────────┬─────────────────────┬────────────┬────────────────────┤
│ Date/Heure       │ Type                │ Quantité   │ Opérateur          │
├──────────────────┼─────────────────────┼────────────┼────────────────────┤
│ 18/03/26 09:42   │ REC — Réception     │ +4 800 kg  │ M. Leroy           │
└──────────────────┴─────────────────────┴────────────┴────────────────────┘
```

---

## STK-03 — Vue par zone (plan de masse simplifié)

**Rôle :** Visualisation de l'occupation des zones d'un entrepôt.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Entrepôt ENT-01 — Vue zones                                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐  ┌──────────────────────┐                      │
│  │  ZONE A — 0-4°C      │  │  ZONE B — 4-8°C      │                      │
│  │  Froid léger         │  │  Froid modéré        │                      │
│  │  ████████████░░░░    │  │  ████░░░░░░░░░░░░    │                      │
│  │  75% occupé (9/12)   │  │  25% occupé (2/8)    │                      │
│  │  Carottes, Betteraves│  │  Laitues             │                      │
│  └──────────────────────┘  └──────────────────────┘                      │
│                                                                           │
│  ┌──────────────────────┐  ┌──────────────────────┐                      │
│  │  ZONE C — 8-12°C     │  │  ZONE D — 12-16°C    │                      │
│  │  Tempéré frais       │  │  Tempéré             │                      │
│  │  ██████░░░░░░░░░░    │  │  ████████░░░░░░░░    │                      │
│  │  40% (4/10)          │  │  50% (5/10)          │                      │
│  │  Pommes Golden ⚠️    │  │  Tomates, Poivrons   │                      │
│  └──────────────────────┘  └──────────────────────┘                      │
│                                                                           │
│  ┌──────────────────────┐  ┌──────────────────────┐                      │
│  │  ZONE E — Tropical   │  │  ZONE F — Ambiant sec│                      │
│  │  13-18°C             │  │  15-20°C             │                      │
│  │  ████████████░░░░    │  │  ████░░░░░░░░░░░░    │                      │
│  │  75% (6/8)           │  │  20% (1/5)           │                      │
│  │  Bananes, Avocats    │  │  Oignons             │                      │
│  └──────────────────────┘  └──────────────────────┘                      │
│                                                                           │
│  ⚠️ Zone C : Pommes Golden (DLC dans 5 jours)                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## ALR-01 — Centre d'alertes

**Rôle :** Centralise toutes les alertes actives.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Alertes actives (3)                                    [Tout marquer lu]│
├──────────────────────────────────────────────────────────────────────────┤
│  🔴 CRITIQUE — DLC dépassée                              18/03/26 07:00  │
│     Lot LOT-260315-001 — Laitue iceberg — Zone B                         │
│     DLC : 17/03/2026 — Depuis 1 jour                                     │
│     [Déclarer perte]  [Voir lot]                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  🟠 ALERTE — DLC dans moins de 48h                       18/03/26 06:00  │
│     Lot LOT-260316-003 — Tomates ronde — Zone D                          │
│     DLC : 20/03/2026 — 2 jours restants — 450 kg                         │
│     [Préparer expédition]  [Voir lot]                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  🟡 INFO — Rupture de chaîne du froid suspectée          18/03/26 08:32  │
│     Zone A — Sonde T° : pic à 6.8°C pendant 12 min                       │
│     Lots concernés : LOT-260318-7, LOT-260318-8                           │
│     [Enquêter]  [Valider comme normale]                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Synthèse des écrans

| Code | Écran | Module | Profil minimum |
|------|-------|--------|----------------|
| MOV-01 | Tableau de bord | Général | Opérateur |
| REC-01 | Liste réceptions | Réception | Opérateur |
| REC-02 | Créer réception (en-tête) | Réception | Opérateur |
| REC-03 | Contrôle qualité | Réception | Opérateur |
| REC-04 | Saisie des lots | Réception | Opérateur |
| REC-05 | Affectation emplacements | Réception | Opérateur |
| STK-01 | Stocks en temps réel | Stocks | Opérateur |
| STK-02 | Détail d'un lot | Stocks | Opérateur |
| STK-03 | Vue par zone | Stocks | Magasinier |
| TRF-01 | Créer transfert | Mouvements | Magasinier |
| EXP-01 | Créer expédition | Mouvements | Magasinier |
| PRT-01 | Déclarer perte | Mouvements | Magasinier |
| INV-01 | Lancer inventaire | Mouvements | Responsable |
| ALR-01 | Centre d'alertes | Alertes | Opérateur |
| REF-01 | Liste produits | Référentiels | Admin |
| REF-02 | Fiche produit | Référentiels | Admin |
| REF-03 | Fournisseurs | Référentiels | Admin |
| REF-04 | Zones & emplacements | Référentiels | Responsable |
| REF-05 | Règles de stockage | Référentiels | Responsable |
