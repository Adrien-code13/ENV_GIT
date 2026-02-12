#!/usr/bin/env python3
"""
Automatic Lyrics Timing Synchronization using Whisper

This script:
1. Transcribes audio using OpenAI Whisper
2. Aligns provided lyrics with detected timestamps
3. Generates a JSON file ready for the Remotion video generator

Usage:
    python sync_lyrics.py --audio audio.mp3 --lyrics lyrics.txt --output output.json

Requirements:
    pip install openai-whisper torch difflib

For better alignment, install whisperx:
    pip install whisperx
"""

import argparse
import json
import re
import sys
from pathlib import Path
from difflib import SequenceMatcher
from typing import List, Dict, Optional, Tuple

# Try to import whisperx first (better word-level alignment), fallback to whisper
try:
    import whisperx
    WHISPERX_AVAILABLE = True
except ImportError:
    WHISPERX_AVAILABLE = False

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False


def normalize_text(text: str) -> str:
    """Normalize text for comparison (lowercase, remove punctuation)."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def similarity(a: str, b: str) -> float:
    """Calculate similarity ratio between two strings."""
    return SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()


def parse_lyrics_file(lyrics_path: str) -> List[str]:
    """Parse lyrics file - one line per line."""
    with open(lyrics_path, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
    return lines


def transcribe_with_whisper(audio_path: str, model_size: str = "medium") -> Dict:
    """Transcribe audio using standard Whisper."""
    if not WHISPER_AVAILABLE:
        raise ImportError("whisper not installed. Run: pip install openai-whisper")

    print(f"Loading Whisper model ({model_size})...")
    model = whisper.load_model(model_size)

    print("Transcribing audio...")
    result = model.transcribe(
        audio_path,
        language="fr",
        word_timestamps=True,
        verbose=False
    )

    return result


def transcribe_with_whisperx(audio_path: str, model_size: str = "medium") -> Dict:
    """Transcribe audio using WhisperX for better alignment."""
    if not WHISPERX_AVAILABLE:
        raise ImportError("whisperx not installed. Run: pip install whisperx")

    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

    print(f"Loading WhisperX model ({model_size}) on {device}...")
    model = whisperx.load_model(model_size, device, compute_type=compute_type)

    print("Transcribing audio...")
    audio = whisperx.load_audio(audio_path)
    result = model.transcribe(audio, batch_size=16, language="fr")

    # Align whisper output
    print("Aligning transcript...")
    model_a, metadata = whisperx.load_align_model(language_code="fr", device=device)
    result = whisperx.align(result["segments"], model_a, metadata, audio, device)

    return result


def extract_segments_from_whisper(result: Dict) -> List[Dict]:
    """Extract segment info from Whisper result."""
    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "text": seg["text"].strip(),
            "start": seg["start"],
            "end": seg["end"],
            "words": seg.get("words", [])
        })
    return segments


def align_lyrics_to_segments(
    lyrics: List[str],
    segments: List[Dict],
    threshold: float = 0.4
) -> List[Dict]:
    """
    Align provided lyrics to transcribed segments using fuzzy matching.
    Returns list of {text, startTime, endTime} for each lyric line.
    """
    aligned = []
    used_segments = set()

    for lyric in lyrics:
        best_match = None
        best_score = 0
        best_idx = -1

        # Find best matching segment
        for idx, seg in enumerate(segments):
            if idx in used_segments:
                continue

            score = similarity(lyric, seg["text"])

            # Also try matching with combined adjacent segments
            if idx + 1 < len(segments) and idx + 1 not in used_segments:
                combined = seg["text"] + " " + segments[idx + 1]["text"]
                combined_score = similarity(lyric, combined)
                if combined_score > score:
                    score = combined_score

            if score > best_score:
                best_score = score
                best_match = seg
                best_idx = idx

        if best_match and best_score >= threshold:
            aligned.append({
                "text": lyric,
                "startTime": round(best_match["start"], 2),
                "endTime": round(best_match["end"], 2),
                "confidence": round(best_score, 2),
                "transcribed": best_match["text"]
            })
            used_segments.add(best_idx)
        else:
            # No good match found - will need manual timing
            aligned.append({
                "text": lyric,
                "startTime": None,
                "endTime": None,
                "confidence": 0,
                "transcribed": None,
                "warning": "No match found - needs manual timing"
            })

    return aligned


def estimate_missing_timings(aligned: List[Dict]) -> List[Dict]:
    """Estimate timings for lines that couldn't be matched."""
    # Find gaps and distribute time
    for i, item in enumerate(aligned):
        if item["startTime"] is None:
            # Find previous and next valid timings
            prev_end = 0
            next_start = None

            for j in range(i - 1, -1, -1):
                if aligned[j]["endTime"] is not None:
                    prev_end = aligned[j]["endTime"]
                    break

            for j in range(i + 1, len(aligned)):
                if aligned[j]["startTime"] is not None:
                    next_start = aligned[j]["startTime"]
                    break

            # Estimate duration based on text length (roughly 0.1s per character)
            estimated_duration = len(item["text"]) * 0.08
            estimated_duration = max(1.5, min(4.0, estimated_duration))

            if next_start is not None:
                # Distribute time between prev_end and next_start
                available = next_start - prev_end
                item["startTime"] = round(prev_end + 0.1, 2)
                item["endTime"] = round(min(prev_end + estimated_duration, next_start - 0.1), 2)
            else:
                # Last lines - just estimate
                item["startTime"] = round(prev_end + 0.1, 2)
                item["endTime"] = round(prev_end + estimated_duration, 2)

            item["estimated"] = True

    return aligned


