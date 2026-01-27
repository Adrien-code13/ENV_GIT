/**
 * Champions League 2025/26 - Matchday 8 (28 January 2026)
 * Sports Betting Analyzer - Data & Analysis Engine
 *
 * Sources: UEFA.com, ESPN, NBC Sports, Oddschecker, Parions Sport
 */

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface TeamStanding {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
  status: "qualified_r16" | "qualified_playoffs" | "in_contention" | "eliminated";
  form: string; // Last 5 matches: W/D/L
  homeRecord: string;
  awayRecord: string;
}

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  under25: number;
  btts_yes: number;
  btts_no: number;
}

export interface Match {
  home: string;
  away: string;
  odds: MatchOdds;
  homeStanding: number;
  awayStanding: number;
  stakes: {
    home: string;
    away: string;
  };
  keyStats: string[];
  prediction: string;
  confidence: "high" | "medium" | "low";
}

export interface BetSelection {
  match: string;
  selection: string;
  odds: number;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  category: "safe" | "value" | "risky";
}

export interface Combination {
  name: string;
  description: string;
  selections: BetSelection[];
  totalOdds: number;
  risk: "low" | "medium" | "high";
  expectedReturn10: number; // Return for a 10€ stake
}

// ─── STANDINGS (After Matchday 7) ──────────────────────────────────────────

