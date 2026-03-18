# 03 — Règles de Stockage & Incompatibilités

## 3.1 Principe général

Chaque fois qu'un opérateur tente de stocker un lot dans une zone,
le système vérifie **3 niveaux de règles** :

```
NIVEAU 1 — Compatibilité thermique
    └> Le produit peut-il survivre dans cette zone (température, humidité) ?

NIVEAU 2 — Incompatibilité de catégorie dans la même zone
    └> Y a-t-il déjà dans cette zone un produit incompatible ?

NIVEAU 3 — Incompatibilité d'emplacement proche
    └> Sur la même palette / rangée, y a-t-il un conflit direct ?
```

- **Niveau 1** : BLOQUANT — impossible de valider
- **Niveau 2** : BLOQUANT par défaut, dérogation possible (avec justification + validation responsable)
- **Niveau 3** : AVERTISSEMENT — alerte affichée, l'opérateur peut confirmer

---

## 3.2 Matrice d'incompatibilités

### Lecture : ❌ = incompatible | ⚠️ = déconseillé | ✅ = compatible

|  | RACINE_FROID | FEUILLE_FROID | FRUIT_TEMPER | FRUIT_TROPICAL | LEGUME_FRUIT | BULBE_ODEUR | TUBERCULE |
|---|---|---|---|---|---|---|---|
| **RACINE_FROID** | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| **FEUILLE_FROID** | ✅ | ✅ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| **FRUIT_TEMPER** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **FRUIT_TROPICAL** | ❌ | ❌ | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| **LEGUME_FRUIT** | ⚠️ | ⚠️ | ❌ | ⚠️ | ✅ | ❌ | ⚠️ |
| **BULBE_ODEUR** | ❌ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ⚠️ |
| **TUBERCULE** | ✅ | ✅ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |

---

## 3.3 Règles détaillées

### RÈGLE-001 — Carottes ≠ Pommes / Poires
- **Catégories concernées :** RACINE_FROID ❌ FRUIT_TEMPER
- **Niveau :** BLOQUANT
- **Explication :** Les pommes et poires produisent de l'éthylène. L'éthylène rend les carottes amères et accélère leur dégradation. Même dans des zones à température identique (0–4°C), le stockage commun est interdit.
- **Distance minimale :** Zones séparées physiquement (pas simplement emplacements différents)

### RÈGLE-002 — Carottes ≠ Oignons / Ail / Poireaux
- **Catégories concernées :** RACINE_FROID ❌ BULBE_ODEUR
- **Niveau :** BLOQUANT
- **Explication :** Les carottes absorbent les odeurs. Les oignons et l'ail transmettent leur goût et odeur aux carottes même par voie atmosphérique (éthers soufrés).
- **Règle complémentaire :** Si stockage en chambre froide commune, une barrière physique étanche est nécessaire (dérogation niveau responsable).

### RÈGLE-003 — Fruits producteurs d'éthylène ≠ Légumes feuilles
- **Catégories concernées :** FRUIT_TEMPER ❌ FEUILLE_FROID
- **Niveau :** BLOQUANT
- **Explication :** L'éthylène des pommes/poires fait jaunir et ramollir rapidement les laitues, épinards, et brocolis.

### RÈGLE-004 — Bananes ≠ Produits froid positif
- **Catégories concernées :** FRUIT_TROPICAL ❌ RACINE_FROID, FEUILLE_FROID, FRUIT_TEMPER
- **Niveau :** BLOQUANT (thermique + éthylène)
- **Explication :** Les bananes ont besoin de 13–15°C minimum. En dessous, elles subissent des blessures par le froid (brunissement). De plus, elles produisent de l'éthylène en quantité importante.

### RÈGLE-005 — Pommes de terre ≠ Oignons
- **Catégories concernées :** TUBERCULE ⚠️ BULBE_ODEUR
- **Niveau :** DÉCONSEILLÉ
- **Explication :** L'éthylène et les vapeurs des oignons accélèrent la germination des pommes de terre. Stockage dans zones adjacentes accepté si ventilation correcte.

### RÈGLE-006 — Tomates ≠ Oignons
- **Catégories concernées :** LEGUME_FRUIT ❌ BULBE_ODEUR
- **Niveau :** BLOQUANT
- **Explication :** Les tomates absorbent les odeurs soufrées des oignons et perdent leur qualité gustative.

