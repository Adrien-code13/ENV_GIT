#!/usr/bin/env python3
"""
Synchronize lyrics with audio using speech recognition.

Supports multiple backends (tries in order):
  1. faster-whisper (pip install faster-whisper)
  2. openai-whisper (pip install openai-whisper)
  3. whisper.cpp (binary in PATH or WHISPER_CPP_PATH env var)
  4. Fallback: uniform timing based on audio duration via ffprobe

Usage:
    python3 scripts/whisper-sync.py <audio_file> <lyrics_json> [total_duration]

Input lyrics_json format:
    '["line 1 text", "line 2 text", ...]'
    or a path to a JSON file containing the array

Output: JSON with timestamps to stdout
    [{"text": "line 1", "startTime": 0.0, "endTime": 1.5}, ...]

Environment variables:
    WHISPER_MODEL    - model size: tiny, base, small (default: base)
    WHISPER_CPP_PATH - path to whisper-cli binary
"""

import sys
import json
import os
import subprocess
import warnings
import tempfile

warnings.filterwarnings("ignore")

WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")


def log(msg: str):
    sys.stderr.write(f"[whisper-sync] {msg}\n")


def match_lyrics_to_segments(lyrics: list[str], segments: list[dict]) -> list[dict]:
    """Match each lyric line to the best segment using word overlap scoring."""
    results = []

    for line in lyrics:
        line_words = set(line.lower().split())
        best_seg = None
        best_score = -1

        for seg in segments:
            seg_words = set(seg["text"].lower().split())
            overlap = len(line_words & seg_words)
            score = overlap / max(len(line_words), 1)
            if score > best_score:
                best_score = score
                best_seg = seg

        if best_seg:
            results.append({
                "text": line,
                "startTime": round(best_seg["start"], 1),
                "endTime": round(best_seg["end"], 1),
                "confidence": round(best_score, 2),
            })
        else:
            results.append({
                "text": line,
                "startTime": 0,
                "endTime": 0,
                "confidence": 0,
            })

    # Fix overlaps: ensure sequential order
    for i in range(1, len(results)):
        if results[i]["startTime"] < results[i - 1]["endTime"]:
            mid = (results[i - 1]["endTime"] + results[i]["startTime"]) / 2
            results[i - 1]["endTime"] = round(mid, 1)
            results[i]["startTime"] = round(mid, 1)

    for i in range(1, len(results)):
        if results[i]["startTime"] <= results[i - 1]["startTime"]:
            results[i]["startTime"] = results[i - 1]["endTime"]
        if results[i]["endTime"] <= results[i]["startTime"]:
            results[i]["endTime"] = round(results[i]["startTime"] + 1.5, 1)

    return results


def try_faster_whisper(audio_path: str) -> list[dict] | None:
    """Try using faster-whisper (CTranslate2 backend, lighter than openai-whisper)."""
    try:
        from faster_whisper import WhisperModel
        log(f"Using faster-whisper with model '{WHISPER_MODEL}'...")
        model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
        segments_gen, info = model.transcribe(audio_path, language="fr", word_timestamps=True)
        segments = []
        for seg in segments_gen:
            segments.append({"start": seg.start, "end": seg.end, "text": seg.text.strip()})
            log(f"  [{seg.start:.1f}s - {seg.end:.1f}s] {seg.text.strip()}")
        log(f"Found {len(segments)} segments")
        return segments
    except Exception as e:
        log(f"faster-whisper failed: {e}")
        return None