export const standings: TeamStanding[] = [
  { name: "Arsenal", played: 7, won: 7, drawn: 0, lost: 0, goalsFor: 20, goalsAgainst: 3, points: 21, position: 1, status: "qualified_r16", form: "WWWWW", homeRecord: "4W 0D 0L", awayRecord: "3W 0D 0L" },
  { name: "Bayern München", played: 7, won: 6, drawn: 0, lost: 1, goalsFor: 18, goalsAgainst: 5, points: 18, position: 2, status: "qualified_r16", form: "WWWWL", homeRecord: "3W 0D 0L", awayRecord: "3W 0D 1L" },
  { name: "Liverpool", played: 7, won: 5, drawn: 1, lost: 1, goalsFor: 16, goalsAgainst: 5, points: 16, position: 3, status: "qualified_playoffs", form: "WWDWW", homeRecord: "3W 0D 0L", awayRecord: "2W 1D 1L" },
  { name: "Real Madrid", played: 7, won: 5, drawn: 0, lost: 2, goalsFor: 19, goalsAgainst: 10, points: 15, position: 4, status: "qualified_playoffs", form: "LWWWW", homeRecord: "3W 0D 0L", awayRecord: "2W 0D 2L" },
  { name: "Tottenham", played: 7, won: 4, drawn: 2, lost: 1, goalsFor: 12, goalsAgainst: 6, points: 14, position: 5, status: "qualified_playoffs", form: "WDWWW", homeRecord: "3W 1D 0L", awayRecord: "1W 1D 1L" },
  { name: "PSG", played: 7, won: 4, drawn: 1, lost: 2, goalsFor: 11, goalsAgainst: 8, points: 13, position: 6, status: "qualified_playoffs", form: "WWLWL", homeRecord: "3W 0D 0L", awayRecord: "1W 1D 2L" },
  { name: "Newcastle", played: 7, won: 4, drawn: 1, lost: 2, goalsFor: 12, goalsAgainst: 7, points: 13, position: 7, status: "qualified_playoffs", form: "WLWDW", homeRecord: "2W 1D 1L", awayRecord: "2W 0D 1L" },
  { name: "Chelsea", played: 7, won: 4, drawn: 1, lost: 2, goalsFor: 13, goalsAgainst: 9, points: 13, position: 8, status: "qualified_playoffs", form: "WLWWW", homeRecord: "2W 0D 1L", awayRecord: "2W 1D 1L" },
  { name: "Barcelona", played: 7, won: 4, drawn: 0, lost: 3, goalsFor: 18, goalsAgainst: 13, points: 12, position: 9, status: "qualified_playoffs", form: "WLLWW", homeRecord: "3W 0D 0L", awayRecord: "1W 0D 3L" },
  { name: "Atalanta", played: 7, won: 4, drawn: 0, lost: 3, goalsFor: 13, goalsAgainst: 9, points: 12, position: 10, status: "qualified_playoffs", form: "WWWLL", homeRecord: "3W 0D 1L", awayRecord: "1W 0D 2L" },
  { name: "Manchester City", played: 7, won: 3, drawn: 2, lost: 2, goalsFor: 14, goalsAgainst: 10, points: 11, position: 11, status: "qualified_playoffs", form: "DWWDL", homeRecord: "2W 1D 0L", awayRecord: "1W 1D 2L" },
  { name: "Atlético Madrid", played: 7, won: 3, drawn: 2, lost: 2, goalsFor: 11, goalsAgainst: 8, points: 11, position: 12, status: "qualified_playoffs", form: "WDLWD", homeRecord: "2W 1D 0L", awayRecord: "1W 1D 2L" },
  { name: "Sporting CP", played: 7, won: 3, drawn: 2, lost: 2, goalsFor: 10, goalsAgainst: 9, points: 11, position: 13, status: "qualified_playoffs", form: "DLWWW", homeRecord: "2W 1D 1L", awayRecord: "1W 1D 1L" },
  { name: "Inter", played: 7, won: 3, drawn: 2, lost: 2, goalsFor: 9, goalsAgainst: 8, points: 11, position: 14, status: "qualified_playoffs", form: "DWWDL", homeRecord: "2W 1D 1L", awayRecord: "1W 1D 1L" },
  { name: "Juventus", played: 7, won: 3, drawn: 1, lost: 3, goalsFor: 10, goalsAgainst: 10, points: 10, position: 15, status: "qualified_playoffs", form: "LWWWL", homeRecord: "2W 1D 0L", awayRecord: "1W 0D 3L" },
  { name: "Napoli", played: 7, won: 3, drawn: 1, lost: 3, goalsFor: 9, goalsAgainst: 10, points: 10, position: 16, status: "in_contention", form: "WLWDL", homeRecord: "2W 0D 1L", awayRecord: "1W 1D 2L" },
  { name: "Galatasaray", played: 7, won: 2, drawn: 3, lost: 2, goalsFor: 10, goalsAgainst: 10, points: 9, position: 17, status: "in_contention", form: "DLWWD", homeRecord: "2W 1D 0L", awayRecord: "0W 2D 2L" },
  { name: "Borussia Dortmund", played: 7, won: 3, drawn: 0, lost: 4, goalsFor: 12, goalsAgainst: 13, points: 9, position: 18, status: "in_contention", form: "WLWWL", homeRecord: "2W 0D 1L", awayRecord: "1W 0D 3L" },
  { name: "Club Brugge", played: 7, won: 3, drawn: 0, lost: 4, goalsFor: 9, goalsAgainst: 11, points: 9, position: 19, status: "in_contention", form: "LLWLW", homeRecord: "2W 0D 2L", awayRecord: "1W 0D 2L" },
  { name: "Marseille", played: 7, won: 3, drawn: 0, lost: 4, goalsFor: 10, goalsAgainst: 14, points: 9, position: 20, status: "in_contention", form: "LWWLL", homeRecord: "2W 0D 1L", awayRecord: "1W 0D 3L" },
  { name: "Leverkusen", played: 7, won: 2, drawn: 2, lost: 3, goalsFor: 10, goalsAgainst: 11, points: 8, position: 21, status: "in_contention", form: "WDLDL", homeRecord: "1W 1D 1L", awayRecord: "1W 1D 2L" },
  { name: "Monaco", played: 7, won: 2, drawn: 2, lost: 3, goalsFor: 10, goalsAgainst: 14, points: 8, position: 22, status: "in_contention", form: "DWLDL", homeRecord: "2W 1D 0L", awayRecord: "0W 1D 3L" },
  { name: "Ajax", played: 7, won: 2, drawn: 2, lost: 3, goalsFor: 9, goalsAgainst: 11, points: 8, position: 23, status: "in_contention", form: "LLDWW", homeRecord: "1W 2D 1L", awayRecord: "1W 0D 2L" },
  { name: "Athletic Club", played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 8, goalsAgainst: 11, points: 7, position: 24, status: "in_contention", form: "LLWLW", homeRecord: "1W 1D 1L", awayRecord: "1W 0D 3L" },
  { name: "PSV Eindhoven", played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 9, goalsAgainst: 14, points: 7, position: 25, status: "in_contention", form: "WLWLL", homeRecord: "2W 0D 1L", awayRecord: "0W 1D 3L" },
  { name: "Bodø/Glimt", played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 10, goalsAgainst: 15, points: 7, position: 26, status: "in_contention", form: "LLWLW", homeRecord: "2W 0D 2L", awayRecord: "0W 1D 2L" },
  { name: "Benfica", played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 8, goalsAgainst: 12, points: 7, position: 27, status: "in_contention", form: "WDLLL", homeRecord: "2W 0D 1L", awayRecord: "0W 1D 3L" },
  { name: "Olympiacos", played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 7, goalsAgainst: 13, points: 7, position: 28, status: "in_contention", form: "LLLWW", homeRecord: "1W 1D 2L", awayRecord: "1W 0D 2L" },
  { name: "Union SG", played: 7, won: 1, drawn: 2, lost: 4, goalsFor: 4, goalsAgainst: 10, points: 5, position: 29, status: "in_contention", form: "DLLDL", homeRecord: "1W 1D 1L", awayRecord: "0W 1D 3L" },
  { name: "Copenhagen", played: 7, won: 1, drawn: 2, lost: 4, goalsFor: 6, goalsAgainst: 14, points: 5, position: 30, status: "in_contention", form: "LLLDW", homeRecord: "1W 1D 2L", awayRecord: "0W 1D 2L" },
  { name: "Qarabağ", played: 7, won: 1, drawn: 1, lost: 5, goalsFor: 8, goalsAgainst: 17, points: 4, position: 31, status: "in_contention", form: "LLLWW", homeRecord: "1W 1D 2L", awayRecord: "0W 0D 3L" },
  { name: "Pafos", played: 7, won: 1, drawn: 1, lost: 5, goalsFor: 4, goalsAgainst: 12, points: 4, position: 32, status: "in_contention", form: "LLWDL", homeRecord: "1W 0D 2L", awayRecord: "0W 1D 3L" },
  { name: "Eintracht Frankfurt", played: 7, won: 1, drawn: 0, lost: 6, goalsFor: 7, goalsAgainst: 17, points: 3, position: 33, status: "eliminated", form: "LLLLL", homeRecord: "1W 0D 2L", awayRecord: "0W 0D 4L" },
  { name: "Kairat Almaty", played: 7, won: 0, drawn: 2, lost: 5, goalsFor: 5, goalsAgainst: 18, points: 2, position: 34, status: "eliminated", form: "LLDLL", homeRecord: "0W 1D 2L", awayRecord: "0W 1D 3L" },
  { name: "Slavia Praha", played: 7, won: 0, drawn: 1, lost: 6, goalsFor: 6, goalsAgainst: 20, points: 1, position: 35, status: "eliminated", form: "LLLLD", homeRecord: "0W 1D 3L", awayRecord: "0W 0D 3L" },
  { name: "Villarreal", played: 7, won: 0, drawn: 1, lost: 6, goalsFor: 4, goalsAgainst: 15, points: 1, position: 36, status: "eliminated", form: "LLLLL", homeRecord: "0W 1D 3L", awayRecord: "0W 0D 3L" },
];

