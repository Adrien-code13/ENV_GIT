#!/usr/bin/env python3
"""
Rap Lyrics Video Generator
Generates TikTok/Shorts videos with rap lyrics and term explanations.

Usage:
    python3 generate.py --data src/data/bande-organisee.json
    python3 generate.py --data src/data/bande-organisee.json --start 68 --end 83
    python3 generate.py --data src/data/bande-organisee.json --no-audio
"""

import json
import argparse
import os
import subprocess
import textwrap
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
try:
    # moviepy >= 2.0
    from moviepy import VideoClip, AudioFileClip
except ImportError:
    # moviepy < 2.0 (ex: Google Colab)
    from moviepy.editor import VideoClip, AudioFileClip
import numpy as np


# --- Config ---
WIDTH = 1080
HEIGHT = 1920
FPS = 30
BG_COLOR = (10, 10, 15)
TEXT_COLOR = (255, 255, 255)
DIMMED_COLOR = (80, 80, 90)
HIGHLIGHT_COLOR = (255, 107, 53)
ACCENT_COLOR = (255, 165, 0)
EXPLANATION_BG = (20, 20, 35)
EXPLANATION_BORDER = (255, 107, 53)
DIVIDER_COLOR = (40, 40, 55)

CATEGORY_COLORS = {
    "argot": (231, 76, 60),
    "verlan": (155, 89, 182),
    "reference": (52, 152, 219),
    "anglicisme": (46, 204, 113),
    "expression": (243, 156, 18),
    "other": (149, 165, 166),
}
CATEGORY_LABELS = {
    "argot": "ARGOT",
    "verlan": "VERLAN",
    "reference": "REF",
    "anglicisme": "ANGL",
    "expression": "EXPR",
}

# Layout zones
HEADER_H = 160
LEFT_W = 620          # lyrics zone width
RIGHT_X = 660         # explanation zone x start
RIGHT_W = 380         # explanation zone width
LYRICS_TOP = 220      # where lyrics start
LYRICS_BOTTOM = 1750  # where lyrics end
LINE_SPACING = 130    # spacing between lyric lines

# Fonts
FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# Cache fonts globally
_font_cache = {}

def load_font(path, size):
    key = (path, size)
    if key not in _font_cache:
        try:
            _font_cache[key] = ImageFont.truetype(path, size)
        except Exception:
            _font_cache[key] = ImageFont.load_default()
    return _font_cache[key]


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


def ease_out_cubic(t):
    """Smooth easing function."""
    return 1 - (1 - t) ** 3


