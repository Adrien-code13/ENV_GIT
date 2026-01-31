import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Generate a video JSON data file from minimal inputs.
 *
 * Usage:
 *   npx ts-node scripts/generate-video.ts --config config.json
 *
 * config.json example:
 * {
 *   "title": "Flying Blue",
 *   "artist": "L2B & La Fouine",
 *   "audioFile": "audio.mp3",
 *   "difficulty": 2,
 *   "hookTerm": "shtar",
 *   "hookLine": "Moi, j'étais au shtar avec les gars de Bondy",
 *   "lyrics": [
 *     {
 *       "text": "J'vois ma tess dans l'hublot",
 *       "terms": [{ "term": "tess", "definition": "Quartier, cité", "category": "verlan" }]
 *     },
 *     ...
 *   ],
 *   "totalDuration": 8
 * }
 *
 * The script will:
 * 1. Fetch album cover from Deezer
 * 2. Try to sync lyrics with audio via Whisper (if available)
 * 3. Otherwise, distribute timings evenly
 * 4. Generate the full JSON data file
 * 5. Update Root.tsx to point to the new file
 */

const SRC_DATA_DIR = path.resolve(__dirname, "../src/data");
const TEMPLATES_DIR = path.resolve(__dirname, "../src/data/templates");
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const ROOT_PATH = path.resolve(__dirname, "../src/Root.tsx");

interface TermInput {
  term: string;
  definition: string;
  category?: string;
}

interface LyricLineInput {
  text: string;
  terms?: TermInput[];
}

