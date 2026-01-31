#!/usr/bin/env python3
"""
Apply whisper-sync results to a video JSON data file.

Usage:
    python3 scripts/apply-sync.py <video-json> <sync-result-json>

Example:
    python3 scripts/apply-sync.py src/data/autobahn.json sync-result.json
"""

import sys
import json
import os


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/apply-sync.py <video-json> <sync-result-json>")
        sys.exit(1)

    video_path = sys.argv[1]
    sync_path = sys.argv[2]

    if not os.path.exists(video_path):
        print(f"Error: {video_path} not found")
        sys.exit(1)

    if not os.path.exists(sync_path):
        print(f"Error: {sync_path} not found")
        sys.exit(1)

    with open(video_path, "r", encoding="utf-8") as f:
        video = json.load(f)

    with open(sync_path, "r", encoding="utf-8") as f:
        sync = json.load(f)

    if "error" in sync:
        print(f"Sync file contains error: {sync['error']}")
        sys.exit(1)

    lyrics = video.get("lyrics", [])

    if len(sync) != len(lyrics):
        print(f"Warning: sync has {len(sync)} entries but video has {len(lyrics)} lines")

    updated = 0
    for i, entry in enumerate(sync):
        if i >= len(lyrics):
            break
        lyrics[i]["startTime"] = entry["startTime"]
        lyrics[i]["endTime"] = entry["endTime"]
        updated += 1

    video["lyrics"] = lyrics

    with open(video_path, "w", encoding="utf-8") as f:
        json.dump(video, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Updated {updated} lines in {video_path}")
    for i, line in enumerate(lyrics):
        print(f"  [{line['startTime']}s - {line['endTime']}s] {line['text'][:50]}")


if __name__ == "__main__":
    main()
