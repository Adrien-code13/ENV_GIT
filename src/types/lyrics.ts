import { z } from "zod";

/**
 * Schema for a slang/rap term explanation
 */
export const TermExplanationSchema = z.object({
  /** The slang term or expression */
  term: z.string(),
  /** Plain language explanation of the term */
  definition: z.string(),
  /** Optional example usage */
  example: z.string().optional(),
  /** Optional category (argot, verlan, reference, etc.) */
  category: z.enum(["argot", "verlan", "reference", "anglicisme", "expression", "other"]).optional(),
});

export type TermExplanation = z.infer<typeof TermExplanationSchema>;

/**
 * Schema for a single line of lyrics
 */
export const LyricLineSchema = z.object({
  /** Unique identifier for this line */
  id: z.string(),
  /** The actual lyrics text */
  text: z.string(),
  /** Start time in seconds */
  startTime: z.number(),
  /** End time in seconds */
  endTime: z.number(),
  /** Terms in this line that need explanation */
  terms: z.array(TermExplanationSchema).default([]),
  /** Whether to show explanation popup for this line */
  showExplanation: z.boolean().default(false),
});

export type LyricLine = z.infer<typeof LyricLineSchema>;

/**
 * Schema for track metadata
 */
export const TrackMetadataSchema = z.object({
  /** Track title */
  title: z.string(),
  /** Artist name */
  artist: z.string(),
  /** Album name (optional) */
  album: z.string().optional(),
  /** Release year */
  year: z.number().optional(),
  /** Cover image URL or path */
  coverImage: z.string().optional(),
  /** Audio file path (for local rendering) */
  audioFile: z.string().optional(),
});

export type TrackMetadata = z.infer<typeof TrackMetadataSchema>;

/**
 * Schema for video styling options
 */
export const VideoStyleSchema = z.object({
  /** Background color */
  backgroundColor: z.string().default("#0f0f0f"),
  /** Secondary background color for gradient */
  secondaryColor: z.string().default("#1a0a2e"),
  /** Primary text color for lyrics */
  textColor: z.string().default("#ffffff"),
  /** Highlight color for terms */
  highlightColor: z.string().default("#ff6b35"),
  /** Color for explanation popups */
  explanationBgColor: z.string().default("#1a1a2e"),
  /** Font family for lyrics */
  fontFamily: z.string().default("'Montserrat', sans-serif"),
  /** Font size for lyrics (in pixels) */
  fontSize: z.number().default(48),
  /** Animation style */
  animationStyle: z.enum(["fade", "slide", "bounce", "typewriter"]).default("fade"),
  /** Optional background image filename in public/ */
  backgroundImage: z.string().optional(),
});

export type VideoStyle = z.infer<typeof VideoStyleSchema>;

/**
 * Schema for video configuration
 */
export const VideoConfigSchema = z.object({
  /** Video width in pixels */
  width: z.number().default(1080),
  /** Video height in pixels */
  height: z.number().default(1920),
  /** Frames per second */
  fps: z.number().default(30),
  /** Duration to show each explanation (in seconds) */
  explanationDuration: z.number().default(3),
});

export type VideoConfig = z.infer<typeof VideoConfigSchema>;

/**
 * Schema for the hook screen (first 2-3 seconds to grab attention)
 */
export const HookSchema = z.object({
  /** The term to tease */
  term: z.string(),
  /** The lyrics line containing the term */
  line: z.string(),
  /** Duration of hook screen in seconds */
  duration: z.number().default(2.5),
});

export type Hook = z.infer<typeof HookSchema>;

/**
 * Main schema for a rap lyrics video project
 */
export const RapLyricsVideoSchema = z.object({
  /** Unique project identifier */
  id: z.string(),
  /** Project version for schema migrations */
  version: z.string().default("1.0.0"),
  /** Track metadata */
  track: TrackMetadataSchema,
  /** Hook screen config */
  hook: HookSchema.optional(),
  /** All lyrics lines with timing */
  lyrics: z.array(LyricLineSchema),
  /** Video styling options */
  style: VideoStyleSchema.default({}),
  /** Video configuration */
  config: VideoConfigSchema.default({}),
  /** Created timestamp */
  createdAt: z.string().datetime().optional(),
  /** Last modified timestamp */
  updatedAt: z.string().datetime().optional(),
});

export type RapLyricsVideo = z.infer<typeof RapLyricsVideoSchema>;

/**
 * Helper function to validate and parse lyrics data
 */
export function parseRapLyricsVideo(data: unknown): RapLyricsVideo {
  return RapLyricsVideoSchema.parse(data);
}

/**
 * Helper function to safely parse with error handling
 */
export function safeParseRapLyricsVideo(data: unknown): {
  success: boolean;
  data?: RapLyricsVideo;
  error?: z.ZodError;
} {
  const result = RapLyricsVideoSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