### RÈGLE-007 — Légumes fruits ≠ Pommes/Poires
- **Catégories concernées :** LEGUME_FRUIT ❌ FRUIT_TEMPER
- **Niveau :** BLOQUANT
- **Explication :** L'éthylène des pommes accélère le mûrissement des tomates, poivrons et concombres au-delà du souhaité.

---

## 3.4 Règles thermiques (NIVEAU 1)

Le système valide automatiquement que la zone choisie est dans la plage de température du produit.

| Condition | Résultat |
|-----------|---------|
| `temperature_zone < temperature_min_produit` | ❌ BLOQUANT — risque de blessure froid |
| `temperature_zone > temperature_max_produit` | ❌ BLOQUANT — dégradation accélérée |
| `humidite_zone < humidite_min_produit` | ⚠️ AVERTISSEMENT — risque de déshydratation |
| `humidite_zone > humidite_max_produit` | ⚠️ AVERTISSEMENT — risque de moisissures |

---

## 3.5 Modèle de données des règles

```sql
-- Table des règles d'incompatibilité
règle_stockage (
  id_règle         SERIAL PRIMARY KEY,
  categorie_A      VARCHAR  NOT NULL,  -- ex: 'RACINE_FROID'
  categorie_B      VARCHAR  NOT NULL,  -- ex: 'BULBE_ODEUR'
  niveau           ENUM('BLOQUANT', 'DECONSEILLE'),
  motif            TEXT,               -- Explication affichée à l'opérateur
  derogation_ok    BOOLEAN DEFAULT FALSE,  -- Dérogation possible ?
  actif            BOOLEAN DEFAULT TRUE
)
```

---

## 3.6 Algorithme de vérification (pseudo-code)

```
FUNCTION verifier_compatibilite(lot, emplacement_cible):

  zone_cible = emplacement_cible.zone
  categorie_lot = lot.produit.categorie_stockage

  // NIVEAU 1 : Vérification thermique
  IF zone_cible.temperature > lot.produit.temperature_max
     OR zone_cible.temperature < lot.produit.temperature_min:
    RETURN ERREUR_BLOQUANT("Température de zone incompatible")

  // NIVEAU 2 : Vérification catégories présentes dans la zone
  categories_en_zone = SELECT DISTINCT produit.categorie
                       FROM lots_actifs
                       WHERE zone = zone_cible

  FOR EACH categorie_existante IN categories_en_zone:
    règle = FIND règle_stockage
            WHERE (categorie_A = categorie_lot AND categorie_B = categorie_existante)
               OR (categorie_A = categorie_existante AND categorie_B = categorie_lot)

    IF règle EXISTS:
      IF règle.niveau = 'BLOQUANT' AND NOT règle.derogation_ok:
        RETURN ERREUR_BLOQUANT(règle.motif)
      IF règle.niveau = 'BLOQUANT' AND règle.derogation_ok:
        RETURN ERREUR_DEROGATION(règle.motif)  // nécessite validation responsable
      IF règle.niveau = 'DECONSEILLE':
        ADD AVERTISSEMENT(règle.motif)

  RETURN OK (avec éventuels avertissements)
```

---

## 3.7 Écran de configuration des règles

### ECRAN REF-05 — Matrice des règles de stockage

```
┌─────────────────────────────────────────────────────────────────────┐
│  Référentiels > Règles de stockage              [+ Nouvelle règle]  │
├─────────────────────────────────────────────────────────────────────┤
│  Affichage : [Matrice ●] [Liste ○]                                  │
├────────────────┬───────────────┬──────────────┬─────────┬──────────┤
│ Catégorie A    │ Catégorie B   │ Niveau       │ Déroga. │ Actions  │
├────────────────┼───────────────┼──────────────┼─────────┼──────────┤
│ RACINE_FROID   │ FRUIT_TEMPER  │ ❌ BLOQUANT  │ Non     │ ✏️ 🗑️   │
│ RACINE_FROID   │ BULBE_ODEUR   │ ❌ BLOQUANT  │ Oui*    │ ✏️ 🗑️   │
│ FEUILLE_FROID  │ FRUIT_TEMPER  │ ❌ BLOQUANT  │ Non     │ ✏️ 🗑️   │
│ TUBERCULE      │ BULBE_ODEUR   │ ⚠️ DÉCONSEI. │ —       │ ✏️ 🗑️   │
└────────────────┴───────────────┴──────────────┴─────────┴──────────┘
  * Dérogation possible avec validation responsable
```
