#!/usr/bin/env node
/**
 * Node.js Lyrics Sync Tool
 *
 * This script can use:
 * 1. OpenAI Whisper API (cloud) - fastest, requires API key
 * 2. Local Python Whisper script - no API key needed
 *
 * Usage:
 *   node sync_lyrics_node.js --audio audio.mp3 --lyrics "Line 1|Line 2|Line 3" --artist "Ninho" --title "+971"
 *
 * Environment:
 *   OPENAI_API_KEY - For using OpenAI Whisper API
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Parse command line arguments
function parseArgs() {
  const args = {
    audio: null,
    lyrics: null,
    artist: 'Unknown Artist',
    title: 'Unknown Title',
    hookTerm: 'TERM',
    hookLine: '',
    difficulty: 3,
    output: path.join(__dirname, '..', 'src', 'data', 'autobahn.json'),
    useApi: false,
  };

  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--audio':
      case '-a':
        args.audio = argv[++i];
        break;
      case '--lyrics':
      case '-l':
        args.lyrics = argv[++i];
        break;
      case '--artist':
        args.artist = argv[++i];
        break;
      case '--title':
        args.title = argv[++i];
        break;
      case '--hook-term':
        args.hookTerm = argv[++i];
        break;
      case '--hook-line':
        args.hookLine = argv[++i];
        break;
      case '--difficulty':
        args.difficulty = parseInt(argv[++i], 10);
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
        break;
      case '--use-api':
        args.useApi = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Lyrics Sync Tool - Automatic timing synchronization

Usage:
  node sync_lyrics_node.js [options]

Options:
  --audio, -a       Path to audio file (required)
  --lyrics, -l      Lyrics separated by | (required)
  --artist          Artist name
  --title           Track title
  --hook-term       Main term to decode in hook
  --hook-line       Line containing the hook term
  --difficulty      Difficulty level 1-5 (default: 3)
  --output, -o      Output JSON path
  --use-api         Use OpenAI Whisper API instead of local
  --help, -h        Show this help

Example:
  node sync_lyrics_node.js \\
    --audio audio.mp3 \\
    --lyrics "J'ai le pondu|Dans l'Viano|Un peu plus de zingués" \\
    --artist "Ninho" \\
    --title "+971" \\
    --hook-term "FUMBWA"
  `);
}

// Simple string similarity (Levenshtein-based)
function similarity(s1, s2) {
  const normalize = (s) => s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const a = normalize(s1);
  const b = normalize(s2);

  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Simple character-based similarity
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }

  return matches / longer.length;
}

// Use Python script for local transcription
async function transcribeLocal(audioPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'sync_lyrics.py');
    const tempLyrics = path.join('/tmp', `lyrics_${Date.now()}.txt`);
    const tempOutput = path.join('/tmp', `output_${Date.now()}.json`);

    // We need to run Python script in a special mode to just transcribe
    console.log('Running local Whisper transcription...');
    console.log('This may take a few minutes depending on audio length and your hardware.');

    try {
      // Check if whisper is installed
      execSync('python3 -c "import whisper"', { stdio: 'pipe' });
    } catch (e) {
      reject(new Error('Whisper not installed. Run: pip install openai-whisper'));
      return;
    }

    const pythonCode = `
import whisper
import json
import sys

model = whisper.load_model("medium")
result = model.transcribe("${audioPath}", language="fr", word_timestamps=True)

segments = []
for seg in result.get("segments", []):
    segments.append({
        "text": seg["text"].strip(),
        "start": seg["start"],
        "end": seg["end"]
    })

print(json.dumps(segments))
`;

    const proc = spawn('python3', ['-c', pythonCode]);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Whisper failed: ${stderr}`));
      } else {
        try {
          const segments = JSON.parse(stdout.trim());
          resolve(segments);
        } catch (e) {
          reject(new Error(`Failed to parse Whisper output: ${e.message}`));
        }
      }
    });
  });
}

// Use OpenAI Whisper API
async function transcribeApi(audioPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  console.log('Using OpenAI Whisper API...');

  // Dynamic import for fetch (Node 18+)
  const fs = require('fs');
  const FormData = require('form-data');
  const https = require('https');

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('model', 'whisper-1');
    form.append('language', 'fr');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'segment');

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${apiKey}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(new Error(result.error.message));
          } else {
            const segments = result.segments.map((s) => ({
              text: s.text.trim(),
              start: s.start,
              end: s.end,
            }));
            resolve(segments);
          }
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

// Align lyrics to transcribed segments
function alignLyrics(lyrics, segments) {
  const aligned = [];
  const usedSegments = new Set();

  for (const lyric of lyrics) {
    let bestMatch = null;
    let bestScore = 0;
    let bestIdx = -1;

    for (let i = 0; i < segments.length; i++) {
      if (usedSegments.has(i)) continue;

      const score = similarity(lyric, segments[i].text);

      // Try combining adjacent segments
      if (i + 1 < segments.length && !usedSegments.has(i + 1)) {
        const combined = segments[i].text + ' ' + segments[i + 1].text;
        const combinedScore = similarity(lyric, combined);
        if (combinedScore > score) {
          // Use combined segment timing
          if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestMatch = {
              text: combined,
              start: segments[i].start,
              end: segments[i + 1].end,
            };
            bestIdx = i;
          }
          continue;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = segments[i];
        bestIdx = i;
      }
    }

    if (bestMatch && bestScore >= 0.3) {
      aligned.push({
        text: lyric,
        startTime: Math.round(bestMatch.start * 100) / 100,
        endTime: Math.round(bestMatch.end * 100) / 100,
        confidence: Math.round(bestScore * 100) / 100,
        transcribed: bestMatch.text,
      });
      usedSegments.add(bestIdx);
    } else {
      aligned.push({
        text: lyric,
        startTime: null,
        endTime: null,
        confidence: 0,
        warning: 'No match found',
      });
    }
  }

  return aligned;
}

// Estimate missing timings
function estimateMissingTimings(aligned) {
  for (let i = 0; i < aligned.length; i++) {
    if (aligned[i].startTime === null) {
      let prevEnd = 0;
      let nextStart = null;

      for (let j = i - 1; j >= 0; j--) {
        if (aligned[j].endTime !== null) {
          prevEnd = aligned[j].endTime;
          break;
        }
      }

      for (let j = i + 1; j < aligned.length; j++) {
        if (aligned[j].startTime !== null) {
          nextStart = aligned[j].startTime;
          break;
        }
      }

      const duration = Math.max(1.5, Math.min(4.0, aligned[i].text.length * 0.08));

      if (nextStart !== null) {
        aligned[i].startTime = Math.round((prevEnd + 0.1) * 100) / 100;
        aligned[i].endTime = Math.round(Math.min(prevEnd + duration, nextStart - 0.1) * 100) / 100;
      } else {
        aligned[i].startTime = Math.round((prevEnd + 0.1) * 100) / 100;
        aligned[i].endTime = Math.round((prevEnd + duration) * 100) / 100;
      }

      aligned[i].estimated = true;
    }
  }

  return aligned;
}

// Generate output JSON
function generateJson(aligned, args) {
  const lyrics = aligned.map((item, i) => ({
    id: `line-${String(i + 1).padStart(3, '0')}`,
    text: item.text,
    startTime: item.startTime,
    endTime: item.endTime,
    terms: [],
    showExplanation: false,
  }));

  const hookLine = args.hookLine || lyrics[0]?.text || '';

  return {
    id: `${args.artist.toLowerCase().replace(/\s+/g, '-')}-${args.title.toLowerCase().replace(/\s+/g, '-')}-001`,
    version: '1.0.0',
    track: {
      title: args.title,
      artist: args.artist,
      coverImage: 'cover.jpg',
      audioFile: 'audio.mp3',
    },
    hook: {
      term: args.hookTerm.toUpperCase(),
      line: hookLine,
      duration: 2,
      difficulty: args.difficulty,
    },
    lyrics,
    style: {
      backgroundColor: '#0b1120',
      secondaryColor: '#101d35',
      highlightColor: '#00e676',
      animationStyle: 'slide',
    },
    _alignment_info: {
      total_lines: aligned.length,
      matched_lines: aligned.filter((a) => a.confidence > 0.3).length,
      estimated_lines: aligned.filter((a) => a.estimated).length,
    },
  };
}

// Main function
async function main() {
  const args = parseArgs();

  if (!args.audio) {
    console.error('Error: --audio is required');
    printHelp();
    process.exit(1);
  }

  if (!args.lyrics) {
    console.error('Error: --lyrics is required');
    printHelp();
    process.exit(1);
  }

  // Check audio file exists
  if (!fs.existsSync(args.audio)) {
    console.error(`Error: Audio file not found: ${args.audio}`);
    process.exit(1);
  }

  // Parse lyrics (split by |)
  const lyrics = args.lyrics.split('|').map((l) => l.trim()).filter(Boolean);
  console.log(`Parsed ${lyrics.length} lyrics lines`);

  // Transcribe
  let segments;
  try {
    if (args.useApi) {
      segments = await transcribeApi(args.audio);
    } else {
      segments = await transcribeLocal(args.audio);
    }
  } catch (e) {
    console.error(`Transcription error: ${e.message}`);
    process.exit(1);
  }

  console.log(`\nDetected ${segments.length} segments:`);
  segments.forEach((s) => {
    console.log(`  [${s.start.toFixed(2)} - ${s.end.toFixed(2)}] ${s.text}`);
  });

  // Align
  console.log('\nAligning lyrics...');
  let aligned = alignLyrics(lyrics, segments);
  aligned = estimateMissingTimings(aligned);

  // Print results
  console.log('\nAlignment results:');
  aligned.forEach((a, i) => {
    const status = a.estimated ? '[EST]' : a.confidence > 0.5 ? '[OK]' : '[?]';
    console.log(`  ${i + 1}. [${a.startTime} - ${a.endTime}] ${status} ${a.text}`);
  });

  // Generate output
  const output = generateJson(aligned, args);

  // Write
  fs.writeFileSync(args.output, JSON.stringify(output, null, 2));
  console.log(`\nOutput written to: ${args.output}`);

  // Summary
  const matched = aligned.filter((a) => a.confidence >= 0.3).length;
  const estimated = aligned.filter((a) => a.estimated).length;
  console.log(`\nSummary: ${matched}/${lyrics.length} matched, ${estimated} estimated`);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
