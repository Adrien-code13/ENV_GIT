# 04 — Processus Métier & Mouvements

---

## 4.1 Processus de Réception (REC)

### Vue d'ensemble du flux

```
 FOURNISSEUR          OPÉRATEUR RÉCEPTION         SYSTÈME          RESPONSABLE
      │                       │                      │                   │
      │── Arrivée camion ────>│                      │                   │
      │                       │── Crée BL ──────────>│                   │
      │                       │<─ N° réception ──────│                   │
      │                       │                      │                   │
      │                       │── Contrôle QC ──────>│                   │
      │                       │   (quantité, état,   │                   │
      │                       │    température)       │                   │
      │                       │                      │                   │
      │               ┌───────┴───────┐              │                   │
      │               │ Conforme ?    │              │                   │
      │               └───┬───────┬───┘              │                   │
      │               Non │       │ Oui              │                   │
      │                   ▼       ▼                  │                   │
      │            [Refus/Réserve] [Saisie lots]────>│                   │
      │                   │       │                  │                   │
      │                   │       │── Suggestion ───>│                   │
      │                   │       │   emplacement    │                   │
      │                   │       │                  │                   │
      │                   │       │── Vérif. règles─>│                   │
      │                   │       │                  │                   │
      │               ┌───┘   ┌───┘                  │                   │
      │               │   Compatible ?               │                   │
      │               │   ┌──────┴──────┐            │                   │
      │               │   │ Incompatib. │            │──> Alerte ───────>│
      │               │   │ BLOQUANT    │            │                   │
      │               │   └─────────────┘            │                   │
      │               │                              │                   │
      │               │── Validation finale ────────>│                   │
      │               │<─ Étiquettes lot ────────────│                   │
      │               │                              │                   │
      │               │── Rangement physique         │                   │
      │               │── Confirmation emplacement ─>│                   │
      │               │<─ Stock mis à jour ──────────│                   │
```

### Étapes détaillées

#### ÉTAPE 1 — Annonce de réception (optionnelle)
Un bon de livraison prévisionnel peut être créé avant l'arrivée du camion.
- Saisie : fournisseur, date prévue, produits attendus, quantités
- Statut : `ANNONCÉ`

#### ÉTAPE 2 — Création du bon de réception
Déclenchée à l'arrivée physique du camion.
- Le système génère un **numéro de réception** unique : `REC-YYYYMMDD-XXXX`
- L'opérateur sélectionne ou crée le fournisseur
- Statut : `EN COURS`

#### ÉTAPE 3 — Contrôle qualité (QC)
Pour chaque produit/colis :

| Contrôle | Type | Valeur attendue |
|---------|------|----------------|
| Température à réception | Mesure | Dans la plage produit |
| État visuel | Observation | Bon / Défaut mineur / Non-conforme |
| Poids/Quantité | Comptage | Correspond au BL fournisseur |
| DLC / date récolte | Lecture étiquette | Dans les normes |
| Présence nuisibles | Observation | Néant |

**Résultats possibles du QC :**
- ✅ `CONFORME` → passage à l'étape 4
- ⚠️ `CONFORME AVEC RÉSERVES` → stockage autorisé, commentaire obligatoire
- ❌ `NON-CONFORME` → refus total ou partiel, création d'un mouvement `PRT`

#### ÉTAPE 4 — Saisie des lots
Chaque lot = 1 ligne de produit homogène (même produit, même qualité, même date).

Pour chaque lot :
- Produit (sélection référentiel)
- Quantité (kg ou nombre de colis)
- Date de récolte / Date de production
- DLC calculée ou saisie
- N° lot fournisseur (si présent)

Le système génère un **numéro de lot interne** : `LOT-YYYYMMDD-XXXX`

#### ÉTAPE 5 — Affectation d'emplacement
- Le système propose les emplacements **compatibles et disponibles** (filtrage auto par règles)
- L'opérateur choisit dans la liste suggérée
- En cas de sélection manuelle d'un emplacement non suggéré : vérification des règles à la volée
- En cas d'incompatibilité BLOQUANTE : message d'erreur, choix impossible
- En cas d'incompatibilité DÉCONSEILLÉE : confirmation requise

#### ÉTAPE 6 — Impression des étiquettes
- 1 étiquette par lot avec : N° lot, produit, quantité, date réception, DLC, emplacement, QR code
- Impression via imprimante thermique ou PDF

