# 06 — Mise en situation : Réception d'une cargaison de carottes

> **Scénario :** La Ferme Morin livre ce matin 18 mars 2026 une cargaison
> de carottes lavées et carottes sable. L'opérateur Marc Leroy réceptionne
> la cargaison à l'entrepôt principal ENT-01.

---

## Contexte de l'entrepôt avant la réception

| Zone | T° | Produits présents |
|------|-----|------------------|
| Zone A — Froid léger | 3°C | Betteraves rouges (RACINE_FROID) |
| Zone B — Froid modéré | 6°C | Laitues iceberg (FEUILLE_FROID) |
| Zone C — Tempéré frais | 10°C | Pommes Golden (FRUIT_TEMPER) ← attention |
| Zone E — Ambiant sec | 17°C | Oignons jaunes (BULBE_ODEUR) ← attention |

---

## Déroulement pas à pas

---

### ▶ ÉTAPE 1 — Le camion arrive (09:35)

Marc Leroy ouvre l'application sur sa tablette. Il voit sur le tableau de bord
qu'une réception est attendue (annonce préalable créée par le responsable).

**Écran :** MOV-01 (Tableau de bord)

```
┌─────────────────────────────────────────────────────────────────┐
│  AUJOURD'HUI                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🚛 Réception attendue — Ferme Morin              09:00  │    │
│  │    Carottes — ~7 200 kg                                  │    │
│  │    [Démarrer la réception]                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

Marc clique sur **[Démarrer la réception]**.

---

### ▶ ÉTAPE 2 — Saisie de l'en-tête (09:37)

**Écran :** REC-02

Marc renseigne :
- Fournisseur : **Ferme Morin** (sélectionné depuis le référentiel, code FARM-042)
- Date/heure arrivée : **18/03/2026 — 09:35**
- Température du camion (sonde intégrée ou thermomètre portatif) : **3.2°C**
- N° BL fournisseur : **BL-MORIN-20260318**
- Immatriculation : **AB-123-CD**

```
  Température camion : [3.2] °C
  → Vérification automatique : produits attendus (carottes, T° max 4°C) ✅
  → Message : "Température conforme pour les produits attendus"