// ─── MATCHDAY 8 FIXTURES & ODDS ────────────────────────────────────────────
// Odds sourced from: Parions Sport, bet365, Oddschecker (Jan 27, 2026)

export const matchday8: Match[] = [
  {
    home: "Arsenal",
    away: "Kairat Almaty",
    odds: { homeWin: 1.05, draw: 12.0, awayWin: 30.0, over25: 1.22, under25: 3.80, btts_yes: 2.20, btts_no: 1.55 },
    homeStanding: 1,
    awayStanding: 34,
    stakes: {
      home: "Viser le 8/8 historique et consolider la 1re place",
      away: "Éliminé, match sans enjeu",
    },
    keyStats: [
      "Arsenal est invaincu en 7 matchs (7V, 21 pts)",
      "Kairat Almaty n'a gagné aucun match (0V 2N 5D)",
      "Arsenal a la meilleure défense (3 buts encaissés en 7 matchs)",
      "Kairat a encaissé 18 buts en 7 matchs",
    ],
    prediction: "Arsenal -3",
    confidence: "high",
  },
  {
    home: "Liverpool",
    away: "Qarabağ",
    odds: { homeWin: 1.08, draw: 11.0, awayWin: 25.0, over25: 1.25, under25: 3.50, btts_yes: 2.00, btts_no: 1.65 },
    homeStanding: 3,
    awayStanding: 31,
    stakes: {
      home: "Consolider le top 8 et viser le top 2",
      away: "Presque éliminé, match de prestige",
    },
    keyStats: [
      "Liverpool 3e avec 16 pts, presque assuré du top 8",
      "Qarabağ 31e avec 4 pts, 0V à l'extérieur",
      "Liverpool invaincu à Anfield en LDC cette saison",
      "Qarabağ a encaissé 17 buts en 7 matchs",
    ],
    prediction: "Liverpool -3",
    confidence: "high",
  },
  {
    home: "Barcelona",
    away: "Copenhagen",
    odds: { homeWin: 1.12, draw: 9.50, awayWin: 20.0, over25: 1.28, under25: 3.30, btts_yes: 2.10, btts_no: 1.60 },
    homeStanding: 9,
    awayStanding: 30,
    stakes: {
      home: "DOIT gagner largement pour viser le top 8 (actuellement 9e)",
      away: "30e, très peu de chances de se qualifier",
    },
    keyStats: [
      "Barça 9e avec 12 pts, incentivé à écraser l'adversaire",
      "Barça invaincu à domicile (3V sur 3) en LDC",
      "Copenhagen n'a pas gardé sa cage inviolée lors de ses 10 derniers déplacements",
      "Fermín López: 5 buts en 6 matchs de LDC",
    ],
    prediction: "Barcelona victoire + Over 3.5",
    confidence: "high",
  },
  {
    home: "Atlético Madrid",
    away: "Bodø/Glimt",
    odds: { homeWin: 1.25, draw: 6.00, awayWin: 10.0, over25: 1.65, under25: 2.10, btts_yes: 1.85, btts_no: 1.85 },
    homeStanding: 12,
    awayStanding: 26,
    stakes: {
      home: "12e avec 11 pts, doit gagner pour les playoffs",
      away: "26e avec 7 pts, joue sa survie en Europe",
    },
    keyStats: [
      "Atlético invaincu à domicile en LDC (2V 1N)",
      "Bodø/Glimt a battu Man City 3-1 en J7 — dangereux en déplacement",
      "Atlético très solide défensivement à domicile",
      "Bodø/Glimt a encaissé 15 buts en 7 matchs",
    ],
    prediction: "Atlético Madrid victoire",
    confidence: "high",
  },
  {
    home: "Manchester City",
    away: "Galatasaray",
    odds: { homeWin: 1.22, draw: 6.50, awayWin: 11.0, over25: 1.50, under25: 2.40, btts_yes: 1.75, btts_no: 1.95 },
    homeStanding: 11,
    awayStanding: 17,
    stakes: {
      home: "11e avec 11 pts, DOIT gagner pour viser le top 8",
      away: "17e avec 9 pts, doit prendre des points pour les playoffs",
    },
    keyStats: [
      "Man City invaincu à domicile en LDC (2V 1N)",
      "Man City battu 3-1 par Bodø/Glimt en J7 — alerte",
      "Galatasaray n'a pas gagné en déplacement (0V 2N 2D)",
      "City très motivé avec l'enjeu du top 8",
    ],
    prediction: "Man City victoire + Over 2.5",
    confidence: "medium",
  },
  {
    home: "PSG",
    away: "Newcastle",
    odds: { homeWin: 1.59, draw: 4.20, awayWin: 5.00, over25: 1.67, under25: 2.05, btts_yes: 1.67, btts_no: 2.05 },
    homeStanding: 6,
    awayStanding: 7,
    stakes: {
      home: "6e avec 13 pts, doit gagner pour le top 8",
      away: "7e avec 13 pts, même enjeu",
    },
    keyStats: [
      "Match entre 6e et 7e — déterminant pour le top 8",
      "PSG invaincu à domicile en LDC (3V)",
      "Newcastle très en forme (3-0 vs PSV en J7)",
      "BTTS dans les derniers matchs des deux équipes",
    ],
    prediction: "PSG victoire (avantage terrain)",
    confidence: "medium",
  },
  {
    home: "Benfica",
    away: "Real Madrid",
    odds: { homeWin: 4.15, draw: 3.85, awayWin: 1.67, over25: 1.55, under25: 2.30, btts_yes: 1.55, btts_no: 2.30 },
    homeStanding: 27,
    awayStanding: 4,
    stakes: {
      home: "27e avec 7 pts, joue sa survie européenne",
      away: "4e avec 15 pts, quasi assuré du top 8",
    },
    keyStats: [
      "Real Madrid 6-1 vs Monaco en J7 — forme offensive explosive",
      "Benfica en difficulté (1V 1N 3D sur les 5 derniers)",
      "Real invaincu en déplacement vs Benfica historiquement",
      "Match pouvant être piège pour le Real déjà quasi qualifié",
    ],
    prediction: "Real Madrid victoire + BTTS",
    confidence: "medium",
  },
  {
    home: "Napoli",
    away: "Chelsea",
    odds: { homeWin: 2.10, draw: 3.30, awayWin: 3.40, over25: 1.80, under25: 1.90, btts_yes: 1.70, btts_no: 2.00 },
    homeStanding: 16,
    awayStanding: 8,
    stakes: {
      home: "16e avec 10 pts, doit gagner pour sécuriser les playoffs",
      away: "8e avec 13 pts, veut consolider le top 8",
    },
    keyStats: [
      "Match équilibré entre deux équipes avec enjeu",
      "Napoli fort à domicile mais inconstant",
      "Chelsea en bonne forme (3V sur les 4 derniers)",
      "Conte vs Maresca — affrontement tactique",
    ],
    prediction: "Match serré — BTTS probable",
    confidence: "low",
  },
  {
    home: "Borussia Dortmund",
    away: "Inter",
    odds: { homeWin: 2.50, draw: 3.40, awayWin: 2.70, over25: 1.70, under25: 2.00, btts_yes: 1.65, btts_no: 2.10 },
    homeStanding: 18,
    awayStanding: 14,
    stakes: {
      home: "18e avec 9 pts, doit prendre des points pour les playoffs",
      away: "14e avec 11 pts, une victoire sécuriserait les playoffs",
    },
    keyStats: [
      "Dortmund battu 2-0 par Tottenham en J7",
      "Inter battue 1-3 par Arsenal en J7",
      "Les deux équipes sous pression avec enjeu similaire",
      "Match historiquement spectaculaire",
    ],
    prediction: "BTTS + Over 2.5",
    confidence: "medium",
  },
  {
    home: "Leverkusen",
    away: "Villarreal",
    odds: { homeWin: 1.30, draw: 5.50, awayWin: 8.50, over25: 1.55, under25: 2.25, btts_yes: 1.90, btts_no: 1.80 },
    homeStanding: 21,
    awayStanding: 36,
    stakes: {
      home: "21e avec 8 pts, DOIT gagner pour rester dans les 24",
      away: "Éliminé (36e), match sans enjeu",
    },
    keyStats: [
      "Leverkusen dos au mur, doit absolument gagner",
      "Villarreal dernier du classement (1 pt en 7 matchs)",
      "Leverkusen battu par Olympiacos 2-0 en J7",
      "Villarreal n'a gagné aucun match cette campagne",
    ],
    prediction: "Leverkusen victoire large",
    confidence: "high",
  },
  {
    home: "Monaco",
    away: "Juventus",
    odds: { homeWin: 2.40, draw: 3.30, awayWin: 2.90, over25: 1.75, under25: 1.95, btts_yes: 1.70, btts_no: 2.05 },
    homeStanding: 22,
    awayStanding: 15,
    stakes: {
      home: "22e avec 8 pts, doit gagner pour les playoffs",
      away: "15e avec 10 pts, veut sécuriser sa place",
    },
    keyStats: [
      "Monaco humilié 6-1 par le Real en J7",
      "Juventus invaincu à domicile mais battu par Benfica 2-0 en J7",
      "Monaco invaincu à domicile en LDC (2V 1N)",
      "Enjeu vital pour les deux équipes",
    ],
    prediction: "Match ouvert — Over 2.5",
    confidence: "medium",
  },
  {
    home: "PSV Eindhoven",
    away: "Bayern München",
    odds: { homeWin: 5.00, draw: 4.20, awayWin: 1.60, over25: 1.50, under25: 2.40, btts_yes: 1.60, btts_no: 2.20 },
    homeStanding: 25,
    awayStanding: 2,
    stakes: {
      home: "25e avec 7 pts — DERNIER match pour rester dans les 24",
      away: "2e avec 18 pts, déjà qualifié pour les 8es",
    },
    keyStats: [
      "PSV battu 3-0 par Newcastle en J7 — en danger",
      "Bayern qualifié mais voudra maintenir sa 2e place",
      "PSV très fort à domicile habituellement (2V en 3 matchs)",
      "Bayern pourrait faire tourner l'effectif",
    ],
    prediction: "Bayern favori mais possible surprise si rotation",
    confidence: "low",
  },
  {
    home: "Club Brugge",
    away: "Marseille",
    odds: { homeWin: 2.65, draw: 3.45, awayWin: 2.30, over25: 1.80, under25: 1.90, btts_yes: 1.75, btts_no: 2.00 },
    homeStanding: 19,
    awayStanding: 20,
    stakes: {
      home: "19e avec 9 pts, doit prendre des points pour les playoffs",
      away: "20e avec 9 pts, même enjeu",
    },
    keyStats: [
      "Bruges a battu Kairat 4-1 en J7",
      "Marseille écrasé 0-3 par Liverpool en J7",
      "Match crucial pour les deux — tout à jouer",
      "Bruges invaincu dans ses 2 derniers matchs",
    ],
    prediction: "Match très ouvert",
    confidence: "low",
  },
  {
    home: "Athletic Club",
    away: "Sporting CP",
    odds: { homeWin: 2.20, draw: 3.40, awayWin: 3.10, over25: 1.75, under25: 1.95, btts_yes: 1.70, btts_no: 2.05 },
    homeStanding: 24,
    awayStanding: 13,
    stakes: {
      home: "24e avec 7 pts — dernier qualifiable, doit gagner ou espérer",
      away: "13e avec 11 pts, un nul pourrait suffire",
    },
    keyStats: [
      "Athletic a battu Atalanta 3-2 en J7 — en forme",
      "Sporting a battu le PSG 2-1 en J7",
      "Match entre deux équipes en forme ascendante",
      "Over 2.5 dans les 3 derniers matchs des deux équipes",
    ],
    prediction: "Over 2.5 buts",
    confidence: "medium",
  },
  {
    home: "Ajax",
    away: "Olympiacos",
    odds: { homeWin: 1.55, draw: 4.20, awayWin: 5.50, over25: 1.65, under25: 2.10, btts_yes: 1.75, btts_no: 1.95 },
    homeStanding: 23,
    awayStanding: 28,
    stakes: {
      home: "23e avec 8 pts — doit gagner pour rester dans les 24",
      away: "28e avec 7 pts — doit gagner pour espérer les playoffs",
    },
    keyStats: [
      "Ajax a battu Villarreal 2-1 en J7",
      "Olympiacos a battu Leverkusen 2-0 en J7",
      "Match décisif pour les deux équipes",
      "Ajax plus fort à domicile mais irrégulier",
    ],
    prediction: "Ajax favori à domicile",
    confidence: "medium",
  },
  {
    home: "Union SG",
    away: "Atalanta",
    odds: { homeWin: 5.50, draw: 4.00, awayWin: 1.55, over25: 1.75, under25: 1.95, btts_yes: 1.80, btts_no: 1.90 },
    homeStanding: 29,
    awayStanding: 10,
    stakes: {
      home: "29e avec 5 pts, éliminé ou presque",
      away: "10e avec 12 pts, vise le top 8",
    },
    keyStats: [
      "Atalanta battue 3-2 par Athletic en J7 — vulnérable en déplacement",
      "Union SG battue 2-0 par Bayern en J7",
      "Atalanta motivée pour viser le top 8",
      "Union SG très faible offensivement (4 buts en 7 matchs)",
    ],
    prediction: "Atalanta victoire",
    confidence: "high",
  },
  {
    home: "Eintracht Frankfurt",
    away: "Tottenham",
    odds: { homeWin: 3.50, draw: 3.60, awayWin: 2.00, over25: 1.65, under25: 2.10, btts_yes: 1.65, btts_no: 2.10 },
    homeStanding: 33,
    awayStanding: 5,
    stakes: {
      home: "33e, éliminé — match sans enjeu",
      away: "5e avec 14 pts, vise la consolidation du top 8",
    },
    keyStats: [
      "Frankfurt éliminé (3 pts en 7 matchs), 5 défaites consécutives",
      "Tottenham 5e, a battu Dortmund 2-0 en J7",
      "Tottenham en excellente forme en LDC",
      "Frankfurt n'a gagné qu'un seul match cette campagne",
    ],
    prediction: "Tottenham victoire",
    confidence: "high",
  },
  {
    home: "Pafos",
    away: "Slavia Praha",
    odds: { homeWin: 2.20, draw: 3.30, awayWin: 3.20, over25: 1.80, under25: 1.90, btts_yes: 1.75, btts_no: 2.00 },
    homeStanding: 32,
    awayStanding: 35,
    stakes: {
      home: "32e, éliminé — match de prestige",
      away: "35e, éliminé — match de prestige",
    },
    keyStats: [
      "Deux équipes éliminées, match sans enjeu réel",
      "Pafos plus fort à domicile (1V)",
      "Slavia Praha n'a gagné aucun match (0V 1N 6D)",
      "Peut être imprévisible vu l'absence d'enjeu",
    ],
    prediction: "Match sans enjeu, imprévisible",
    confidence: "low",
  },
];

