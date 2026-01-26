import type { RapLyricsVideo, LyricLine, TermExplanation, VideoStyle } from "../types";

/**
 * Helper to create a term explanation
 */
export function createTerm(
  term: string,
  definition: string,
  options?: {
    example?: string;
    category?: TermExplanation["category"];
  }
): TermExplanation {
  return {
    term,
    definition,
    ...options,
  };
}

/**
 * Helper to create a lyric line
 */
export function createLine(
  id: string,
  text: string,
  startTime: number,
  endTime: number,
  options?: {
    terms?: TermExplanation[];
    showExplanation?: boolean;
  }
): LyricLine {
  return {
    id,
    text,
    startTime,
    endTime,
    terms: options?.terms ?? [],
    showExplanation: options?.showExplanation ?? (options?.terms?.length ?? 0) > 0,
  };
}

/**
 * Helper to create lines from an array with automatic timing
 */
export function createLinesFromArray(
  lines: Array<{
    text: string;
    duration?: number;
    terms?: TermExplanation[];
    showExplanation?: boolean;
  }>,
  options?: {
    startTime?: number;
    defaultDuration?: number;
    gap?: number;
  }
): LyricLine[] {
  const startTime = options?.startTime ?? 0;
  const defaultDuration = options?.defaultDuration ?? 3;
  const gap = options?.gap ?? 0;

  let currentTime = startTime;

  return lines.map((line, index) => {
    const duration = line.duration ?? defaultDuration;
    const lyricLine = createLine(
      `line-${String(index + 1).padStart(3, "0")}`,
      line.text,
      currentTime,
      currentTime + duration,
      {
        terms: line.terms,
        showExplanation: line.showExplanation,
      }
    );
    currentTime += duration + gap;
    return lyricLine;
  });
}

/**
 * Default style presets
 */
export const stylePresets: Record<string, Partial<VideoStyle>> = {
  dark: {
    backgroundColor: "#0a0a0f",
    textColor: "#ffffff",
    highlightColor: "#ff6b35",
    explanationBgColor: "#1a1a2e",
  },
  neon: {
    backgroundColor: "#0f0f23",
    textColor: "#00ff88",
    highlightColor: "#ff00ff",
    explanationBgColor: "#1a0a2e",
  },
  classic: {
    backgroundColor: "#1a1a1a",
    textColor: "#f5f5f5",
    highlightColor: "#ffd700",
    explanationBgColor: "#2d2d2d",
  },
  streetBlue: {
    backgroundColor: "#0d1b2a",
    textColor: "#e0e1dd",
    highlightColor: "#00b4d8",
    explanationBgColor: "#1b263b",
  },
  fire: {
    backgroundColor: "#1a0a0a",
    textColor: "#fff5e6",
    highlightColor: "#ff4500",
    explanationBgColor: "#2a1515",
  },
};

/**
 * Create a complete RapLyricsVideo data object
 */
