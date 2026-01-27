#!/usr/bin/env python3
"""
Rap Lyrics Video Generator
Generates TikTok/Shorts videos with rap lyrics and term explanations.

Usage:
    python3 generate.py --data src/data/bande-organisee.json
    python3 generate.py --data src/data/bande-organisee.json --no-audio
"""

import json
import argparse
import os
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from moviepy import (
    VideoClip,
    AudioFileClip,
    CompositeVideoClip,
    ImageClip,
    concatenate_videoclips,
)
import numpy as np


# --- Config ---
WIDTH = 1080
HEIGHT = 1920
FPS = 30
BG_COLOR = (10, 10, 15)
TEXT_COLOR = (255, 255, 255)
HIGHLIGHT_COLOR = (255, 107, 53)
EXPLANATION_BG = (26, 26, 46)
CATEGORY_COLORS = {
    "argot": (231, 76, 60),
    "verlan": (155, 89, 182),
    "reference": (52, 152, 219),
    "anglicisme": (46, 204, 113),
    "expression": (243, 156, 18),
    "other": (149, 165, 166),
}

# Fonts
FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def wrap_text(text, font, max_width, draw):
    """Wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        test_line = f"{current_line} {word}".strip()
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return lines


def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill)
    draw.pieslice([x1, y1, x1 + 2 * radius, y1 + 2 * radius], 180, 270, fill=fill)
    draw.pieslice([x2 - 2 * radius, y1, x2, y1 + 2 * radius], 270, 360, fill=fill)
    draw.pieslice([x1, y2 - 2 * radius, x1 + 2 * radius, y2], 90, 180, fill=fill)
    draw.pieslice([x2 - 2 * radius, y2 - 2 * radius, x2, y2], 0, 90, fill=fill)


def render_frame(t, data):
    """Render a single frame at time t."""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    track = data["track"]
    lyrics = data["lyrics"]
    style = data.get("style", {})

    font_title = load_font(FONT_BOLD_PATH, 42)
    font_subtitle = load_font(FONT_PATH, 32)
    font_lyrics = load_font(FONT_BOLD_PATH, 48)
    font_lyrics_small = load_font(FONT_PATH, 36)
    font_term = load_font(FONT_BOLD_PATH, 38)
    font_def = load_font(FONT_PATH, 30)
    font_category = load_font(FONT_BOLD_PATH, 22)

    # --- Background gradient (subtle) ---
    for y in range(HEIGHT):
        factor = y / HEIGHT
        r = int(BG_COLOR[0] * (1 - factor * 0.3))
        g = int(BG_COLOR[1] * (1 - factor * 0.3))
        b = int(BG_COLOR[2] + factor * 20)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, min(b, 255)))

    # --- Header: Artist + Title ---
    artist_text = track["artist"]
    title_text = track["title"]

    bbox = draw.textbbox((0, 0), artist_text, font=font_title)
    aw = bbox[2] - bbox[0]
    draw.text(((WIDTH - aw) // 2, 80), artist_text, fill=HIGHLIGHT_COLOR, font=font_title)

    bbox = draw.textbbox((0, 0), title_text, font=font_subtitle)
    tw = bbox[2] - bbox[0]
    draw.text(
        ((WIDTH - tw) // 2, 130),
        title_text,
        fill=(200, 200, 200),
        font=font_subtitle,
    )

    # --- Find active, previous, next lines ---
    active_line = None
    prev_line = None
    next_line = None

    for i, line in enumerate(lyrics):
        if line["startTime"] <= t < line["endTime"]:
            active_line = line
            if i > 0:
                prev_line = lyrics[i - 1]
            if i < len(lyrics) - 1:
                next_line = lyrics[i + 1]
            break

    # If no active line, check if we're before first or after last
    if active_line is None:
        for i, line in enumerate(lyrics):
            if t < line["startTime"]:
                next_line = line
                if i > 0:
                    prev_line = lyrics[i - 1]
                break
        else:
            if lyrics:
                prev_line = lyrics[-1]

    # --- Lyrics display area (centered vertically) ---
    lyrics_y = HEIGHT // 2 - 100
    max_text_width = WIDTH - 100

    # Previous line (faded)
    if prev_line:
        lines = wrap_text(prev_line["text"], font_lyrics_small, max_text_width, draw)
        for j, ln in enumerate(lines):
            bbox = draw.textbbox((0, 0), ln, font=font_lyrics_small)
            lw = bbox[2] - bbox[0]
            draw.text(
                ((WIDTH - lw) // 2, lyrics_y - 80 + j * 40),
                ln,
                fill=(100, 100, 100),
                font=font_lyrics_small,
            )

    # Active line (highlighted)
    if active_line:
        lines = wrap_text(active_line["text"], font_lyrics, max_text_width, draw)
        line_progress = (t - active_line["startTime"]) / (
            active_line["endTime"] - active_line["startTime"]
        )

        for j, ln in enumerate(lines):
            bbox = draw.textbbox((0, 0), ln, font=font_lyrics)
            lw = bbox[2] - bbox[0]
            lh = bbox[3] - bbox[1]
            x = (WIDTH - lw) // 2
            y = lyrics_y + j * (lh + 15)

            # Glow effect
            for offset in range(3, 0, -1):
                glow_alpha = 30 * (4 - offset)
                draw.text(
                    (x, y),
                    ln,
                    fill=(
                        min(HIGHLIGHT_COLOR[0], glow_alpha),
                        min(HIGHLIGHT_COLOR[1], glow_alpha // 2),
                        0,
                    ),
                    font=font_lyrics,
                )

            draw.text((x, y), ln, fill=TEXT_COLOR, font=font_lyrics)

        # Highlight bar under active line
        bar_width = int(line_progress * (WIDTH - 200))
        bar_y = lyrics_y + len(lines) * 65 + 10
        draw.rectangle(
            [100, bar_y, 100 + bar_width, bar_y + 4],
            fill=HIGHLIGHT_COLOR,
        )

    # Next line (faded)
    if next_line:
        lines = wrap_text(next_line["text"], font_lyrics_small, max_text_width, draw)
        for j, ln in enumerate(lines):
            bbox = draw.textbbox((0, 0), ln, font=font_lyrics_small)
            lw = bbox[2] - bbox[0]
            draw.text(
                ((WIDTH - lw) // 2, lyrics_y + 200 + j * 40),
                ln,
                fill=(60, 60, 60),
                font=font_lyrics_small,
            )

    # --- Term explanation box ---
    if active_line and active_line.get("showExplanation") and active_line.get("terms"):
        line_progress = (t - active_line["startTime"]) / (
            active_line["endTime"] - active_line["startTime"]
        )

        if line_progress > 0.3:
            terms = active_line["terms"]
            # Show one term at a time
            term_idx = min(
                int((line_progress - 0.3) / 0.7 * len(terms)), len(terms) - 1
            )
            term = terms[term_idx]

            # Explanation box
            box_x = 60
            box_w = WIDTH - 120
            box_y = HEIGHT - 550
            box_h = 280

            # Fade in
            fade = min(1.0, (line_progress - 0.3) * 5)

            # Draw box background
            overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            bg_alpha = int(220 * fade)
            draw_rounded_rect(
                overlay_draw,
                (box_x, box_y, box_x + box_w, box_y + box_h),
                20,
                (*EXPLANATION_BG, bg_alpha),
            )

            # Border
            border_color = (*HIGHLIGHT_COLOR, int(255 * fade))
            overlay_draw.rounded_rectangle(
                (box_x, box_y, box_x + box_w, box_y + box_h),
                radius=20,
                outline=border_color,
                width=3,
            )

            img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
            draw = ImageDraw.Draw(img)

            if fade > 0.3:
                # Category badge
                category = term.get("category", "other")
                cat_color = CATEGORY_COLORS.get(category, CATEGORY_COLORS["other"])
                cat_labels = {
                    "argot": "ARGOT",
                    "verlan": "VERLAN",
                    "reference": "RÉFÉRENCE",
                    "anglicisme": "ANGLICISME",
                    "expression": "EXPRESSION",
                }
                cat_text = cat_labels.get(category, "TERME")
                cat_bbox = draw.textbbox((0, 0), cat_text, font=font_category)
                cat_w = cat_bbox[2] - cat_bbox[0] + 24
                draw_rounded_rect(
                    draw,
                    (box_x + 25, box_y - 15, box_x + 25 + cat_w, box_y + 15),
                    10,
                    cat_color,
                )
                draw.text(
                    (box_x + 37, box_y - 12),
                    cat_text,
                    fill=(255, 255, 255),
                    font=font_category,
                )

                # Term
                term_text = f'"{term["term"]}"'
                draw.text(
                    (box_x + 30, box_y + 30),
                    term_text,
                    fill=HIGHLIGHT_COLOR,
                    font=font_term,
                )

                # Definition (wrapped)
                def_lines = wrap_text(
                    term["definition"], font_def, box_w - 60, draw
                )
                for j, dl in enumerate(def_lines):
                    draw.text(
                        (box_x + 30, box_y + 90 + j * 38),
                        dl,
                        fill=(220, 220, 220),
                        font=font_def,
                    )

    # --- Progress bar at bottom ---
    if lyrics:
        total_duration = lyrics[-1]["endTime"]
        progress = min(t / total_duration, 1.0) if total_duration > 0 else 0
        bar_y = HEIGHT - 60
        draw.rectangle([50, bar_y, WIDTH - 50, bar_y + 6], fill=(50, 50, 50))
        draw.rectangle(
            [50, bar_y, 50 + int(progress * (WIDTH - 100)), bar_y + 6],
            fill=HIGHLIGHT_COLOR,
        )

    return np.array(img)


def download_audio(artist, title, output_path):
    """Download audio from YouTube using yt-dlp."""
    query = f"{artist} {title} audio"
    print(f"Searching for: {query}")

    cmd = [
        "yt-dlp",
        f"ytsearch1:{query}",
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "-o", str(output_path),
        "--no-playlist",
        "--quiet",
    ]

    try:
        subprocess.run(cmd, check=True, timeout=120)
        # yt-dlp may add extension
        if not output_path.exists():
            mp3_path = output_path.with_suffix(".mp3")
            if mp3_path.exists():
                return mp3_path
            # Check for other extensions
            for ext in [".mp3", ".m4a", ".webm", ".opus"]:
                p = output_path.with_suffix(ext)
                if p.exists():
                    return p
        return output_path
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Error downloading audio: {e}")
        return None


def generate_video(data_path, output_path=None, start_time=None, end_time=None, no_audio=False):
    """Generate the video from JSON data."""
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    track = data["track"]
    lyrics = data["lyrics"]

    if not lyrics:
        print("Error: No lyrics found in data file")
        return

    # Calculate duration
    total_duration = lyrics[-1]["endTime"] + 2  # 2s buffer

    if output_path is None:
        output_path = Path("out") / f"{track['artist']} - {track['title']}.mp4"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating video for: {track['artist']} - {track['title']}")
    print(f"Duration: {total_duration}s | {len(lyrics)} lines")

    # Download audio
    audio_clip = None
    if not no_audio:
        audio_path = Path("out") / "audio" / f"{track['artist']} - {track['title']}.mp3"
        audio_path.parent.mkdir(parents=True, exist_ok=True)

        if not audio_path.exists():
            print("Downloading audio...")
            actual_path = download_audio(track["artist"], track["title"], audio_path)
            if actual_path:
                audio_path = actual_path
                print(f"Audio downloaded: {audio_path}")
            else:
                print("Could not download audio. Generating video without audio.")
        else:
            print(f"Using cached audio: {audio_path}")

        if audio_path.exists():
            audio_clip = AudioFileClip(str(audio_path))
            if start_time is not None:
                end = end_time if end_time else audio_clip.duration
                audio_clip = audio_clip.subclipped(start_time, min(end, audio_clip.duration))
                total_duration = audio_clip.duration

    # Create video
    print("Rendering frames...")

    def make_frame(t):
        return render_frame(t, data)

    video = VideoClip(make_frame, duration=total_duration)

    if audio_clip:
        video = video.with_audio(audio_clip)

    print(f"Exporting to {output_path}...")
    video.write_videofile(
        str(output_path),
        fps=FPS,
        codec="libx264",
        audio_codec="aac" if audio_clip else None,
        preset="medium",
        threads=4,
        logger="bar",
    )

    print(f"\nVideo saved to: {output_path}")
    print(f"Ready to upload to TikTok or YouTube Shorts!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate rap lyrics video")
    parser.add_argument("--data", required=True, help="Path to JSON data file")
    parser.add_argument("--output", "-o", help="Output video path")
    parser.add_argument("--start", type=float, help="Audio start time (seconds)")
    parser.add_argument("--end", type=float, help="Audio end time (seconds)")
    parser.add_argument("--no-audio", action="store_true", help="Generate without audio")

    args = parser.parse_args()
    generate_video(args.data, args.output, args.start, args.end, args.no_audio)