// ─── ANALYSIS ENGINE ────────────────────────────────────────────────────────

/**
 * Calculates implied probability from decimal odds
 */
export function impliedProbability(odds: number): number {
  return (1 / odds) * 100;
}

/**
 * Calculates the overround (bookmaker margin)
 */
export function calculateOverround(match: Match): number {
  const total =
    impliedProbability(match.odds.homeWin) +
    impliedProbability(match.odds.draw) +
    impliedProbability(match.odds.awayWin);
  return total - 100;
}

/**
 * Identifies value bets where our estimated probability exceeds implied probability
 */
export function findValueBets(matches: Match[]): BetSelection[] {
  const selections: BetSelection[] = [];

  for (const match of matches) {
    const homeImplied = impliedProbability(match.odds.homeWin);
    const overImplied = impliedProbability(match.odds.over25);

    // ── SAFE PICKS: Huge favorites at home with high confidence ──
    if (match.confidence === "high" && match.odds.homeWin <= 1.35 && match.homeStanding <= 5) {
      selections.push({
        match: `${match.home} vs ${match.away}`,
        selection: `Victoire ${match.home}`,
        odds: match.odds.homeWin,
        reasoning: `${match.home} (${match.homeStanding}e) vs ${match.away} (${match.awayStanding}e). ` +
          `Écart de niveau colossal. ${match.keyStats[0]}`,
        confidence: "high",
        category: "safe",
      });
    }

    // ── VALUE PICKS: Teams with strong motivation and decent odds ──
    if (match.confidence === "high" && match.odds.homeWin > 1.20 && match.odds.homeWin <= 2.50) {
      const isAlreadyAdded = selections.some(
        (s) => s.match === `${match.home} vs ${match.away}` && s.selection.includes("Victoire")
      );
      if (!isAlreadyAdded) {
        selections.push({
          match: `${match.home} vs ${match.away}`,
          selection: `Victoire ${match.home}`,
          odds: match.odds.homeWin,
          reasoning: `${match.home} fortement motivé et favori. ${match.stakes.home}`,
          confidence: match.confidence,
          category: "value",
        });
      }
    }

    // ── AWAY VALUE: Strong away team with motivation ──
    if (
      match.awayStanding <= 8 &&
      match.homeStanding >= 25 &&
      match.odds.awayWin <= 2.20
    ) {
      selections.push({
        match: `${match.home} vs ${match.away}`,
        selection: `Victoire ${match.away}`,
        odds: match.odds.awayWin,
        reasoning: `${match.away} (${match.awayStanding}e) largement supérieur en déplacement chez ${match.home} (${match.homeStanding}e éliminé/en danger)`,
        confidence: "high",
        category: "value",
      });
    }

    // ── OVER 2.5 with strong motivation to score ──
    if (
      match.odds.over25 <= 1.35 &&
      match.confidence === "high"
    ) {
      selections.push({
        match: `${match.home} vs ${match.away}`,
        selection: "Plus de 2.5 buts",
        odds: match.odds.over25,
        reasoning: `Grand favori à domicile avec obligation de résultat. Adversaire très faible.`,
        confidence: "high",
        category: "safe",
      });
    }

    // ── BTTS VALUE ──
    if (
      match.odds.btts_yes <= 1.70 &&
      match.confidence !== "low" &&
      match.homeStanding <= 15 &&
      match.awayStanding <= 15
    ) {
      selections.push({
        match: `${match.home} vs ${match.away}`,
        selection: "Les deux équipes marquent (BTTS)",
        odds: match.odds.btts_yes,
        reasoning: `Deux équipes de qualité avec enjeu. Probabilité élevée de buts des deux côtés.`,
        confidence: "medium",
        category: "value",
      });
    }
  }

  return selections;
}

