# 02 — Référentiels (Données Maîtres)

Les référentiels sont les données stables configurées par l'administrateur.
Ils servent de base à tous les processus métier.

---

## 2.1 Produits

### Modèle de données

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `code_produit` | TEXT | Oui | Code unique (ex: `CAR-001`) |
| `libelle` | TEXT | Oui | Nom usuel (ex: "Carotte lavée") |
| `famille` | ENUM | Oui | LEGUME_RACINE, LEGUME_FEUILLE, LEGUME_FRUIT, FRUIT_TEMPER, FRUIT_TROPICAL, BULBE, TUBERCULE |
| `categorie_stockage` | FK | Oui | Référence vers une catégorie de stockage |
| `unite_mesure` | ENUM | Oui | KG, COLIS, PALETTE |
| `poids_moyen_colis_kg` | DECIMAL | Non | Pour conversion |
| `dlc_jours_standard` | INT | Non | Durée de vie estimée en entrepôt (jours) |
| `temperature_min_c` | DECIMAL | Oui | Température min de conservation |
| `temperature_max_c` | DECIMAL | Oui | Température max de conservation |
| `humidite_min_pct` | INT | Non | % humidité minimale |
| `humidite_max_pct` | INT | Non | % humidité maximale |
| `produit_ethylene` | BOOLEAN | Oui | Produit de l'éthylène (accélère mûrissement voisins) |
| `sensible_ethylene` | BOOLEAN | Oui | Sensible à l'éthylène des voisins |
| `absorbant_odeurs` | BOOLEAN | Oui | Absorbe les odeurs environnantes |
| `emetteur_odeurs` | BOOLEAN | Oui | Dégage des odeurs fortes |
| `actif` | BOOLEAN | Oui | Produit actif dans le catalogue |

### Exemples de produits

| Code | Libellé | Famille | T° min | T° max | Éthylène prod. | Sensible éthylène | Absorb. odeurs |
|------|---------|---------|--------|--------|---------------|------------------|----------------|
| CAR-001 | Carotte lavée | LEGUME_RACINE | 0°C | 4°C | Non | Oui | **Oui** |
| CAR-002 | Carotte sable | LEGUME_RACINE | 0°C | 4°C | Non | Oui | **Oui** |
| POM-001 | Pomme Golden | FRUIT_TEMPER | 1°C | 4°C | **Oui** | Non | Non |
| POI-001 | Poire Conférence | FRUIT_TEMPER | 0°C | 4°C | **Oui** | Non | Non |
| LAI-001 | Laitue iceberg | LEGUME_FEUILLE | 2°C | 6°C | Non | **Oui** | Non |
| OIG-001 | Oignon jaune | BULBE | 0°C | 5°C | Non | Non | **Oui** (fort) |
| AIL-001 | Ail | BULBE | 0°C | 5°C | Non | Non | **Oui** (fort) |
| BAN-001 | Banane | FRUIT_TROPICAL | 13°C | 15°C | **Oui** | Non | Non |
| TOM-001 | Tomate ronde | LEGUME_FRUIT | 10°C | 14°C | **Oui** | Non | Non |
| PDT-001 | Pomme de terre | TUBERCULE | 4°C | 8°C | Non | Non | Non |

---

## 2.2 Fournisseurs

| Champ | Type | Description |
|-------|------|-------------|
| `code_fournisseur` | TEXT | Code unique (ex: `FARM-042`) |
| `raison_sociale` | TEXT | Nom légal |
| `type` | ENUM | FERME, COOPERATIF, GROSSISTE, IMPORTATEUR |
| `adresse` | TEXT | Adresse complète |
| `contact_nom` | TEXT | Nom du contact principal |
| `contact_tel` | TEXT | Téléphone |
| `contact_email` | TEXT | Email |
| `certifications` | TEXT[] | Ex: ["BIO", "GlobalGAP", "HVE"] |
| `actif` | BOOLEAN | |

---

## 2.3 Entrepôts

| Champ | Type | Description |
|-------|------|-------------|
| `code_entrepot` | TEXT | Ex: `ENT-01` |
| `libelle` | TEXT | Ex: "Entrepôt Principal Rungis" |
| `adresse` | TEXT | |
| `surface_m2` | INT | Surface totale |
| `actif` | BOOLEAN | |

---

## 2.4 Zones de stockage

Une zone est une subdivision d'un entrepôt avec des conditions homogènes.

| Champ | Type | Description |
|-------|------|-------------|
| `code_zone` | TEXT | Ex: `ENT01-ZA` |
| `code_entrepot` | FK | Entrepôt parent |
| `libelle` | TEXT | Ex: "Zone A — Froid positif léger" |
| `categorie_thermique` | ENUM | Voir tableau ci-dessous |
| `temperature_consigne_c` | DECIMAL | Consigne température |
| `humidite_consigne_pct` | INT | Consigne humidité |
| `capacite_palettes` | INT | Nombre de palettes max |
| `actif` | BOOLEAN | |