#### ÉTAPE 7 — Rangement et confirmation
- L'opérateur range physiquement le lot
- Confirme dans l'interface que le lot est bien en place
- Le stock est mis à jour : emplacement `OCCUPE`, quantité incrémentée
- Statut réception : `TERMINÉE`

---

## 4.2 Processus de Transfert (TRF)

Déplacement d'un lot d'un emplacement A vers un emplacement B.

```
ÉTAPE 1 : Sélectionner le lot à transférer (par scan QR ou recherche)
ÉTAPE 2 : Choisir l'emplacement de destination
ÉTAPE 3 : Vérification des règles (identique à la réception)
ÉTAPE 4 : Motif du transfert (RÉORGANISATION / PRÉPARATION EXPÉDITION / CONTRÔLE)
ÉTAPE 5 : Validation → stock mis à jour (ancien emplacement libéré, nouveau occupé)
```

---

## 4.3 Processus d'Expédition (EXP)

Sortie de marchandise vers un client ou un autre site.

```
ÉTAPE 1 : Créer un bon d'expédition (client, date, référence)
ÉTAPE 2 : Ajouter les lots à expédier (scan ou sélection)
ÉTAPE 3 : Vérification des quantités disponibles
ÉTAPE 4 : Validation → stock décrémenté
ÉTAPE 5 : Impression du bon de livraison
```

---

## 4.4 Processus de Perte / Casse (PRT)

Déclaration d'une marchandise non vendable.

```
ÉTAPE 1 : Sélectionner le lot (ou sous-partie du lot)
ÉTAPE 2 : Saisir la quantité perdue
ÉTAPE 3 : Motif (POURRITURE / CASSE / NON-CONFORMITE / PEREMPTION / AUTRE)
ÉTAPE 4 : Photo optionnelle (pour traçabilité)
ÉTAPE 5 : Validation → stock décrémenté, mouvement PRT créé
```

---

## 4.5 Processus d'Inventaire (INV)

Correction du stock après comptage physique.

```
ÉTAPE 1 : Lancer une session d'inventaire (zone ou entrepôt entier)
ÉTAPE 2 : Pour chaque emplacement : saisir la quantité comptée
ÉTAPE 3 : Le système affiche l'écart (théorique vs compté)
ÉTAPE 4 : Validation par responsable
ÉTAPE 5 : Ajustement automatique du stock
ÉTAPE 6 : Rapport d'inventaire généré (PDF)
```

---

## 4.6 Modèle de données des mouvements

```sql
mouvement (
  id_mouvement        SERIAL PRIMARY KEY,
  numero_mouvement    VARCHAR UNIQUE,      -- ex: REC-20260318-0042
  type_mouvement      ENUM('REC','TRF','EXP','PRT','INV'),
  date_mouvement      TIMESTAMP,
  id_lot              INT REFERENCES lot(id_lot),
  emplacement_source  INT REFERENCES emplacement(id_emplacement),  -- NULL si réception
  emplacement_dest    INT REFERENCES emplacement(id_emplacement),  -- NULL si expédition/perte
  quantite            DECIMAL,
  unite               VARCHAR,
  motif               TEXT,
  id_operateur        INT REFERENCES utilisateur(id_utilisateur),
  id_validation       INT REFERENCES utilisateur(id_utilisateur),  -- pour dérogations
  statut              ENUM('BROUILLON','VALIDÉ','ANNULÉ'),
  commentaire         TEXT
)

lot (
  id_lot              SERIAL PRIMARY KEY,
  numero_lot          VARCHAR UNIQUE,       -- ex: LOT-20260318-0007
  id_produit          INT REFERENCES produit(id_produit),
  id_reception        INT REFERENCES reception(id_reception),
  numero_lot_fournisseur VARCHAR,
  date_reception      DATE,
  date_recolte        DATE,
  dlc                 DATE,
  quantite_initiale   DECIMAL,
  quantite_actuelle   DECIMAL,
  unite               VARCHAR,
  id_emplacement_actuel INT REFERENCES emplacement(id_emplacement),
  statut              ENUM('EN_ATTENTE','STOCKÉ','EXPÉDIÉ','PERDU','PARTIELLEMENT_SORTI')
)
```