interface VideoConfig {
  title: string;
  artist: string;
  audioFile: string;
  difficulty?: number;
  hookTerm: string;
  hookLine: string;
  hookDuration?: number;
  lyrics: LyricLineInput[];
  totalDuration?: number;
  outputName?: string;
  fetchCover?: boolean;
  coverFilename?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface WhisperResult {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

function tryWhisperSync(
  audioPath: string,
  lyrics: string[],
  totalDuration?: number
): WhisperResult[] | null {
  // Check if python3 is available
  try {
    execSync("which python3", { stdio: "ignore" });
  } catch {
    console.log("Python3 not found, using uniform timing distribution.");
    return null;
  }

  const syncScript = path.join(__dirname, "whisper-sync.py");
  if (!fs.existsSync(syncScript)) {
    console.log("whisper-sync.py not found, using uniform timing distribution.");
    return null;
  }

  try {
    console.log("Running whisper-sync.py for audio sync...");
    const lyricsJson = JSON.stringify(lyrics);
    const args = [
      "python3",
      syncScript,
      audioPath,
      lyricsJson,
    ];
    if (totalDuration) {
      args.push(String(totalDuration));
    }

    const result = execSync(args.join(" "), {
      stdio: ["pipe", "pipe", "inherit"],
      timeout: 120000,
      encoding: "utf-8",
    });

    const parsed: WhisperResult[] = JSON.parse(result);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      console.log("Audio sync successful!");
      return parsed;
    }
    return null;
  } catch (err) {
    console.log("Whisper sync failed, using uniform timing distribution.");
    return null;
  }
}

function archiveCurrentVideo() {
  // Find current video in Root.tsx
  if (!fs.existsSync(ROOT_PATH)) return;
  const rootContent = fs.readFileSync(ROOT_PATH, "utf-8");
  const match = rootContent.match(/import exampleData from "\.\/data\/(.+?)"/);
  if (!match) return;

  const currentFile = match[1];
  const currentPath = path.join(SRC_DATA_DIR, currentFile);
  if (!fs.existsSync(currentPath)) return;

  // Archive it
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
  const archivePath = path.join(TEMPLATES_DIR, currentFile);
  if (!fs.existsSync(archivePath)) {
    fs.copyFileSync(currentPath, archivePath);
    console.log(`Archived: ${currentFile} -> templates/`);
  }
}

async function generateVideo(config: VideoConfig) {
  const {
    title,
    artist,
    audioFile,
    difficulty = 2,
    hookTerm,
    hookLine,
    hookDuration = 2.5,
    lyrics,
    totalDuration,
    fetchCover = true,
    coverFilename,
  } = config;

  const slug = config.outputName || slugify(title);
  const outputFile = `${slug}.json`;
  const coverName = coverFilename || `cover-${slug}.jpg`;

  console.log(`\n=== Generating video: ${title} - ${artist} ===\n`);

  // Step 1: Archive current video
  archiveCurrentVideo();

  // Step 2: Fetch cover art
  if (fetchCover) {
    try {
      console.log("Fetching album cover from Deezer...");
      execSync(
        `npx ts-node "${path.join(__dirname, "fetch-cover.ts")}" "${title}" "${artist}" "${coverName}"`,
        { stdio: "inherit", cwd: path.resolve(__dirname, "..") }
      );
    } catch {
      console.log("Cover fetch failed — you'll need to add it manually.");
    }
  }

  // Step 3: Calculate timings
  const audioPath = path.join(PUBLIC_DIR, audioFile);
  let syncResults: WhisperResult[] | null = null;

  if (fs.existsSync(audioPath)) {
    syncResults = tryWhisperSync(
      audioPath,
      lyrics.map((l) => l.text),
      totalDuration
    );
  }

  // Calculate total based on number of lines if not provided
  const duration = totalDuration || lyrics.length * 2;
  const timePerLine = duration / lyrics.length;

  const lyricsData = lyrics.map((line, i) => {
    const startTime = syncResults ? syncResults[i].startTime : i * timePerLine;
    const endTime = syncResults ? syncResults[i].endTime : (i + 1) * timePerLine;

    return {
      id: `line-${String(i + 1).padStart(3, "0")}`,
      text: line.text,
      startTime: Math.round(startTime * 10) / 10,
      endTime: Math.round(endTime * 10) / 10,
      terms: (line.terms || []).map((t) => ({
        term: t.term,
        definition: t.definition,
        category: t.category || "argot",
      })),
      showExplanation: (line.terms || []).length > 0,
    };
  });

  // Step 4: Build the full JSON
  const videoData = {
    id: slug,
    version: "1.0.0",
    track: {
      title,
      artist,
      coverImage: coverName,
      audioFile,
    },
    hook: {
      term: hookTerm,
      line: hookLine,
      duration: hookDuration,
      difficulty,
    },
    lyrics: lyricsData,
    style: {
      backgroundColor: "#0b1120",
      secondaryColor: "#101d35",
      highlightColor: "#00e676",
      animationStyle: "slide",
    },
  };

  // Step 5: Write JSON
  const outputPath = path.join(SRC_DATA_DIR, outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(videoData, null, 2) + "\n");
  console.log(`\nVideo data written: src/data/${outputFile}`);

  // Step 6: Update Root.tsx
  if (fs.existsSync(ROOT_PATH)) {
    let rootContent = fs.readFileSync(ROOT_PATH, "utf-8");
    rootContent = rootContent.replace(
      /import exampleData from "\.\/data\/.+?"/,
      `import exampleData from "./data/${outputFile}"`
    );
    fs.writeFileSync(ROOT_PATH, rootContent);
    console.log(`Root.tsx updated to load: ${outputFile}`);
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Title: ${title}`);
  console.log(`Artist: ${artist}`);
  console.log(`Lines: ${lyrics.length}`);
  console.log(`Terms: ${lyrics.reduce((sum, l) => sum + (l.terms?.length || 0), 0)}`);
  console.log(`Duration: ${lyricsData[lyricsData.length - 1].endTime}s + ${hookDuration}s hook`);
  console.log(`Difficulty: ${difficulty}/4`);
  console.log(`Cover: public/${coverName}`);
  console.log(`Audio: public/${audioFile}`);
  console.log(`\nNext steps:`);
  console.log(`1. Place ${audioFile} in public/`);
  console.log(`2. Run: npx remotion studio`);
  console.log(`3. Adjust timings in src/data/${outputFile} if needed`);
  console.log(`4. Render: npx remotion render src/index.ts LyricsVideo out/video.mp4`);
}

// CLI
const args = process.argv.slice(2);
const configIdx = args.indexOf("--config");

if (configIdx === -1 || !args[configIdx + 1]) {
  console.log("Usage: npx ts-node scripts/generate-video.ts --config <config.json>");
  console.log("\nExample config.json:");
  console.log(
    JSON.stringify(
      {
        title: "Flying Blue",
        artist: "L2B & La Fouine",
        audioFile: "audio.mp3",
        difficulty: 2,
        hookTerm: "shtar",
        hookLine: "Moi, j'étais au shtar avec les gars de Bondy",
        lyrics: [
          {
            text: "J'vois ma tess dans l'hublot",
            terms: [{ term: "tess", definition: "Quartier, cité", category: "verlan" }],
          },
        ],
        totalDuration: 8,
      },
      null,
      2
    )
  );
  process.exit(1);
}

const configPath = path.resolve(args[configIdx + 1]);
if (!fs.existsSync(configPath)) {
  console.error(`Config file not found: ${configPath}`);
  process.exit(1);
}

const config: VideoConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
generateVideo(config).catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
