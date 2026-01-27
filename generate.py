#!/usr/bin/env python3
"""
Rap Lyrics Video Generator — TikTok/Shorts Optimized
Generates addictive vertical videos with rap lyrics + term explanations.

Usage:
    python3 generate.py --data src/data/bande-organisee.json
    python3 generate.py --data src/data/bande-organisee.json --start 68 --end 83
"""

import json
import argparse
import subprocess
import math
import urllib.request
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter
try:
    from moviepy import VideoClip, AudioFileClip
except ImportError:
    from moviepy.editor import VideoClip, AudioFileClip
import numpy as np


# ============================================================
# CONFIG
# ============================================================
WIDTH = 1080
HEIGHT = 1920
FPS = 30

# Color palette
C_BG = (8, 8, 14)
C_WHITE = (255, 255, 255)
C_DIM = (90, 90, 110)
C_VERY_DIM = (45, 45, 60)
C_ACCENT = (255, 90, 20)        # Vibrant orange
C_ACCENT_GLOW = (255, 120, 50)
C_ACCENT2 = (255, 200, 0)       # Gold
C_CARD_BG = (16, 16, 32)
C_CARD_BORDER = (255, 90, 20, 120)
C_DIVIDER = (35, 35, 55)

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

# Layout
HEADER_TOP = 50
HEADER_H = 120
CONTENT_TOP = 200
LEFT_W = 600
DIVIDER_X = 635
RIGHT_X = 670
RIGHT_W = 370
CONTENT_BOTTOM = 1760
LINE_H = 120

# Fonts
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

_fcache = {}
def font(path, size):
    k = (path, size)
    if k not in _fcache:
        try:
            _fcache[k] = ImageFont.truetype(path, size)
        except:
            _fcache[k] = ImageFont.load_default()
    return _fcache[k]


# ============================================================
# DRAWING HELPERS
# ============================================================

def wrap(text, f, max_w, draw):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = f"{cur} {w}".strip()
        if draw.textbbox((0, 0), test, font=f)[2] <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def rrect(draw, xy, r, fill):
    x1, y1, x2, y2 = xy
    draw.rectangle([x1+r, y1, x2-r, y2], fill=fill)
    draw.rectangle([x1, y1+r, x2, y2-r], fill=fill)
    draw.pieslice([x1, y1, x1+2*r, y1+2*r], 180, 270, fill=fill)
    draw.pieslice([x2-2*r, y1, x2, y1+2*r], 270, 360, fill=fill)
    draw.pieslice([x1, y2-2*r, x1+2*r, y2], 90, 180, fill=fill)
    draw.pieslice([x2-2*r, y2-2*r, x2, y2], 0, 90, fill=fill)


def ease_out(t):
    return 1 - (1 - min(max(t, 0), 1)) ** 3


def lerp(a, b, t):
    return a + (b - a) * min(max(t, 0), 1)


# ============================================================
# BACKGROUND
# ============================================================

_bg_cache = {}

def make_background(cover_path=None):
    """Create a dark background with optional blurred album cover."""
    key = cover_path or "_default_"
    if key in _bg_cache:
        return _bg_cache[key].copy()

    bg = Image.new("RGB", (WIDTH, HEIGHT), C_BG)

    if cover_path and os.path.exists(cover_path):
        try:
            cover = Image.open(cover_path).convert("RGB")
            cover = cover.resize((WIDTH, HEIGHT), Image.LANCZOS)
            cover = cover.filter(ImageFilter.GaussianBlur(radius=40))
            # Darken heavily
            dark = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
            bg = Image.blend(cover, dark, 0.70)
        except:
            pass

    # Add subtle gradient overlay
    draw = ImageDraw.Draw(bg)
    for y in range(HEIGHT):
        f = y / HEIGHT
        # Top: slightly lighter, bottom: darker
        alpha = int(lerp(20, 0, f) if f < 0.3 else lerp(0, 40, (f - 0.3) / 0.7))
        draw.line([(0, y), (WIDTH, y)], fill=(alpha, alpha, alpha + 5))

    _bg_cache[key] = bg.copy()
    return bg


# ============================================================
# COUNT ALL TERMS IN LYRICS
# ============================================================