def render_frame(t, data):
    """Render a single frame at time t."""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    track = data["track"]
    lyrics = data["lyrics"]

    # Fonts
    font_artist = load_font(FONT_BOLD_PATH, 38)
    font_title = load_font(FONT_PATH, 28)
    font_lyrics_active = load_font(FONT_BOLD_PATH, 36)
    font_lyrics_dim = load_font(FONT_PATH, 32)
    font_term_title = load_font(FONT_BOLD_PATH, 28)
    font_term_def = load_font(FONT_PATH, 22)
    font_category = load_font(FONT_BOLD_PATH, 16)

    # =============================================
    # HEADER: Title bar at top
    # =============================================
    # Background bar
    draw_rounded_rect(draw, (30, 40, WIDTH - 30, HEADER_H), 16, (18, 18, 30))

    # Orange accent bar on left
    draw.rectangle([30, 40, 38, HEADER_H], fill=HIGHLIGHT_COLOR)

    # Artist name
    draw.text((60, 58), track["artist"], fill=HIGHLIGHT_COLOR, font=font_artist)

    # Song title
    draw.text((60, 105), track["title"], fill=(180, 180, 190), font=font_title)

    # =============================================
    # VERTICAL DIVIDER
    # =============================================
    divider_x = LEFT_W + 20
    draw.line(
        [(divider_x, LYRICS_TOP), (divider_x, LYRICS_BOTTOM)],
        fill=DIVIDER_COLOR,
        width=2,
    )

    # =============================================
    # LEFT SIDE: Lyrics (Spotify-style scroll)
    # =============================================

    # Find active line index
    active_idx = -1
    for i, line in enumerate(lyrics):
        if line["startTime"] <= t < line["endTime"]:
            active_idx = i
            break

    # If between lines, show the last active
    if active_idx == -1:
        for i, line in enumerate(lyrics):
            if t >= line["endTime"]:
                active_idx = i
            elif t < line["startTime"]:
                break

    # Calculate the vertical center target for the active line
    lyrics_center_y = (LYRICS_TOP + LYRICS_BOTTOM) // 2 - 50

    # Smooth scroll: active line should be near vertical center
    if active_idx >= 0:
        # Calculate line progress for smooth interpolation
        line = lyrics[active_idx]
        line_progress = (t - line["startTime"]) / max(line["endTime"] - line["startTime"], 0.1)
        line_progress = min(max(line_progress, 0), 1)

        # Target Y offset so active line is centered
        target_offset = lyrics_center_y - (active_idx * LINE_SPACING)

        # Smooth transition to next line
        if active_idx < len(lyrics) - 1 and line_progress > 0.8:
            next_offset = lyrics_center_y - ((active_idx + 1) * LINE_SPACING)
            blend = ease_out_cubic((line_progress - 0.8) / 0.2)
            scroll_offset = target_offset + (next_offset - target_offset) * blend
        else:
            scroll_offset = target_offset
    else:
        scroll_offset = lyrics_center_y

    # Draw all lyric lines
    for i, line in enumerate(lyrics):
        y = int(scroll_offset + i * LINE_SPACING)

        # Skip lines outside visible area (with margin)
        if y < LYRICS_TOP - 100 or y > LYRICS_BOTTOM + 50:
            continue

        # Fade out lines near edges
        edge_fade = 1.0
        if y < LYRICS_TOP + 80:
            edge_fade = max(0, (y - LYRICS_TOP) / 80)
        elif y > LYRICS_BOTTOM - 80:
            edge_fade = max(0, (LYRICS_BOTTOM - y) / 80)

        is_active = (i == active_idx)
        is_past = (i < active_idx)

        if is_active:
            # Active line: bright white with orange accent dot
            alpha = int(255 * edge_fade)
            color = (min(255, int(255 * edge_fade)), min(255, int(255 * edge_fade)), min(255, int(255 * edge_fade)))
            font = font_lyrics_active

            # Orange dot indicator
            draw.ellipse(
                [25, y + 10, 39, y + 24],
                fill=HIGHLIGHT_COLOR,
            )

            wrapped = wrap_text(line["text"], font, LEFT_W - 60, draw)
            for j, wl in enumerate(wrapped):
                draw.text((50, y + j * 44), wl, fill=color, font=font)

        else:
            # Inactive lines: dimmed
            fade = 0.4 if is_past else 0.3
            alpha = edge_fade * fade
            gray = int(255 * alpha)
            color = (gray, gray, int(gray * 1.1))
            font = font_lyrics_dim

            wrapped = wrap_text(line["text"], font, LEFT_W - 40, draw)
            for j, wl in enumerate(wrapped):
                draw.text((50, y + j * 40), wl, fill=color, font=font)

    # =============================================
    # RIGHT SIDE: Term explanations
    # =============================================

    # Get active line's terms
    active_line = lyrics[active_idx] if 0 <= active_idx < len(lyrics) else None

    if active_line and active_line.get("showExplanation") and active_line.get("terms"):
        terms = active_line["terms"]
        line_data = active_line
        line_progress = (t - line_data["startTime"]) / max(line_data["endTime"] - line_data["startTime"], 0.1)
        line_progress = min(max(line_progress, 0), 1)

        # "DÉCRYPTAGE" header on right side
        header_y = LYRICS_TOP + 20
        draw.text(
            (RIGHT_X + 10, header_y),
            "DÉCRYPTAGE",
            fill=HIGHLIGHT_COLOR,
            font=load_font(FONT_BOLD_PATH, 20),
        )
        # Underline
        draw.rectangle(
            [RIGHT_X + 10, header_y + 28, RIGHT_X + 160, header_y + 30],
            fill=HIGHLIGHT_COLOR,
        )

        # Draw each term card
        card_start_y = header_y + 60

        for idx, term in enumerate(terms):
            # Stagger appearance: each term appears progressively
            term_appear_at = 0.1 + idx * (0.7 / max(len(terms), 1))
            if line_progress < term_appear_at:
                continue

            # Fade in
            fade_progress = min(1.0, (line_progress - term_appear_at) * 4)
            slide_offset = int((1 - ease_out_cubic(fade_progress)) * 30)

            card_y = card_start_y + idx * 200 + slide_offset

            if card_y > LYRICS_BOTTOM - 50:
                continue

            # Card background with RGBA overlay
            overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
            ov_draw = ImageDraw.Draw(overlay)
            bg_alpha = int(200 * fade_progress)
            draw_rounded_rect(
                ov_draw,
                (RIGHT_X, card_y, RIGHT_X + RIGHT_W, card_y + 170),
                14,
                (*EXPLANATION_BG, bg_alpha),
            )
            # Left accent border
            ov_draw.rectangle(
                [RIGHT_X, card_y + 10, RIGHT_X + 5, card_y + 160],
                fill=(*HIGHLIGHT_COLOR, int(255 * fade_progress)),
            )
            img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
            draw = ImageDraw.Draw(img)

            if fade_progress > 0.2:
                text_alpha = min(1.0, (fade_progress - 0.2) * 2)

                # Category badge
                category = term.get("category", "other")
                cat_color = CATEGORY_COLORS.get(category, CATEGORY_COLORS["other"])
                cat_text = CATEGORY_LABELS.get(category, "TERME")
                cat_bbox = draw.textbbox((0, 0), cat_text, font=font_category)
                cat_w = cat_bbox[2] - cat_bbox[0] + 16
                draw_rounded_rect(
                    draw,
                    (RIGHT_X + 18, card_y + 14, RIGHT_X + 18 + cat_w, card_y + 36),
                    8,
                    cat_color,
                )
                draw.text(
                    (RIGHT_X + 26, card_y + 15),
                    cat_text,
                    fill=(255, 255, 255),
                    font=font_category,
                )

                # Term name
                term_text = term["term"]
                tc = int(255 * text_alpha)
                draw.text(
                    (RIGHT_X + 18, card_y + 48),
                    term_text,
                    fill=(min(tc, HIGHLIGHT_COLOR[0]), min(tc, HIGHLIGHT_COLOR[1]), min(tc, HIGHLIGHT_COLOR[2])),
                    font=font_term_title,
                )

                # Definition (wrapped)
                def_lines = wrap_text(term["definition"], font_term_def, RIGHT_W - 36, draw)
                gray = int(200 * text_alpha)
                for j, dl in enumerate(def_lines):
                    if card_y + 88 + j * 28 < card_y + 160:
                        draw.text(
                            (RIGHT_X + 18, card_y + 88 + j * 28),
                            dl,
                            fill=(gray, gray, gray),
                            font=font_term_def,
                        )

    elif active_line and not active_line.get("terms"):
        # No terms to explain: show subtle message
        msg_y = (LYRICS_TOP + LYRICS_BOTTOM) // 2 - 20
        draw.text(
            (RIGHT_X + 30, msg_y),
            "Pas de terme",
            fill=(50, 50, 60),
            font=load_font(FONT_PATH, 22),
        )
        draw.text(
            (RIGHT_X + 30, msg_y + 30),
            "à décrypter",
            fill=(50, 50, 60),
            font=load_font(FONT_PATH, 22),
        )

    # =============================================
    # PROGRESS BAR at bottom
    # =============================================
    if lyrics:
        total_dur = lyrics[-1]["endTime"]
        progress = min(t / total_dur, 1.0) if total_dur > 0 else 0
        bar_y = HEIGHT - 70

        # Track
        draw_rounded_rect(draw, (40, bar_y, WIDTH - 40, bar_y + 6), 3, (40, 40, 50))
        # Fill
        fill_w = int(progress * (WIDTH - 80))
        if fill_w > 6:
            draw_rounded_rect(draw, (40, bar_y, 40 + fill_w, bar_y + 6), 3, HIGHLIGHT_COLOR)
            # Knob
            draw.ellipse(
                [40 + fill_w - 8, bar_y - 5, 40 + fill_w + 8, bar_y + 11],
                fill=HIGHLIGHT_COLOR,
            )

        # Time labels
        font_time = load_font(FONT_PATH, 18)
        elapsed = f"{int(t // 60)}:{int(t % 60):02d}"
        total = f"{int(total_dur // 60)}:{int(total_dur % 60):02d}"
        draw.text((40, bar_y + 14), elapsed, fill=(120, 120, 130), font=font_time)
        tb = draw.textbbox((0, 0), total, font=font_time)
        draw.text((WIDTH - 40 - (tb[2] - tb[0]), bar_y + 14), total, fill=(120, 120, 130), font=font_time)

    return np.array(img)