def generate_video_json(
    aligned: List[Dict],
    artist: str,
    title: str,
    hook_term: str,
    hook_line: str,
    difficulty: int = 3,
    terms: Optional[List[Dict]] = None
) -> Dict:
    """Generate the final JSON structure for the video."""

    lyrics = []
    for i, item in enumerate(aligned):
        lyric_entry = {
            "id": f"line-{i+1:03d}",
            "text": item["text"],
            "startTime": item["startTime"],
            "endTime": item["endTime"],
            "terms": [],  # To be filled manually or by AI
            "showExplanation": False
        }
        lyrics.append(lyric_entry)

    # Find hook line index
    hook_line_normalized = normalize_text(hook_line)
    hook_line_idx = 0
    for i, lyric in enumerate(lyrics):
        if similarity(lyric["text"], hook_line) > 0.6:
            hook_line_idx = i
            break

    return {
        "id": f"{artist.lower().replace(' ', '-')}-{title.lower().replace(' ', '-')}-001",
        "version": "1.0.0",
        "track": {
            "title": title,
            "artist": artist,
            "coverImage": "cover.jpg",
            "audioFile": "audio.mp3"
        },
        "hook": {
            "term": hook_term.upper(),
            "line": hook_line,
            "duration": 2,
            "difficulty": difficulty
        },
        "lyrics": lyrics,
        "style": {
            "backgroundColor": "#0b1120",
            "secondaryColor": "#101d35",
            "highlightColor": "#00e676",
            "animationStyle": "slide"
        },
        "_alignment_info": {
            "total_lines": len(aligned),
            "matched_lines": sum(1 for a in aligned if a.get("confidence", 0) > 0.4),
            "estimated_lines": sum(1 for a in aligned if a.get("estimated", False)),
            "details": aligned
        }
    }


def main():
    parser = argparse.ArgumentParser(
        description="Sync lyrics with audio using Whisper"
    )
    parser.add_argument("--audio", "-a", required=True, help="Path to audio file")
    parser.add_argument("--lyrics", "-l", required=True, help="Path to lyrics file (one line per line)")
    parser.add_argument("--output", "-o", default="synced.json", help="Output JSON path")
    parser.add_argument("--artist", default="Unknown Artist", help="Artist name")
    parser.add_argument("--title", default="Unknown Title", help="Track title")
    parser.add_argument("--hook-term", default="TERM", help="Hook term to display")
    parser.add_argument("--hook-line", default="", help="Line containing the hook term")
    parser.add_argument("--difficulty", type=int, default=3, help="Difficulty (1-5)")
    parser.add_argument("--model", default="medium", choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size")
    parser.add_argument("--use-whisperx", action="store_true", help="Use WhisperX for better alignment")

    args = parser.parse_args()

    # Check audio file exists
    if not Path(args.audio).exists():
        print(f"Error: Audio file not found: {args.audio}")
        sys.exit(1)

    # Check lyrics file exists
    if not Path(args.lyrics).exists():
        print(f"Error: Lyrics file not found: {args.lyrics}")
        sys.exit(1)

    # Parse lyrics
    print(f"Reading lyrics from {args.lyrics}...")
    lyrics = parse_lyrics_file(args.lyrics)
    print(f"Found {len(lyrics)} lines")

    # Transcribe audio
    try:
        if args.use_whisperx and WHISPERX_AVAILABLE:
            result = transcribe_with_whisperx(args.audio, args.model)
        else:
            if args.use_whisperx and not WHISPERX_AVAILABLE:
                print("WhisperX not available, falling back to standard Whisper")
            result = transcribe_with_whisper(args.audio, args.model)
    except Exception as e:
        print(f"Error during transcription: {e}")
        sys.exit(1)

    # Extract segments
    segments = extract_segments_from_whisper(result)
    print(f"Detected {len(segments)} segments in audio")

    # Print detected text for debugging
    print("\n--- Detected transcription ---")
    for seg in segments:
        print(f"[{seg['start']:.2f} - {seg['end']:.2f}] {seg['text']}")
    print("--- End transcription ---\n")

    # Align lyrics to segments
    print("Aligning lyrics to audio...")
    aligned = align_lyrics_to_segments(lyrics, segments)

    # Estimate missing timings
    aligned = estimate_missing_timings(aligned)

    # Print alignment results
    print("\n--- Alignment results ---")
    for i, item in enumerate(aligned):
        status = ""
        if item.get("estimated"):
            status = " [ESTIMATED]"
        elif item.get("warning"):
            status = " [WARNING]"
        elif item["confidence"] >= 0.7:
            status = " [GOOD]"
        elif item["confidence"] >= 0.4:
            status = " [OK]"

        print(f"Line {i+1}: [{item['startTime']:.2f} - {item['endTime']:.2f}]{status}")
        print(f"  Lyrics: {item['text']}")
        if item.get("transcribed"):
            print(f"  Detected: {item['transcribed']} (conf: {item['confidence']:.2f})")
        print()
    print("--- End alignment ---\n")

    # Generate output JSON
    hook_line = args.hook_line if args.hook_line else lyrics[0]
    output = generate_video_json(
        aligned,
        artist=args.artist,
        title=args.title,
        hook_term=args.hook_term,
        hook_line=hook_line,
        difficulty=args.difficulty
    )

    # Write output
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Output written to {args.output}")

    # Summary
    matched = sum(1 for a in aligned if a.get("confidence", 0) >= 0.4)
    estimated = sum(1 for a in aligned if a.get("estimated", False))
    print(f"\nSummary:")
    print(f"  Total lines: {len(aligned)}")
    print(f"  Matched: {matched}")
    print(f"  Estimated: {estimated}")
    print(f"  Needs review: {len(aligned) - matched}")


if __name__ == "__main__":
    main()
