#!/usr/bin/env python3
"""Capture the live Referat window by id and composite rounded corners + drop
shadow on a transparent background — landing-page-grade product shots.

Usage: capture-shot.py <output-name>   (writes ~/Desktop/referat-marketing/<name>.png)
Run with the capture venv python (has Quartz + PIL).
"""
import subprocess, sys, os, tempfile
import Quartz
from PIL import Image, ImageDraw, ImageFilter

name = sys.argv[1] if len(sys.argv) > 1 else "shot"
OUT = os.path.expanduser(f"~/Desktop/referat-marketing/{name}.png")
RADIUS = 24        # window corner radius (logical px; retina doubles)
SHADOW_BLUR = 60
SHADOW_OPACITY = 90
MARGIN = 90        # transparent breathing room around the window for the shadow

def referat_window_id():
    best=None; best_area=0
    for w in Quartz.CGWindowListCopyWindowInfo(
            Quartz.kCGWindowListOptionAll, Quartz.kCGNullWindowID):
        if 'eferat' in str(w.get('kCGWindowOwnerName','')) and w.get('kCGWindowLayer')==0:
            b=w.get('kCGWindowBounds',{}); a=b.get('Width',0)*b.get('Height',0)
            if a>best_area: best_area=a; best=w['kCGWindowNumber']
    if best is None: sys.exit("Referat window not found — is the app open?")
    return best

wid = referat_window_id()
tmp = tempfile.mktemp(suffix=".png")
# -l<id> captures THIS window's content even if it is behind other windows.
# (No -o: the -o flag breaks -l on this macOS.)
subprocess.run(["screencapture", f"-l{wid}", "-x", tmp], check=True)

win = Image.open(tmp).convert("RGBA")
W, H = win.size
scale = round(W / 1100) or 2          # retina factor from known logical width
r = RADIUS * scale

# rounded-corner mask
mask = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, W, H], radius=r, fill=255)
win.putalpha(mask)

m = MARGIN * scale
canvas = Image.new("RGBA", (W + 2 * m, H + 2 * m), (0, 0, 0, 0))

# drop shadow
shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
sd = Image.new("L", (W, H), 0)
ImageDraw.Draw(sd).rounded_rectangle([0, 0, W, H], radius=r, fill=SHADOW_OPACITY)
shadow.paste((10, 12, 18, 255), (m, m + int(8 * scale)), sd)
shadow = shadow.filter(ImageFilter.GaussianBlur(SHADOW_BLUR * scale / 2))

canvas = Image.alpha_composite(canvas, shadow)
canvas.alpha_composite(win, (m, m))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
canvas.save(OUT)
os.remove(tmp)
print(f"✓ {OUT}  ({canvas.size[0]}x{canvas.size[1]}, ~{scale}x retina)")
