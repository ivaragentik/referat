#!/usr/bin/env python3
"""
Referat — app icon generator
Produces: frontend/src-tauri/icons/referat-master-1024.png

Design:
  - 1024×1024 canvas
  - Deep Norwegian blue (#00205B) rounded-square background (superellipse ~22% radius)
  - Subtle vertical gradient (slightly lighter top) for depth
  - Bold white geometric "R" centered, ~58% of canvas height
  - Small red (#BA0C2F) filled circle at the foot/leg terminal of the R
  - No other text, no random decorations
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SIZE = 1024
BG_COLOR_TOP    = (0, 36, 99)    # #002463 — slightly lighter than base
BG_COLOR_BOTTOM = (0, 32, 91)    # #00205B — base Norwegian blue
WHITE           = (255, 255, 255)
RED_DOT         = (186, 12, 47)  # #BA0C2F

FONT_PATH  = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_INDEX = 1  # Bold

OUT_PATH = os.path.join(
    os.path.dirname(__file__),
    "../src-tauri/icons/referat-master-1024.png"
)


def superellipse_mask(size: int, radius_frac: float = 0.22) -> Image.Image:
    """
    Return a greyscale mask with a smooth rounded-rectangle (superellipse-ish).
    Uses a simple anti-aliased drawing approach on a 4× oversampled canvas.
    """
    OVER = 4
    big = size * OVER
    r = int(radius_frac * big)
    mask = Image.new("L", (big, big), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, big - 1, big - 1], radius=r, fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    return mask


def make_gradient(size: int) -> Image.Image:
    """Vertical linear gradient from BG_COLOR_TOP to BG_COLOR_BOTTOM."""
    img = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        r = int(BG_COLOR_TOP[0] + t * (BG_COLOR_BOTTOM[0] - BG_COLOR_TOP[0]))
        g = int(BG_COLOR_TOP[1] + t * (BG_COLOR_BOTTOM[1] - BG_COLOR_TOP[1]))
        b = int(BG_COLOR_TOP[2] + t * (BG_COLOR_BOTTOM[2] - BG_COLOR_TOP[2]))
        draw.line([(0, y), (size - 1, y)], fill=(r, g, b))
    return img


def render_icon() -> Image.Image:
    # ── 1. Background ────────────────────────────────────────────────────────
    canvas = make_gradient(SIZE)

    # ── 2. Apply rounded-rect mask ───────────────────────────────────────────
    mask = superellipse_mask(SIZE, radius_frac=0.22)
    bg_rgba = canvas.convert("RGBA")
    alpha = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    bg_rgba.putalpha(mask)

    # Final RGBA image on transparent base
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    img.paste(bg_rgba, (0, 0), bg_rgba)

    draw = ImageDraw.Draw(img)

    # ── 3. "R" letter ────────────────────────────────────────────────────────
    # Target: letter height ≈ 58% of SIZE  →  ~593 px
    TARGET_HEIGHT_PX = int(SIZE * 0.58)

    font_size = TARGET_HEIGHT_PX  # PIL font-size ≈ em height; we'll calibrate
    font = ImageFont.truetype(FONT_PATH, size=font_size, index=FONT_INDEX)

    # Measure actual bounding box
    bbox = font.getbbox("R")          # (left, top, right, bottom) relative to origin
    letter_w = bbox[2] - bbox[0]
    letter_h = bbox[3] - bbox[1]

    # Scale so height = TARGET_HEIGHT_PX
    scale = TARGET_HEIGHT_PX / letter_h
    font_size = int(font_size * scale)
    font = ImageFont.truetype(FONT_PATH, size=font_size, index=FONT_INDEX)

    # Re-measure after scaling
    bbox = font.getbbox("R")
    letter_w = bbox[2] - bbox[0]
    letter_h = bbox[3] - bbox[1]

    # Optically center: PIL origin is top-left of em square; bbox[0]/bbox[1] are offsets
    # We want the visible glyph centered in the square icon
    cx = SIZE // 2
    cy = SIZE // 2

    # Position so visible glyph center aligns with canvas center
    text_x = cx - bbox[0] - letter_w // 2
    text_y = cy - bbox[1] - letter_h // 2

    # Draw white R
    draw.text((text_x, text_y), "R", font=font, fill=WHITE)

    # ── 4. Red circle accent ─────────────────────────────────────────────────
    # The red dot sits at the foot/leg terminal of the R.
    # For Helvetica Neue Bold "R":
    #   – The leg (lower-right diagonal stroke) terminates near the bottom-right
    #     of the glyph, roughly x ~ rightmost extent, y ~ 95% down the letter
    # We place the dot at the tip of the leg, radius ~ 3.5% of SIZE

    dot_r  = int(SIZE * 0.035)   # ~36 px

    # Foot of the R's leg — heuristic for HN Bold
    # leg tip X: near rightmost extent of glyph
    # leg tip Y: bottom of visible glyph (the leg ends near the baseline)
    arm_x = text_x + bbox[0] + int(letter_w * 0.97)   # near right edge
    arm_y = text_y + bbox[1] + int(letter_h * 0.95)    # ~95% down the letter

    # Centre the dot on the leg tip
    dot_cx = arm_x
    dot_cy = arm_y

    dot_bbox = [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r]
    draw.ellipse(dot_bbox, fill=RED_DOT)

    return img


def main():
    out_path = os.path.abspath(OUT_PATH)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    img = render_icon()
    img.save(out_path, "PNG", optimize=False)
    print(f"Saved: {out_path}  ({img.width}×{img.height})")

    # Quick sanity checks
    loaded = Image.open(out_path)
    assert loaded.size == (SIZE, SIZE), f"Wrong size: {loaded.size}"
    # Check a center pixel is whitish (the R center-stroke should be white or near-white)
    print(f"Center pixel: {loaded.getpixel((SIZE//2, SIZE//2))}")
    print("Sanity checks passed.")


if __name__ == "__main__":
    main()
