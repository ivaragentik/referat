#!/usr/bin/env python3
"""Composite raw browser screenshots into macOS-window product shots.

For each PNG in <raw_dir>, draw a light-grey title bar (~28 logical px) with the
three macOS traffic-light dots top-left, round the window corners, add a soft
drop shadow on a transparent canvas, and write the framed result to <out_dir>.

This mirrors the rounded-corner + shadow approach in capture-shot.py, but ALSO
synthesizes the window chrome (title bar + traffic lights) that browser content
lacks — so each shot reads as a native macOS app window.

Usage:
  compose.py <raw_dir> <out_dir>
Run with the capture venv python (has Pillow):
  ~/Notater/.capture-venv/bin/python compose.py raw ~/Desktop/referat-marketing
"""
import os
import sys
import glob
from PIL import Image, ImageDraw, ImageFilter

RAW_DIR = sys.argv[1] if len(sys.argv) > 1 else "raw"
OUT_DIR = sys.argv[2] if len(sys.argv) > 2 else os.path.expanduser("~/Desktop/referat-marketing")

# Logical-pixel design constants (multiplied by the retina scale of each shot).
TITLEBAR_H = 28        # title bar height
RADIUS = 12            # window corner radius
SHADOW_BLUR = 48       # gaussian blur radius for the drop shadow
SHADOW_OPACITY = 80    # 0..255 alpha of the shadow shape before blur
SHADOW_DY = 10         # shadow vertical offset
MARGIN = 80            # transparent breathing room around the window

TITLEBAR_COLOR = (236, 236, 236, 255)      # #ECECEC
TITLEBAR_BORDER = (216, 216, 216, 255)     # subtle bottom divider
DOT_RED = (255, 95, 87, 255)               # #FF5F57
DOT_YELLOW = (254, 188, 46, 255)           # #FEBC2E
DOT_GREEN = (40, 200, 64, 255)             # #28C840
SHADOW_COLOR = (10, 12, 18)


def detect_scale(width: int) -> int:
    """Recover the retina scale factor from the known 1100 logical width."""
    return max(1, round(width / 1100))


def rounded_mask(size, radius) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size[0], size[1]], radius=radius, fill=255)
    return mask


def frame_one(src_path: str, out_path: str) -> str:
    content = Image.open(src_path).convert("RGBA")
    cw, ch = content.size
    scale = detect_scale(cw)

    tb = TITLEBAR_H * scale
    r = RADIUS * scale

    # ── Window = title bar + content stacked vertically ──────────────────────
    win_w, win_h = cw, ch + tb
    window = Image.new("RGBA", (win_w, win_h), (255, 255, 255, 255))

    # Title bar background + bottom divider.
    draw = ImageDraw.Draw(window)
    draw.rectangle([0, 0, win_w, tb], fill=TITLEBAR_COLOR)
    draw.line([(0, tb - 1), (win_w, tb - 1)], fill=TITLEBAR_BORDER, width=1)

    # Traffic lights: three dots, vertically centred in the title bar.
    dot_d = int(12 * scale)
    gap = int(8 * scale)
    left = int(20 * scale)
    cy = tb // 2
    for i, color in enumerate((DOT_RED, DOT_YELLOW, DOT_GREEN)):
        x0 = left + i * (dot_d + gap)
        y0 = cy - dot_d // 2
        draw.ellipse([x0, y0, x0 + dot_d, y0 + dot_d], fill=color)

    # Place content below the title bar.
    window.alpha_composite(content, (0, tb))

    # Round the whole window's corners.
    window.putalpha(rounded_mask((win_w, win_h), r))

    # ── Canvas with transparent margin + soft drop shadow ────────────────────
    m = MARGIN * scale
    canvas = Image.new("RGBA", (win_w + 2 * m, win_h + 2 * m), (0, 0, 0, 0))

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_shape = Image.new("L", (win_w, win_h), 0)
    ImageDraw.Draw(shadow_shape).rounded_rectangle(
        [0, 0, win_w, win_h], radius=r, fill=SHADOW_OPACITY
    )
    shadow.paste(SHADOW_COLOR + (255,), (m, m + SHADOW_DY * scale), shadow_shape)
    shadow = shadow.filter(ImageFilter.GaussianBlur(SHADOW_BLUR * scale / 2))

    canvas = Image.alpha_composite(canvas, shadow)
    canvas.alpha_composite(window, (m, m))

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.save(out_path)
    return f"{os.path.basename(out_path)}  ({canvas.size[0]}x{canvas.size[1]}, {scale}x)"


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    srcs = sorted(glob.glob(os.path.join(RAW_DIR, "*.png")))
    if not srcs:
        sys.exit(f"No PNGs found in {RAW_DIR}")
    for src in srcs:
        name = os.path.basename(src)
        out = os.path.join(OUT_DIR, name)
        print("  ✓ " + frame_one(src, out))
    print(f"\nFramed {len(srcs)} shots into {OUT_DIR}")


if __name__ == "__main__":
    main()