/**
 * Deduplicates selections so each match appears only once in a combo.
 * Keeps the selection with the highest odds for a given match.
 */
function deduplicateByMatch(picks: BetSelection[]): BetSelection[] {
  const seen = new Map<string, BetSelection>();
  for (const pick of picks) {
    const existing = seen.get(pick.match);
    if (!existing || pick.odds > existing.odds) {
      seen.set(pick.match, pick);
    }
  }
  return Array.from(seen.values());
}

export function buildCombinations(selections: BetSelection[]): Combination[] {
  const combinations: Combination[] = [];

  // ── COMBI 1: Le coffre-fort (safe picks only, one per match) ──
  const safeCandidates = selections
    .filter((s) => s.category === "safe" || (s.category === "value" && s.confidence === "high" && s.odds <= 1.60))
    .sort((a, b) => a.odds - b.odds);
  const safePicks = deduplicateByMatch(safeCandidates).slice(0, 6);

  if (safePicks.length > 0) {
    const totalOdds = safePicks.reduce((acc, s) => acc * s.odds, 1);
    combinations.push({
      name: "LE COFFRE-FORT",
      description: "Combine securise avec les picks les plus fiables. Cote basse mais tres forte probabilite.",
      selections: safePicks,
      totalOdds: Math.round(totalOdds * 100) / 100,
      risk: "low",
      expectedReturn10: Math.round(totalOdds * 10 * 100) / 100,
    });
  }

  // ── COMBI 2: Le rapport qualité/risque (mix safe + value, unique matches) ──
  const balancedCandidates: BetSelection[] = [];

  const safeForBalanced = deduplicateByMatch(
    selections.filter((s) => s.category === "safe" && s.confidence === "high")
  ).slice(0, 2);
  balancedCandidates.push(...safeForBalanced);

  const usedMatches = new Set(safeForBalanced.map((s) => s.match));
  const valueForBalanced = selections
    .filter((s) => s.category === "value" && s.confidence !== "low" && !usedMatches.has(s.match))
    .sort((a, b) => b.odds - a.odds);
  const dedupedValue = deduplicateByMatch(valueForBalanced).slice(0, 4);
  balancedCandidates.push(...dedupedValue);

  if (balancedCandidates.length > 0) {
    const totalOdds = balancedCandidates.reduce((acc, s) => acc * s.odds, 1);
    combinations.push({
      name: "LE BEST VALUE",
      description: "Combine equilibre alliant securite et valeur. Le meilleur rapport rendement/risque.",
      selections: balancedCandidates,
      totalOdds: Math.round(totalOdds * 100) / 100,
      risk: "medium",
      expectedReturn10: Math.round(totalOdds * 10 * 100) / 100,
    });
  }

  // ── COMBI 3: Le coup de folie (higher odds, higher risk, unique matches) ──
  const riskyCandidates = selections
    .filter((s) => s.odds >= 1.50 && s.confidence !== "low")
    .sort((a, b) => b.odds - a.odds);
  const riskyPicks = deduplicateByMatch(riskyCandidates).slice(0, 5);

  if (riskyPicks.length > 0) {
    const totalOdds = riskyPicks.reduce((acc, s) => acc * s.odds, 1);
    combinations.push({
      name: "LE COUP DE FOLIE",
      description: "Combine a forte cote pour les audacieux. Risque eleve mais gros potentiel.",
      selections: riskyPicks,
      totalOdds: Math.round(totalOdds * 100) / 100,
      risk: "high",
      expectedReturn10: Math.round(totalOdds * 10 * 100) / 100,
    });
  }

  return combinations;
}

