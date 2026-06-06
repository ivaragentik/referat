#!/usr/bin/env python3
"""Referat GitHub social-preview card — 1280x640 (2:1), drawn at 2x then downsampled."""
import importlib.util as ilu, os
from PIL import Image, ImageDraw, ImageFont

W, H, S = 1280, 640, 2
NAVY = (32, 37, 45, 255)
NAVY_SOFT = (32, 37, 45, 235)
GREY = (32, 37, 45, 150)
CREAM = (254, 249, 249, 255)
RED = (186, 12, 47, 255)

img = Image.new("RGBA", (W * S, H * S), CREAM)
d = ImageDraw.Draw(img)


def font(size, idx=1):
    return ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", size * S, index=idx)


# --- the R mark (reuse the real icon geometry, transparent bg) ---
spec = ilu.spec_from_file_location("genicon", os.path.join(os.path.dirname(__file__), "generate-icon.py"))
gi = ilu.module_from_spec(spec)
spec.loader.exec_module(gi)
mark = gi.render_icon(background="transparent").resize((250 * S, 250 * S), Image.LANCZOS)
img.paste(mark, (110 * S, 90 * S), mark)

# --- wordmark + tagline (right of the mark) ---
tx = 410 * S
d.text((tx, 150 * S), "Referat", font=font(96), fill=NAVY)
d.text((tx + 4 * S, 270 * S), "Møtenotater på norsk — helt lokalt.", font=font(30, idx=0), fill=NAVY_SOFT)

# --- feature row (icons via simple glyphs + text) ---
feats = ["Ingen bot i møtene", "100 % lokalt på din Mac", "Gratis og åpen kildekode"]
fy = 340 * S
fx = tx + 4 * S
ff = font(22, idx=0)
for i, t in enumerate(feats):
    # red dot bullet
    cy = fy + i * 42 * S
    d.ellipse([fx, cy + 6 * S, fx + 14 * S, cy + 20 * S], fill=RED)
    d.text((fx + 28 * S, cy), t, font=ff, fill=NAVY_SOFT)

# --- bottom strip: tagline left, agentik right ---
strip_y = H * S - 86 * S
d.rectangle([0, strip_y, W * S, H * S], fill=NAVY)
d.text((70 * S, strip_y + 26 * S), "Ingen bot. Ingen sky. Ingen regning.", font=font(26), fill=CREAM)
right = "av agentik"
rf = font(26)
rw = d.textlength(right, font=rf)
d.text((W * S - rw - 70 * S, strip_y + 26 * S), right, font=rf, fill=(254, 249, 249, 200))

img = img.resize((W, H), Image.LANCZOS)
out = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "..", "..", "..", "referat-social-preview.png")
out = os.path.abspath(out)
img.convert("RGB").save(out, quality=95)
print(f"wrote {out} ({W}x{H})")
