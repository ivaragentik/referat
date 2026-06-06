#!/usr/bin/env python3
"""Generate the Referat DMG installer background (660x420, drawn at 2x)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 660, 420
S = 2  # supersample
NAVY = (32, 37, 45, 255)
NAVY_SOFT = (32, 37, 45, 200)
CREAM = (254, 249, 249, 255)

img = Image.new("RGBA", (W * S, H * S), CREAM)
d = ImageDraw.Draw(img)


def font(size, idx=1):
    return ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", size * S, index=idx)


# Wordmark + tagline, top center
title = "REFERAT"
f_title = font(34)
tw = d.textlength(title, font=f_title)
d.text(((W * S - tw) / 2, 48 * S), title, font=f_title, fill=NAVY)

tag = "Dra Referat til Programmer for å installere"
f_tag = font(15, idx=0)
tw2 = d.textlength(tag, font=f_tag)
d.text(((W * S - tw2) / 2, 100 * S), tag, font=f_tag, fill=NAVY_SOFT)

# Arrow between icon positions (icons sit at y≈230, x≈180 and x≈480)
y = 238 * S
x0, x1 = 268 * S, 392 * S
d.line([(x0, y), (x1 - 14 * S, y)], fill=NAVY, width=6 * S)
d.polygon([(x1, y), (x1 - 22 * S, y - 13 * S), (x1 - 22 * S, y + 13 * S)], fill=NAVY)

# Footer
foot = "Ingen bot. Ingen sky. Ingen regning.  ·  av Agentik"
f_foot = font(12, idx=0)
tw3 = d.textlength(foot, font=f_foot)
d.text(((W * S - tw3) / 2, 382 * S), foot, font=f_foot, fill=NAVY_SOFT)

img = img.resize((W, H), Image.LANCZOS)
out = "src-tauri/dmg-background.png"
img.convert("RGB").save(out)
print(f"wrote {out} ({W}x{H})")