def count_total_terms(lyrics):
    return sum(len(line.get("terms", [])) for line in lyrics)


def count_revealed_terms(lyrics, t):
    count = 0
    for line in lyrics:
        if t >= line["startTime"] and line.get("terms"):
            lp = (t - line["startTime"]) / max(line["endTime"] - line["startTime"], 0.1)
            for idx, term in enumerate(line["terms"]):
                appear = 0.15 + idx * (0.6 / max(len(line["terms"]), 1))
                if lp >= appear:
                    count += 1
        elif t >= line["endTime"] and line.get("terms"):
            count += len(line["terms"])
    return count


# ============================================================
# HOOK SCREEN (First 2.5 seconds)
# ============================================================

def render_hook(t, data, bg_img):
    """Render the hook screen that appears in the first seconds."""
    img = bg_img.copy()
    draw = ImageDraw.Draw(img)

    hook = data.get("hook", {})
    hook_term = hook.get("term", "")
    hook_line = hook.get("line", "")
    track = data["track"]

    # Pulsing glow effect
    pulse = 0.7 + 0.3 * math.sin(t * 6)
    glow_r = int(C_ACCENT[0] * pulse)
    glow_g = int(C_ACCENT[1] * pulse)

    # "SAIS-TU CE QUE VEUT DIRE..."
    f1 = font(FONT_REG, 32)
    txt1 = "SAIS-TU CE QUE VEUT DIRE..."
    bbox = draw.textbbox((0, 0), txt1, font=f1)
    x = (WIDTH - bbox[2]) // 2
    draw.text((x, HEIGHT // 2 - 160), txt1, fill=C_DIM, font=f1)

    # THE HOOK TERM — big, glowing
    f2 = font(FONT_BOLD, 72)
    bbox2 = draw.textbbox((0, 0), hook_term, font=f2)
    x2 = (WIDTH - bbox2[2]) // 2
    y2 = HEIGHT // 2 - 70

    # Glow layers
    for i in range(4, 0, -1):
        glow_color = (glow_r // (i + 1), glow_g // (i + 1), 0)
        draw.text((x2, y2), hook_term, fill=glow_color, font=f2)
    draw.text((x2, y2), hook_term, fill=C_ACCENT, font=f2)

    # Question mark animated
    f3 = font(FONT_BOLD, 80)
    scale_t = ease_out(t * 2) if t < 1 else 1
    draw.text((x2 + bbox2[2] + 10, y2 - 5), "?", fill=C_ACCENT2, font=f3)

    # Line preview below
    if hook_line:
        f4 = font(FONT_REG, 26)
        lines = wrap(f'« {hook_line} »', f4, WIDTH - 120, draw)
        for j, ln in enumerate(lines):
            bbox_l = draw.textbbox((0, 0), ln, font=f4)
            draw.text(
                ((WIDTH - bbox_l[2]) // 2, HEIGHT // 2 + 60 + j * 36),
                ln, fill=C_VERY_DIM, font=f4
            )

    # Artist/title at bottom
    f5 = font(FONT_BOLD, 28)
    f6 = font(FONT_REG, 24)
    art = track["artist"]
    ttl = track["title"]
    bbox_a = draw.textbbox((0, 0), art, font=f5)
    bbox_t = draw.textbbox((0, 0), ttl, font=f6)
    draw.text(((WIDTH - bbox_a[2]) // 2, HEIGHT - 200), art, fill=C_ACCENT, font=f5)
    draw.text(((WIDTH - bbox_t[2]) // 2, HEIGHT - 160), ttl, fill=C_DIM, font=f6)

    # "Swipe up" / progress hint
    fade_in = min(1, t / 2)
    hint_alpha = int(180 * fade_in * pulse)
    f7 = font(FONT_REG, 22)
    htxt = f"{count_total_terms(data['lyrics'])} termes à décrypter"
    bbox_h = draw.textbbox((0, 0), htxt, font=f7)
    draw.text(
        ((WIDTH - bbox_h[2]) // 2, HEIGHT - 110),
        htxt, fill=(hint_alpha, hint_alpha, hint_alpha), font=f7
    )

    return np.array(img)


# ============================================================
# MAIN VIDEO FRAME
# ============================================================

def render_frame(t, data, bg_img):
    img = bg_img.copy()
    draw = ImageDraw.Draw(img)

    track = data["track"]
    lyrics = data["lyrics"]
    hook_duration = data.get("hook", {}).get("duration", 2.5)

    # Adjust time for lyrics (offset by hook duration)
    lt = t - hook_duration  # lyrics time
    if lt < 0:
        return render_hook(t, data, bg_img)

    total_terms = count_total_terms(lyrics)
    revealed = count_revealed_terms(lyrics, lt)

    # ── HEADER ──────────────────────────────────────────────
    # Background bar with glassmorphism effect
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ov = ImageDraw.Draw(overlay)
    rrect(ov, (30, HEADER_TOP, WIDTH - 30, HEADER_TOP + HEADER_H), 16, (15, 15, 28, 220))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Accent stripe
    draw.rectangle([30, HEADER_TOP, 36, HEADER_TOP + HEADER_H], fill=C_ACCENT)

    # Artist
    draw.text((56, HEADER_TOP + 18), track["artist"], fill=C_ACCENT, font=font(FONT_BOLD, 34))
    # Title
    draw.text((56, HEADER_TOP + 60), track["title"], fill=(170, 170, 185), font=font(FONT_REG, 26))

    # Terms counter badge (top right)
    badge_txt = f"{revealed}/{total_terms}"
    f_badge = font(FONT_BOLD, 22)
    bb = draw.textbbox((0, 0), badge_txt, font=f_badge)
    bw = bb[2] - bb[0] + 30
    bx = WIDTH - 60 - bw
    by = HEADER_TOP + 20
    rrect(draw, (bx, by, bx + bw, by + 36), 18, C_ACCENT)
    draw.text((bx + 15, by + 5), badge_txt, fill=C_WHITE, font=f_badge)

    # Small label
    draw.text((bx + 2, by + 42), "décryptés", fill=C_DIM, font=font(FONT_REG, 16))

    # ── DIVIDER ─────────────────────────────────────────────
    # Dotted vertical line
    for y in range(CONTENT_TOP, CONTENT_BOTTOM, 12):
        draw.rectangle([DIVIDER_X, y, DIVIDER_X + 2, y + 6], fill=C_DIVIDER)

    # ── LEFT: LYRICS (Spotify scroll) ──────────────────────
    active_idx = -1
    for i, line in enumerate(lyrics):
        if line["startTime"] <= lt < line["endTime"]:
            active_idx = i
            break
    if active_idx == -1:
        for i, line in enumerate(lyrics):
            if lt >= line["endTime"]:
                active_idx = i

    center_y = (CONTENT_TOP + CONTENT_BOTTOM) // 2 - 40

    if active_idx >= 0:
        line = lyrics[active_idx]
        lp = (lt - line["startTime"]) / max(line["endTime"] - line["startTime"], 0.1)
        lp = min(max(lp, 0), 1)
        target = center_y - active_idx * LINE_H
        if active_idx < len(lyrics) - 1 and lp > 0.8:
            nxt = center_y - (active_idx + 1) * LINE_H
            scroll = target + (nxt - target) * ease_out((lp - 0.8) / 0.2)
        else:
            scroll = target
    else:
        scroll = center_y

    for i, line in enumerate(lyrics):
        y = int(scroll + i * LINE_H)
        if y < CONTENT_TOP - 80 or y > CONTENT_BOTTOM + 50:
            continue

        # Edge fade
        ef = 1.0
        if y < CONTENT_TOP + 60:
            ef = max(0, (y - CONTENT_TOP) / 60)
        elif y > CONTENT_BOTTOM - 60:
            ef = max(0, (CONTENT_BOTTOM - y) / 60)

        is_active = (i == active_idx)
        is_past = (i < active_idx) if active_idx >= 0 else False

        if is_active:
            # ── Active line: bright with glow ──
            f_act = font(FONT_BOLD, 34)
            wrapped = wrap(line["text"], f_act, LEFT_W - 60, draw)

            # Glow background behind text
            glow_h = len(wrapped) * 44 + 20
            overlay2 = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
            ov2 = ImageDraw.Draw(overlay2)
            rrect(ov2, (20, y - 10, LEFT_W + 10, y + glow_h), 12,
                  (C_ACCENT[0], C_ACCENT[1], C_ACCENT[2], 18))
            img = Image.alpha_composite(img.convert("RGBA"), overlay2).convert("RGB")
            draw = ImageDraw.Draw(img)

            # Accent dot
            pulse = 0.7 + 0.3 * math.sin(lt * 8)
            dot_r = int(7 * pulse)
            cx, cy = 30, y + 14
            draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=C_ACCENT)

            for j, wl in enumerate(wrapped):
                c = tuple(int(255 * ef) for _ in range(3))
                draw.text((50, y + j * 44), wl, fill=c, font=f_act)

            # Progress underline
            if wrapped:
                ul_y = y + len(wrapped) * 44 + 4
                bar_w = int(lp * (LEFT_W - 80))
                if bar_w > 0:
                    draw.rectangle([50, ul_y, 50 + bar_w, ul_y + 3], fill=C_ACCENT)

        else:
            # ── Inactive line ──
            opacity = 0.35 if is_past else 0.25
            gray = int(255 * ef * opacity)
            c = (gray, gray, int(gray * 1.1))
            f_dim = font(FONT_REG, 30)
            wrapped = wrap(line["text"], f_dim, LEFT_W - 40, draw)
            for j, wl in enumerate(wrapped):
                draw.text((50, y + j * 38), wl, fill=c, font=f_dim)

    # ── RIGHT: EXPLANATIONS ─────────────────────────────────
    active_line = lyrics[active_idx] if 0 <= active_idx < len(lyrics) else None

    if active_line and active_line.get("showExplanation") and active_line.get("terms"):
        terms = active_line["terms"]
        line_data = active_line
        lp = (lt - line_data["startTime"]) / max(line_data["endTime"] - line_data["startTime"], 0.1)
        lp = min(max(lp, 0), 1)

        # Section header
        hy = CONTENT_TOP + 10
        draw.text((RIGHT_X, hy), "DÉCRYPTAGE", fill=C_ACCENT, font=font(FONT_BOLD, 18))
        # Gradient underline
        for x in range(RIGHT_X, RIGHT_X + 130):
            fade = 1 - (x - RIGHT_X) / 130
            c = tuple(int(v * fade) for v in C_ACCENT)
            draw.line([(x, hy + 24), (x, hy + 26)], fill=c)

        card_y = hy + 50

        for idx, term in enumerate(terms):
            appear = 0.15 + idx * (0.6 / max(len(terms), 1))
            if lp < appear:
                continue

            fade = min(1.0, (lp - appear) * 5)
            slide = int((1 - ease_out(fade)) * 25)
            cy = card_y + idx * 180 + slide

            if cy + 160 > CONTENT_BOTTOM:
                continue

            # Card with glass effect
            overlay3 = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
            ov3 = ImageDraw.Draw(overlay3)
            a = int(210 * fade)
            rrect(ov3, (RIGHT_X, cy, RIGHT_X + RIGHT_W, cy + 155), 14,
                  (*C_CARD_BG, a))
            # Left accent bar
            ov3.rectangle([RIGHT_X, cy + 12, RIGHT_X + 4, cy + 143],
                         fill=(C_ACCENT[0], C_ACCENT[1], C_ACCENT[2], int(255 * fade)))
            # Top glow line
            for x in range(RIGHT_X, RIGHT_X + RIGHT_W):
                gf = 1 - abs(x - (RIGHT_X + RIGHT_W // 2)) / (RIGHT_W // 2)
                ov3.point((x, cy), fill=(C_ACCENT[0], C_ACCENT[1], C_ACCENT[2], int(40 * gf * fade)))

            img = Image.alpha_composite(img.convert("RGBA"), overlay3).convert("RGB")
            draw = ImageDraw.Draw(img)

            if fade > 0.2:
                ta = min(1.0, (fade - 0.2) * 2.5)

                # Category pill
                cat = term.get("category", "other")
                cat_c = CATEGORY_COLORS.get(cat, CATEGORY_COLORS["other"])
                cat_t = CATEGORY_LABELS.get(cat, "—")
                f_cat = font(FONT_BOLD, 14)
                cb = draw.textbbox((0, 0), cat_t, font=f_cat)
                cw = cb[2] + 18
                rrect(draw, (RIGHT_X + 16, cy + 12, RIGHT_X + 16 + cw, cy + 32), 8, cat_c)
                draw.text((RIGHT_X + 25, cy + 13), cat_t, fill=C_WHITE, font=f_cat)

                # Term name
                tc = int(255 * ta)
                draw.text((RIGHT_X + 16, cy + 42),
                         term["term"],
                         fill=(min(tc, C_ACCENT[0]), min(tc, C_ACCENT[1]), min(tc, C_ACCENT[2])),
                         font=font(FONT_BOLD, 26))

                # Definition
                f_def = font(FONT_REG, 20)
                dlines = wrap(term["definition"], f_def, RIGHT_W - 32, draw)
                g = int(190 * ta)
                for j, dl in enumerate(dlines):
                    dy = cy + 80 + j * 26
                    if dy < cy + 145:
                        draw.text((RIGHT_X + 16, dy), dl, fill=(g, g, g), font=f_def)

    elif active_line and not active_line.get("terms"):
        my = (CONTENT_TOP + CONTENT_BOTTOM) // 2 - 30
        draw.text((RIGHT_X + 20, my), "Aucun terme", fill=C_VERY_DIM, font=font(FONT_REG, 22))
        draw.text((RIGHT_X + 20, my + 30), "à décrypter", fill=C_VERY_DIM, font=font(FONT_REG, 22))

    # ── BOTTOM: Progress bar ────────────────────────────────
    total_dur = lyrics[-1]["endTime"]
    progress = min(lt / total_dur, 1.0) if total_dur > 0 else 0
    bar_y = HEIGHT - 80

    # Track bg
    rrect(draw, (50, bar_y, WIDTH - 50, bar_y + 5), 2, (30, 30, 45))
    # Fill
    fw = int(progress * (WIDTH - 100))
    if fw > 4:
        rrect(draw, (50, bar_y, 50 + fw, bar_y + 5), 2, C_ACCENT)
        # Knob with glow
        kx = 50 + fw
        for r in range(12, 5, -1):
            a = 30 * (13 - r)
            draw.ellipse([kx - r, bar_y - r + 2, kx + r, bar_y + r + 2],
                        fill=(min(a, C_ACCENT[0]), min(a, C_ACCENT[1]), 0))
        draw.ellipse([kx - 6, bar_y - 4, kx + 6, bar_y + 8], fill=C_ACCENT)

    # Time labels
    f_time = font(FONT_REG, 17)
    elapsed = f"{int(lt // 60)}:{int(lt % 60):02d}"
    total = f"{int(total_dur // 60)}:{int(total_dur % 60):02d}"
    draw.text((50, bar_y + 12), elapsed, fill=C_DIM, font=f_time)
    tb = draw.textbbox((0, 0), total, font=f_time)
    draw.text((WIDTH - 50 - tb[2], bar_y + 12), total, fill=C_DIM, font=f_time)

    # Completion percentage (center)
    pct = f"{int(progress * 100)}%"
    pb = draw.textbbox((0, 0), pct, font=f_time)
    draw.text(((WIDTH - pb[2]) // 2, bar_y + 12), pct, fill=C_ACCENT, font=f_time)

    return np.array(img)


# ============================================================
# AUDIO DOWNLOAD
# ============================================================

def download_audio(artist, title, output_path):
    query = f"{artist} {title}"
    print(f"Searching YouTube: {query}")
    cmd = [
        "yt-dlp", f"ytsearch1:{query}",
        "-x", "--audio-format", "mp3", "--audio-quality", "0",
        "-o", str(output_path), "--no-playlist", "--quiet",
    ]
    try:
        subprocess.run(cmd, check=True, timeout=120)
        if not output_path.exists():
            for ext in [".mp3", ".m4a", ".webm", ".opus"]:
                p = output_path.with_suffix(ext)
                if p.exists():
                    return p
        return output_path
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Audio download error: {e}")
        return None


def download_cover(url, output_path):
    """Download album cover image."""
    try:
        urllib.request.urlretrieve(url, str(output_path))
        print(f"Cover downloaded: {output_path}")
        return output_path
    except Exception as e:
        print(f"Cover download error: {e}")
        return None


# ============================================================
# MAIN GENERATION
# ============================================================

def generate_video(data_path, output_path=None, start_time=None, end_time=None, no_audio=False):
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    track = data["track"]
    lyrics = data["lyrics"]
    hook = data.get("hook", {})
    hook_duration = hook.get("duration", 2.5)

    if not lyrics:
        print("Error: No lyrics")
        return

    # Video duration = hook + lyrics + buffer
    video_duration = hook_duration + lyrics[-1]["endTime"] + 2

    if output_path is None:
        output_path = Path("out") / f"{track['artist']} - {track['title']}.mp4"
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"=== Rap Lyrics Video Generator ===")
    print(f"Track: {track['artist']} — {track['title']}")
    print(f"Duration: {video_duration:.1f}s (hook: {hook_duration}s + lyrics: {lyrics[-1]['endTime']}s)")
    print(f"Terms: {count_total_terms(lyrics)}")

    # Download cover if URL provided
    cover_path = None
    if track.get("coverImage"):
        ci = track["coverImage"]
        if ci.startswith("http"):
            cover_path = Path("out") / "covers" / f"{track['artist']}.jpg"
            cover_path.parent.mkdir(parents=True, exist_ok=True)
            if not cover_path.exists():
                download_cover(ci, cover_path)
        elif os.path.exists(ci):
            cover_path = Path(ci)

    # Pre-render background
    print("Building background...")
    bg_img = make_background(str(cover_path) if cover_path else None)

    # Download audio
    audio_clip = None
    if not no_audio:
        audio_path = Path("out") / "audio" / f"{track['artist']} - {track['title']}.mp3"
        audio_path.parent.mkdir(parents=True, exist_ok=True)

        if not audio_path.exists():
            print("Downloading audio...")
            actual = download_audio(track["artist"], track["title"], audio_path)
            if actual:
                audio_path = actual
                print(f"Audio: {audio_path}")
            else:
                print("No audio found. Continuing without audio.")
        else:
            print(f"Audio cached: {audio_path}")

        if audio_path.exists():
            audio_clip = AudioFileClip(str(audio_path))
            if start_time is not None:
                end = end_time if end_time else start_time + video_duration
                end = min(end, audio_clip.duration)
                try:
                    audio_clip = audio_clip.subclipped(start_time, end)
                except AttributeError:
                    audio_clip = audio_clip.subclip(start_time, end)
                print(f"Audio cut: {start_time}s → {end}s")

                # Prepend silence for hook duration
                # (hook plays over the start of the audio)
                video_duration = min(video_duration, hook_duration + audio_clip.duration)

    print("Rendering frames...")

    def make_frame(t):
        return render_frame(t, data, bg_img)

    video = VideoClip(make_frame, duration=video_duration)

    if audio_clip:
        # Offset audio to start after hook
        try:
            video = video.with_audio(audio_clip)
        except AttributeError:
            video = video.set_audio(audio_clip)

    print(f"Exporting → {output_path}")
    video.write_videofile(
        str(output_path),
        fps=FPS,
        codec="libx264",
        audio_codec="aac" if audio_clip else None,
        preset="medium",
        threads=4,
        logger="bar",
    )

    print(f"\n✅ Video saved: {output_path}")
    print(f"📱 Ready for TikTok / YouTube Shorts!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Rap Lyrics Video Generator")
    parser.add_argument("--data", required=True, help="JSON data file path")
    parser.add_argument("--output", "-o", help="Output video path")
    parser.add_argument("--start", type=float, help="Audio start time (seconds)")
    parser.add_argument("--end", type=float, help="Audio end time (seconds)")
    parser.add_argument("--no-audio", action="store_true", help="Skip audio")
    args = parser.parse_args()
    generate_video(args.data, args.output, args.start, args.end, args.no_audio)
