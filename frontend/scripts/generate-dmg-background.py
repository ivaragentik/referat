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


# Brand lockup: mark + REFERAT + «av agentik» (mirrors the official logo)
import importlib.util as _ilu
import os as _os

_spec = _ilu.spec_from_file_location(
    "genicon", _os.path.join(_os.path.dirname(__file__), "generate-icon.py")
)
_gi = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_gi)
mark = _gi.render_icon(background="transparent")  # navy mark, transparent bg
mark = mark.resize((52 * S, 52 * S), Image.LANCZOS)
img.paste(mark, ((W * S - 52 * S) // 2, 22 * S), mark)

title = "REFERAT"
f_title = font(32)
tw = d.textlength(title, font=f_title)
d.text(((W * S - tw) / 2, 80 * S), title, font=f_title, fill=NAVY)

by = "av agentik"
f_by = font(16)
tw_by = d.textlength(by, font=f_by)
d.text(((W * S - tw_by) / 2, 122 * S), by, font=f_by, fill=NAVY)

tag = "Dra Referat til Programmer for å installere"
f_tag = font(14, idx=0)
tw2 = d.textlength(tag, font=f_tag)
d.text(((W * S - tw2) / 2, 156 * S), tag, font=f_tag, fill=NAVY_SOFT)

# Arrow between icon positions (icons sit at y≈230, x≈180 and x≈480)
y = 238 * S
x0, x1 = 268 * S, 392 * S
d.line([(x0, y), (x1 - 14 * S, y)], fill=NAVY, width=6 * S)
d.polygon([(x1, y), (x1 - 22 * S, y - 13 * S), (x1 - 22 * S, y + 13 * S)], fill=NAVY)

# Footer
foot = "Ingen bot. Ingen sky. Ingen regning.  ·  agentik.no"
f_foot = font(12, idx=0)
tw3 = d.textlength(foot, font=f_foot)
d.text(((W * S - tw3) / 2, 382 * S), foot, font=f_foot, fill=NAVY_SOFT)

img = img.resize((W, H), Image.LANCZOS)
out = "src-tauri/dmg-background.png"
img.convert("RGB").save(out)
print(f"wrote {out} ({W}x{H})")