export function createRapLyricsVideo(options: {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  lyrics: LyricLine[];
  stylePreset?: keyof typeof stylePresets;
  customStyle?: Partial<VideoStyle>;
  coverImage?: string;
  audioFile?: string;
}): RapLyricsVideo {
  const preset = options.stylePreset ? stylePresets[options.stylePreset] : stylePresets.dark;

  return {
    id: options.id ?? `track-${Date.now()}`,
    version: "1.0.0",
    track: {
      title: options.title,
      artist: options.artist,
      album: options.album,
      year: options.year,
      coverImage: options.coverImage,
      audioFile: options.audioFile,
    },
    lyrics: options.lyrics,
    style: {
      backgroundColor: "#0a0a0f",
      textColor: "#ffffff",
      highlightColor: "#ff6b35",
      explanationBgColor: "#1a1a2e",
      fontFamily: "'Montserrat', 'Arial Black', sans-serif",
      fontSize: 52,
      animationStyle: "slide",
      ...preset,
      ...options.customStyle,
    },
    config: {
      width: 1080,
      height: 1920,
      fps: 30,
      explanationDuration: 3,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Common rap slang terms dictionary (French)
 */
export const commonRapTerms: Record<string, Omit<TermExplanation, "term">> = {
  // Verlan
  tieks: { definition: "Quartier (verlan de 'quartier')", category: "verlan" },
  reuf: { definition: "Frère (verlan de 'frère')", category: "verlan" },
  meuf: { definition: "Femme, fille (verlan de 'femme')", category: "verlan" },
  keuf: { definition: "Flic, policier (verlan de 'flic')", category: "verlan" },
  tromé: { definition: "Métro (verlan de 'métro')", category: "verlan" },
  zicmu: { definition: "Musique (verlan de 'musique')", category: "verlan" },
  zarbi: { definition: "Bizarre (verlan de 'bizarre')", category: "verlan" },
  chelou: { definition: "Louche, suspect (verlan de 'louche')", category: "verlan" },
  relou: { definition: "Lourd, pénible (verlan de 'lourd')", category: "verlan" },
  teushi: { definition: "Shit, cannabis (verlan)", category: "verlan" },
  beuh: { definition: "Herbe, cannabis (verlan de 'herbe')", category: "verlan" },
  pécho: { definition: "Choper, attraper, séduire (verlan de 'choper')", category: "verlan" },
  cimer: { definition: "Merci (verlan de 'merci')", category: "verlan" },
  vénère: { definition: "Énervé (verlan de 'énervé')", category: "verlan" },
  chanmé: { definition: "Méchant, incroyable (verlan de 'méchant')", category: "verlan" },

  // Argot
  thune: { definition: "Argent", category: "argot" },
  oseille: { definition: "Argent", category: "argot" },
  lovés: { definition: "Argent", category: "argot" },
  biff: { definition: "Argent, billets", category: "argot" },
  galette: { definition: "Argent, ou disque (d'or/platine)", category: "argot" },
  bail: { definition: "Affaire, histoire, situation", category: "argot" },
  daron: { definition: "Père", category: "argot" },
  daronne: { definition: "Mère", category: "argot" },
  taf: { definition: "Travail", category: "argot" },
  go: { definition: "Fille, copine", category: "argot" },
  mec: { definition: "Homme, gars", category: "argot" },
  poto: { definition: "Ami, pote", category: "argot" },
  frérot: { definition: "Frère, ami proche", category: "argot" },
  gamos: { definition: "Cigarette", category: "argot" },
  clope: { definition: "Cigarette", category: "argot" },
  caisse: { definition: "Voiture", category: "argot" },
  bolide: { definition: "Voiture rapide, de luxe", category: "argot" },
  bicrave: { definition: "Vendre (souvent de la drogue)", category: "argot" },
  ken: { definition: "Avoir des relations sexuelles", category: "argot" },

  // Anglicismes
  street: { definition: "La rue, le quartier", category: "anglicisme" },
  game: { definition: "Le milieu, l'industrie", category: "anglicisme" },
  flow: { definition: "Façon de rapper, rythme", category: "anglicisme" },
  beef: { definition: "Conflit, embrouille", category: "anglicisme" },
  crew: { definition: "Groupe, équipe", category: "anglicisme" },
  hood: { definition: "Quartier, ghetto", category: "anglicisme" },
  flex: { definition: "Frimer, se vanter", category: "anglicisme" },
  drip: { definition: "Style vestimentaire", category: "anglicisme" },
  hustle: { definition: "Se débrouiller, travailler dur", category: "anglicisme" },
  hype: { definition: "Excitation, engouement", category: "anglicisme" },
  shade: { definition: "Critique subtile, diss", category: "anglicisme" },
  vibe: { definition: "Ambiance, atmosphère", category: "anglicisme" },
  ghost: { definition: "Écrire pour quelqu'un d'autre", category: "anglicisme" },
  plug: { definition: "Connexion, fournisseur", category: "anglicisme" },

  // Expressions
  "c'est carré": { definition: "C'est parfait, bien fait", category: "expression" },
  "dans le cut": { definition: "Discret, dans l'ombre", category: "expression" },
  "sur la vie": { definition: "Je jure, promis", category: "expression" },
  "faire le buzz": { definition: "Devenir viral, faire parler de soi", category: "expression" },
  "poser un son": { definition: "Sortir une chanson", category: "expression" },
};

/**
 * Helper to quickly get a term with its definition from the dictionary
 */
export function getTerm(term: keyof typeof commonRapTerms): TermExplanation {
  const termData = commonRapTerms[term];
  if (!termData) {
    return { term: String(term), definition: "Terme non trouvé dans le dictionnaire" };
  }
  return { term: String(term), ...termData };
}