```

Le système génère automatiquement le numéro : **REC-260318-03**

Marc clique sur **[Suivant >]**

---

### ▶ ÉTAPE 3 — Contrôle qualité (09:40)

**Écran :** REC-03

Marc inspecte la cargaison avec le chauffeur. Il renseigne les contrôles :

| Contrôle | Résultat | Commentaire |
|---------|---------|-------------|
| Intégrité des emballages | ✅ | — |
| Absence de moisissures | ✅ | — |
| Température produit (sonde) | ✅ 3°C | — |
| Dates limites / étiquetage | ✅ | — |
| Conformité quantité BL | ⚠️ | 2 colis manquants sur le lot sable |
| Absence de nuisibles | ✅ | — |

Marc sélectionne : **CONFORME AVEC RÉSERVES**

Il saisit le commentaire : *"2 colis de carotte sable manquants — signalé au chauffeur. Avoir à demander."*

Marc clique sur **[Suivant >]**

---

### ▶ ÉTAPE 4 — Saisie des lots (09:43)

**Écran :** REC-04

Marc saisit les 2 lots :

**LOT 1 — Carotte lavée**
```
Produit       : Carotte lavée (CAR-001)
Quantité      : 4 800 kg
Nombre colis  : 200 (saisie manuelle — 24 kg/colis)
Date récolte  : 12/03/2026
DLC calculée  : 02/04/2026 (21 jours) ✅
N° lot four.  : LOT-MORIN-2603-A
Qualité       : Catégorie I
```

**LOT 2 — Carotte sable**
```
Produit       : Carotte sable (CAR-002)
Quantité      : 2 400 kg  (au lieu de 2 448 — 2 colis manquants déduits)
Nombre colis  : 98
Date récolte  : 10/03/2026
DLC calculée  : 31/03/2026 (21 jours) ✅
N° lot four.  : LOT-MORIN-2603-B
Qualité       : Catégorie I
```

Le système génère les numéros internes :
- LOT-260318-0007 (carotte lavée)
- LOT-260318-0008 (carotte sable)

Marc clique sur **[Suivant >]**

---

### ▶ ÉTAPE 5 — Affectation des emplacements (09:46)

**Écran :** REC-05 — C'est ici que les règles de stockage entrent en jeu.

```
╔═══════════════════════════════════════════════════════════════════════╗
║  AFFECTATION — LOT 1 : Carotte lavée (CAR-001) — 4 800 kg            ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Catégorie produit : RACINE_FROID                                     ║
║                                                                       ║
║  ZONES COMPATIBLES (température OK + pas d'incompatibilité) :        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │ ● Zone A — Froid léger (ENT01-ZA)                            │    ║
║  │   T° : 3.1°C ✅ | Humidité : 92% ✅                          │    ║
║  │   Produits présents : Betterave (RACINE_FROID) ✅ compatible  │    ║
║  │   Places libres : 9 palettes (~54 000 kg dispo)              │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                       ║
║  ZONES EXCLUES PAR LES RÈGLES DE STOCKAGE :                          ║
║  ✗ Zone C — Tempéré frais (ENT01-ZC)                                 ║
║    Motif : Pommes Golden présentes → RÈGLE-001                       ║
║    "Les pommes produisent de l'éthylène qui rend les carottes         ║
║     amères. Stockage interdit dans la même zone."                    ║
║                                                                       ║
║  ✗ Zone E — Ambiant sec (ENT01-ZE)                                   ║
║    Motif : Oignons présents → RÈGLE-002                              ║
║    "Les carottes absorbent les odeurs. Les oignons transmettent       ║
║     leur odeur aux carottes voisines."                               ║
║                                                                       ║
║  ✗ Zone B — Froid modéré (ENT01-ZB)                                  ║
║    Motif : Température 6°C > T° max carotte (4°C) → RÈGLE THERMIQUE  ║
║                                                                       ║
║  Emplacement sélectionné : [ENT01-ZA-R02-E01    ▼]                   ║
║                                                                       ║
║  ✅ Aucune incompatibilité — Stockage autorisé                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

Marc choisit l'emplacement **ENT01-ZA-R02-E01** (rangée 2, étagère 1) en Zone A.

```
╔═══════════════════════════════════════════════════════════════════════╗
║  AFFECTATION — LOT 2 : Carotte sable (CAR-002) — 2 400 kg            ║
╠═══════════════════════════════════════════════════════════════════════╣
║  → Mêmes règles appliquées — Zone A recommandée                       ║
║  Emplacement sélectionné : [ENT01-ZA-R02-E02    ▼]                   ║
║  ✅ Compatible                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

### ▶ ÉTAPE 6 — Impression des étiquettes (09:48)

Marc clique sur **[Imprimer étiquettes (2)]**

```
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │    │  ┌─────────────────────────┐    │
│  │  LOT-260318-0007        │    │    │  │  LOT-260318-0008        │    │
│  │  ████████████████████   │    │    │  │  ████████████████████   │    │
│  │  ████ QR CODE  ████     │    │    │  │  ████ QR CODE  ████     │    │
│  │  ████████████████████   │    │    │  │  ████████████████████   │    │
│  ├─────────────────────────┤    │    │  ├─────────────────────────┤    │
│  │ CAROTTE LAVÉE (CAR-001) │    │    │  │ CAROTTE SABLE (CAR-002) │    │
│  │ 4 800 kg — Cat. I       │    │    │  │ 2 400 kg — Cat. I       │    │
│  │ Ferme Morin             │    │    │  │ Ferme Morin             │    │
│  │ Réception : 18/03/2026  │    │    │  │ Réception : 18/03/2026  │    │
│  │ Récolte   : 12/03/2026  │    │    │  │ Récolte   : 10/03/2026  │    │
│  │ DLC       : 02/04/2026  │    │    │  │ DLC       : 31/03/2026  │    │
│  │ Zone A — ENT01-ZA-R02-01│    │    │  │ Zone A — ENT01-ZA-R02-02│    │
│  └─────────────────────────┘    │    │  └─────────────────────────┘    │
└─────────────────────────────────┘    └─────────────────────────────────┘
```

---

### ▶ ÉTAPE 7 — Rangement physique et confirmation (09:52)

Marc range physiquement les palettes en Zone A avec les étiquettes apposées.

Il revient sur l'écran et clique sur **[✅ Valider la réception]**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✅ Réception REC-260318-03 validée avec succès                     │
│                                                                      │
│  Lots créés :                                                        │
│  • LOT-260318-0007 — Carotte lavée — 4 800 kg — Zone A - R02-E01   │
│  • LOT-260318-0008 — Carotte sable — 2 400 kg — Zone A - R02-E02   │
│                                                                      │
│  Stock mis à jour :                                                  │
│  • Carotte lavée : 0 kg → 4 800 kg                                  │
│  • Carotte sable : 0 kg → 2 400 kg                                  │
│                                                                      │
│  Réserves enregistrées :                                             │
│  • 2 colis CAR-002 manquants — avoir à traiter                      │
│                                                                      │
│  [Voir les lots]  [Nouvelle réception]  [Retour accueil]            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Résumé des événements générés

| Heure | Action | Données créées |
|-------|--------|---------------|
| 09:37 | Création réception | REC-260318-03 (statut: EN_COURS) |
| 09:43 | Saisie lot 1 | LOT-260318-0007 (statut: EN_ATTENTE) |
| 09:43 | Saisie lot 2 | LOT-260318-0008 (statut: EN_ATTENTE) |
| 09:46 | Affectation emplacement lot 1 | Emplacement ENT01-ZA-R02-E01 réservé |
| 09:46 | Affectation emplacement lot 2 | Emplacement ENT01-ZA-R02-E02 réservé |
| 09:52 | Validation réception | Mouvements REC créés |
| 09:52 | Mise à jour stock | +4 800 kg CAR-001, +2 400 kg CAR-002 |
| 09:52 | Changement statut lots | EN_ATTENTE → STOCKÉ |
| 09:52 | Changement statut réception | EN_COURS → TERMINÉE |

---

## Ce qui se serait passé si Marc avait essayé de mettre les carottes en Zone C

```
┌─────────────────────────────────────────────────────────────────────┐
│  ❌ STOCKAGE IMPOSSIBLE                                              │
│                                                                      │
│  La Zone C contient des Pommes Golden (FRUIT_TEMPER).               │
│  Or, les carottes (RACINE_FROID) sont incompatibles avec            │
│  les fruits producteurs d'éthylène.                                  │
│                                                                      │
│  RÈGLE-001 : L'éthylène produit par les pommes rend les carottes    │
│  amères et accélère leur dégradation. Cette incompatibilité est     │
│  BLOQUANTE et ne peut pas faire l'objet d'une dérogation.           │
│                                                                      │
│  Zones disponibles pour ce produit :                                 │
│  → Zone A — Froid léger (recommandée)                               │
│  → Zone A2 — Froid léger bis                                        │
│                                                                      │
│  [Choisir une zone compatible]                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Ce qui se serait passé si Marc avait essayé de mettre les carottes en Zone E (Oignons)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ❌ STOCKAGE IMPOSSIBLE                                              │
│                                                                      │
│  La Zone E contient des Oignons jaunes (BULBE_ODEUR).               │
│  Or, les carottes absorbent les odeurs ambiantes.                   │
│                                                                      │
│  RÈGLE-002 : Les oignons émettent des composés soufrés volatils     │
│  qui sont absorbés par les carottes, altérant leur goût.            │
│  Cette incompatibilité est BLOQUANTE.                               │
│                                                                      │
│  Une dérogation avec chambre étanche hermétique peut être           │
│  demandée au responsable d'entrepôt.                                │
│  [Demander une dérogation au responsable]  [Choisir autre zone]     │
└─────────────────────────────────────────────────────────────────────┘
```