def download_audio(artist, title, output_path):
    """Download audio from YouTube using yt-dlp."""
    query = f"{artist} {title}"
    print(f"Searching YouTube for: {query}")

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

    # Calculate video duration from lyrics
    video_duration = lyrics[-1]["endTime"] + 2  # 2s buffer

    if output_path is None:
        output_path = Path("out") / f"{track['artist']} - {track['title']}.mp4"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating video for: {track['artist']} - {track['title']}")
    print(f"Video duration: {video_duration}s | {len(lyrics)} lines")

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

            # Cut audio to match the verse timing
            if start_time is not None:
                end = end_time if end_time else start_time + video_duration
                end = min(end, audio_clip.duration)
                try:
                    audio_clip = audio_clip.subclipped(start_time, end)
                except AttributeError:
                    audio_clip = audio_clip.subclip(start_time, end)
                print(f"Audio cut: {start_time}s -> {end}s ({audio_clip.duration:.1f}s)")

            # Match video duration to audio duration
            video_duration = min(video_duration, audio_clip.duration)

    # Create video
    print("Rendering frames...")

    def make_frame(t):
        return render_frame(t, data)

    video = VideoClip(make_frame, duration=video_duration)

    if audio_clip:
        try:
            video = video.with_audio(audio_clip)
        except AttributeError:
            video = video.set_audio(audio_clip)

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
    print("Ready to upload to TikTok or YouTube Shorts!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate rap lyrics video")
    parser.add_argument("--data", required=True, help="Path to JSON data file")
    parser.add_argument("--output", "-o", help="Output video path")
    parser.add_argument("--start", type=float, help="Audio start time in seconds (where the verse begins)")
    parser.add_argument("--end", type=float, help="Audio end time in seconds (where the verse ends)")
    parser.add_argument("--no-audio", action="store_true", help="Generate without audio")

    args = parser.parse_args()
    generate_video(args.data, args.output, args.start, args.end, args.no_audio)