def try_openai_whisper(audio_path: str) -> list[dict] | None:
    """Try using openai-whisper (PyTorch backend)."""
    try:
        import whisper
        log(f"Using openai-whisper with model '{WHISPER_MODEL}'...")
        model = whisper.load_model(WHISPER_MODEL)
        result = model.transcribe(audio_path, language="fr", word_timestamps=True, verbose=False)
        segments = []
        for seg in result.get("segments", []):
            segments.append({"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()})
            log(f"  [{seg['start']:.1f}s - {seg['end']:.1f}s] {seg['text'].strip()}")
        log(f"Found {len(segments)} segments")
        return segments
    except Exception as e:
        log(f"openai-whisper failed: {e}")
        return None


def try_whisper_cpp(audio_path: str) -> list[dict] | None:
    """Try using whisper.cpp binary."""
    cpp_path = os.environ.get("WHISPER_CPP_PATH", "")
    candidates = [cpp_path, "whisper-cli", "whisper.cpp", "/tmp/whisper.cpp/build/bin/whisper-cli"]

    binary = None
    for c in candidates:
        if not c:
            continue
        try:
            subprocess.run([c, "--help"], capture_output=True, timeout=5)
            binary = c
            break
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue

    if not binary:
        log("whisper.cpp not found")
        return None

    # whisper.cpp needs a .ggml model file
    model_paths = [
        os.environ.get("WHISPER_CPP_MODEL", ""),
        os.path.expanduser(f"~/.cache/whisper.cpp/ggml-{WHISPER_MODEL}.bin"),
        f"/tmp/whisper-models/ggml-{WHISPER_MODEL}.bin",
        os.path.join(os.path.dirname(binary), "..", "models", f"ggml-{WHISPER_MODEL}.bin"),
    ]

    model_path = None
    for mp in model_paths:
        if mp and os.path.exists(mp) and os.path.getsize(mp) > 0:
            model_path = mp
            break

    if not model_path:
        log(f"whisper.cpp model not found. Download with:")
        log(f"  wget -O ~/.cache/whisper.cpp/ggml-{WHISPER_MODEL}.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-{WHISPER_MODEL}.bin")
        return None

    try:
        log(f"Using whisper.cpp: {binary} with model {model_path}")
        # Output as JSON
        result = subprocess.run(
            [binary, "-m", model_path, "-l", "fr", "-oj", "-f", audio_path],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            log(f"whisper.cpp error: {result.stderr[:200]}")
            return None

        data = json.loads(result.stdout)
        segments = []
        for seg in data.get("transcription", []):
            t_start = seg["timestamps"]["from"].replace(",", ".")
            t_end = seg["timestamps"]["to"].replace(",", ".")
            # Parse HH:MM:SS.mmm format
            start_s = _parse_timestamp(t_start)
            end_s = _parse_timestamp(t_end)
            segments.append({"start": start_s, "end": end_s, "text": seg["text"].strip()})
            log(f"  [{start_s:.1f}s - {end_s:.1f}s] {seg['text'].strip()}")

        log(f"Found {len(segments)} segments")
        return segments
    except Exception as e:
        log(f"whisper.cpp failed: {e}")
        return None


def _parse_timestamp(ts: str) -> float:
    """Parse HH:MM:SS.mmm to seconds."""
    parts = ts.split(":")
    if len(parts) == 3:
        h, m, s = parts
        return int(h) * 3600 + int(m) * 60 + float(s)
    elif len(parts) == 2:
        m, s = parts
        return int(m) * 60 + float(s)
    return float(ts)


def get_audio_duration(audio_path: str) -> float | None:
    """Get audio duration using ffprobe."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", audio_path],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            return float(data["format"]["duration"])
    except Exception:
        pass

    # Try with ffmpeg
    try:
        result = subprocess.run(
            ["ffmpeg", "-i", audio_path],
            capture_output=True, text=True, timeout=10
        )
        import re
        match = re.search(r"Duration: (\d+):(\d+):(\d+)\.(\d+)", result.stderr)
        if match:
            h, m, s, ms = match.groups()
            return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 100
    except Exception:
        pass

    return None


def uniform_timing(lyrics: list[str], total_duration: float) -> list[dict]:
    """Distribute lyrics evenly across the total duration."""
    log(f"Using uniform timing: {total_duration}s for {len(lyrics)} lines")
    time_per_line = total_duration / len(lyrics)
    results = []
    for i, line in enumerate(lyrics):
        results.append({
            "text": line,
            "startTime": round(i * time_per_line, 1),
            "endTime": round((i + 1) * time_per_line, 1),
            "confidence": 0,
        })
    return results


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/whisper-sync.py <audio_file> <lyrics_json> [total_duration]")
        print('  lyrics_json: JSON array of strings, e.g. \'["line1", "line2"]\'')
        print("  total_duration: optional fallback duration in seconds")
        sys.exit(1)

    audio_path = sys.argv[1]
    lyrics_json = sys.argv[2]
    fallback_duration = float(sys.argv[3]) if len(sys.argv) > 3 else None

    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"Audio file not found: {audio_path}"}))
        sys.exit(1)

    try:
        lyrics = json.loads(lyrics_json)
    except json.JSONDecodeError:
        if os.path.exists(lyrics_json):
            with open(lyrics_json) as f:
                lyrics = json.load(f)
        else:
            print(json.dumps({"error": "Invalid lyrics JSON"}))
            sys.exit(1)

    # Try each backend in order
    segments = None

    log("Trying faster-whisper...")
    segments = try_faster_whisper(audio_path)

    if segments is None:
        log("Trying openai-whisper...")
        segments = try_openai_whisper(audio_path)

    if segments is None:
        log("Trying whisper.cpp...")
        segments = try_whisper_cpp(audio_path)

    if segments and len(segments) > 0:
        matched = match_lyrics_to_segments(lyrics, segments)
        log("Sync complete (speech recognition)")
        print(json.dumps(matched, ensure_ascii=False, indent=2))
    else:
        # Fallback: uniform timing
        log("No speech recognition available, using uniform timing")
        duration = fallback_duration
        if duration is None:
            duration = get_audio_duration(audio_path)
        if duration is None:
            duration = len(lyrics) * 2  # default 2s per line
            log(f"Could not determine audio duration, using {duration}s")

        result = uniform_timing(lyrics, duration)
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