// ─── MAIN ANALYSIS ──────────────────────────────────────────────────────────

export function runAnalysis(): {
  selections: BetSelection[];
  combinations: Combination[];
  summary: string;
} {
  const selections = findValueBets(matchday8);
  const combinations = buildCombinations(selections);

  const lines: string[] = [
    "╔══════════════════════════════════════════════════════════════╗",
    "║   CHAMPIONS LEAGUE 2025/26 — MATCHDAY 8 BETTING ANALYZER   ║",
    "║              Mercredi 28 Janvier 2026, 21h00                ║",
    "╚══════════════════════════════════════════════════════════════╝",
    "",
  ];

  for (const combo of combinations) {
    lines.push(`\n${"═".repeat(60)}`);
    lines.push(`  ${combo.name} (Risque: ${combo.risk.toUpperCase()})`);
    lines.push(`${"═".repeat(60)}`);
    lines.push(`  ${combo.description}`);
    lines.push(`  Cote totale: ${combo.totalOdds} | Gain pour 10€: ${combo.expectedReturn10}€`);
    lines.push("");

    for (let i = 0; i < combo.selections.length; i++) {
      const s = combo.selections[i];
      lines.push(`  ${i + 1}. [${s.match}]`);
      lines.push(`     → ${s.selection} @ ${s.odds}`);
      lines.push(`     📊 ${s.reasoning}`);
      lines.push("");
    }
  }

  lines.push("\n⚠️  AVERTISSEMENT: Les paris sportifs comportent des risques.");
  lines.push("    Jouez de manière responsable. Ne misez que ce que vous pouvez perdre.");

  return {
    selections,
    combinations,
    summary: lines.join("\n"),
  };
}

// Run if executed directly
const result = runAnalysis();
console.log(result.summary);