### Catégories thermiques standard

| Code | Libellé | Température | Humidité | Produits typiques |
|------|---------|------------|---------|------------------|
| `FROID_LEGER` | Froid positif léger | 0 – 4°C | 90–95% | Carottes, betteraves, navets, choux, brocolis |
| `FROID_MODERE` | Froid positif modéré | 4 – 8°C | 85–90% | Laitues, épinards, herbes, pommes de terre |
| `FRAIS` | Tempéré frais | 8 – 12°C | 80–85% | Pommes, poires, cerises |
| `TEMPERE` | Tempéré | 12 – 16°C | 70–80% | Tomates, poivrons, concombres, aubergines |
| `TROPICAL` | Chaud tropical | 13 – 18°C | 85–90% | Bananes, mangues, avocats, ananas |
| `AMBIANT` | Ambiant sec | 15 – 20°C | 55–70% | Oignons, ail, échalotes |

---

## 2.5 Emplacements

Un emplacement est l'unité physique la plus fine : une palette, un rack, un casier.

| Champ | Type | Description |
|-------|------|-------------|
| `code_emplacement` | TEXT | Ex: `ENT01-ZA-R01-E03` (Entrepôt-Zone-Rangée-Étagère) |
| `code_zone` | FK | Zone parente |
| `libelle` | TEXT | Description libre |
| `type` | ENUM | PALETTE, RACK, CASIER, CHAMBRE |
| `capacite_kg` | DECIMAL | Charge max |
| `statut` | ENUM | LIBRE, OCCUPE, BLOQUE, MAINTENANCE |

---

## 2.6 Catégories de stockage (lien avec règles)

Les catégories de stockage sont les groupes utilisés dans les règles d'incompatibilité.

| Code | Libellé | Exemples produits |
|------|---------|------------------|
| `RACINE_FROID` | Légumes racines au froid | Carotte, betterave, navet, céleri-rave |
| `FEUILLE_FROID` | Légumes feuilles au froid | Laitue, épinard, chou, brocoli |
| `FRUIT_TEMPER` | Fruits tempérés (éthylène+) | Pomme, poire, kiwi |
| `FRUIT_TROPICAL` | Fruits tropicaux | Banane, mangue, ananas |
| `LEGUME_FRUIT` | Légumes-fruits | Tomate, poivron, concombre |
| `BULBE_ODEUR` | Bulbes odorants | Oignon, ail, échalote, poireau |
| `TUBERCULE` | Tubercules | Pomme de terre, patate douce |

---

## Écrans référentiels

### ECRAN REF-01 — Liste des produits

```
┌──────────────────────────────────────────────────────────────────────┐
│  Référentiels > Produits                            [+ Nouveau] [🔍] │
├──────────────────────────────────────────────────────────────────────┤
│  Filtres: [Famille ▼] [Catégorie stockage ▼] [Actif ▼]  [Recherche] │
├──────┬─────────────────────┬────────────────┬────────┬──────────────┤
│ Code │ Libellé             │ Catégo. stock. │ T° max │ Statut       │
├──────┼─────────────────────┼────────────────┼────────┼──────────────┤
│CAR-01│ Carotte lavée       │ RACINE_FROID   │ 4°C    │ ● Actif      │
│POM-01│ Pomme Golden        │ FRUIT_TEMPER   │ 4°C    │ ● Actif      │
│OIG-01│ Oignon jaune        │ BULBE_ODEUR    │ 5°C    │ ● Actif      │
│ ...  │ ...                 │ ...            │ ...    │ ...          │
└──────┴─────────────────────┴────────────────┴────────┴──────────────┘
```

**Actions disponibles :** Créer, Modifier, Désactiver (pas de suppression physique)

### ECRAN REF-02 — Fiche produit (création/modification)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Produit > Nouvelle fiche                        [Enregistrer] [X]   │
├────────────────────────────┬─────────────────────────────────────────┤
│ IDENTIFICATION             │ CONDITIONS DE STOCKAGE                  │
│ Code *    [CAR-001      ]  │ Temp. min (°C)*  [  0  ]               │
│ Libellé * [Carotte lavée]  │ Temp. max (°C)*  [  4  ]               │
│ Famille * [LEGUME_RACINE▼] │ Hum. min (%)     [  90 ]               │
│ Catég. *  [RACINE_FROID ▼] │ Hum. max (%)     [  95 ]               │
│ Unité *   [KG           ▼] │                                         │
│ DLC std   [21  ] jours     │ COMPATIBILITÉ                           │
│                            │ [x] Sensible à l'éthylène               │
│                            │ [ ] Producteur d'éthylène               │
│                            │ [x] Absorbant les odeurs                │
│                            │ [ ] Émetteur d'odeurs                   │
└────────────────────────────┴─────────────────────────────────────────┘
```
