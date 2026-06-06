#!/usr/bin/env python3
"""
Referat — app icon generator
Produces: frontend/src-tauri/icons/referat-master-1024.png

Recreates the "Referat / av agentik" geometric Bauhaus-style "R" mark
(MARK ONLY — no wordmark) on a macOS-style rounded-square background.

Design (reconstructed from frontend/scripts/logo-reference.png):
  - 1024×1024 canvas, 4× supersampled then downsampled (crisp edges)
  - Cream rounded-square background (superellipse-ish ~22% corner radius)
  - Navy mark centered, occupying ~64% of the canvas

The mark is an abstract "R" built from rects + circle arcs, split into three
horizontal bands by two thin cream gaps. The navy shape is assembled on a
greyscale alpha mask (ADD shapes in white, SUBTRACT notches in black) so the
result is independent of draw order, then navy is pasted through that mask.

  TOP band     : solid block; top-right corner is a large convex quarter-circle
                 (head + outer bowl). Arc fit: center (0.63, 0.37), r 0.38.
  MIDDLE band  : left stem bar with a concave quarter-circle notch on its
                 inner-top (notch arc: center (0.0, 0.58), r 0.23); cream center
                 seam; right column whose right edge curves inward (inner bowl,
                 arc: center (0.50, 0.60), r 0.44).
  BOTTOM band  : left solid square (stem foot); cream seam; right leg whose
                 top-left is cut by a concave quarter-round (the R's leg).
"""

import os
from PIL import Image, ImageDraw

# ── Palette (sampled from the reference) ──────────────────────────────────────
NAVY  = (32, 37, 45)     # #20252D
CREAM = (254, 249, 249)  # #FEF9F9

SIZE = 1024
OVER = 4                 # supersample factor
BG_RADIUS_FRAC = 0.22    # rounded-square corner radius

OUT_PATH = os.path.join(
    os.path.dirname(__file__),
    "../src-tauri/icons/referat-master-1024.png",
)


def build_mark_mask(s: int, simplify: bool = False) -> Image.Image:
    """
    Return an 'L' mask (white = navy) of side `s` containing the R-mark.
    All proportions normalized to the reference. `simplify` drops the finest
    notches for tiny renders so the mark stays legible.
    """
    mask = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(mask)

    def X(n): return int(round(n * s))
    def Y(n): return int(round(n * s))

    def rect(x0, y0, x1, y1, v):
        d.rectangle([X(x0), Y(y0), X(x1), Y(y1)], fill=v)

    def pie(cx, cy, r, start, end, v):
        d.pieslice([X(cx - r), Y(cy - r), X(cx + r), Y(cy + r)],
                   start=start, end=end, fill=v)

    WHITE, BLACK = 255, 0

    # ── Key proportions (normalized; measured from the reference) ─────────────
    seam_l = 0.335               # right edge of left stem / counter left wall
    seam_r = 0.665               # left edge of bowl stroke / counter right wall
    gap1_y = 0.345               # top of the counter / start of the lobe opening
    gap2_y = 0.660               # bottom of the bowl
    bot_t  = 0.705               # top of the leg & foot

    # ── 1. LEFT STEM (+foot): one solid vertical bar, full height ─────────────
    rect(0.0, 0.0, seam_l, 1.0, WHITE)

    # ── 2. HEAD (top bar) + BOWL (right stroke): solid blocks, outer corners ──
    # rounded. The head is a full-width top bar; the bowl is a thick right
    # stroke. Only the OUTER corners round off (top-right of head, bottom-right
    # of bowl). Corner radius from the reference outer-curve fit (~0.345).
    rc = 0.345                                     # outer corner radius
    head_b = gap1_y                                # head bar bottom
    # Head bar: full width, with top-right rounded corner.
    rect(0.0, 0.0, 1.0 - rc, head_b, WHITE)        # left part of head bar
    rect(0.0, 0.0, 1.0, head_b, WHITE)             # (head is short; full below curve)
    # Bowl right stroke: seam_r..1.0, from head_b down to bowl bottom.
    rect(seam_r, head_b, 1.0, gap2_y, WHITE)
    # Round the head's top-right corner (convex): cream outside circle at
    # (1-rc, rc). Carve corner then restore the quarter disk.
    rect(1.0 - rc, 0.0, 1.0, rc, BLACK)
    pie(1.0 - rc, rc, rc, -90, 0, WHITE)
    # Round the bowl's bottom-right (convex). The bowl tapers strongly: the
    # outer-bottom edge follows a circle fit to the reference at (0.68, 0.34)
    # r 0.32 — navy is inside (upper-left). Carve everything below/right of it.
    bb_cx, bb_cy, bb_r = 0.68, 0.34, 0.32
    rect(bb_cx, bb_cy, 1.0, gap2_y, BLACK)         # clear lower-right of bowl
    pie(bb_cx, bb_cy, bb_r, 0, 90, WHITE)          # restore navy inside arc

    # ── 3. COUNTER (the cream hole of the R): a clean rectangle ───────────────
    rect(seam_l, gap1_y, seam_r, gap2_y, BLACK)

    # ── 4. NOTCH where bowl meets stem (concave, top-left of stem) ────────────
    # A cream quarter-disk eats the stem's inner-top corner: corner at the
    # top-left (0, gap1_y), radius ~0.14. The navy edge curves concavely from
    # x~0.14 (at gap1_y) in toward x~0 (lower down). Carve cream directly.
    if not simplify:
        notch_r = 0.14
        pie(0.0, gap1_y, notch_r, 0, 90, BLACK)               # carve cream disk

    # ── 5. JUNCTION BAR + FOOT + LEG (bottom of the R) ────────────────────────
    # A full-width navy bar (yn gap2_y..bot_t) joins the stem-foot to the leg,
    # then below it the foot (left) and leg (right) are split by a cream cut
    # that widens downward (the leg's concave top-left).
    rect(0.0, gap2_y, 1.0, 1.0, WHITE)                    # full lower block
    if not simplify:
        # Concave cut between foot and leg: carve the upper arc of a cream disk
        # centered below the canvas at (0.22, 1.18) r 0.36. Its visible top arc
        # makes the leg's left edge curve from x~seam_l (at bot_t) out to x~0.64
        # at the bottom (fit to the reference, region IoU ~0.91).
        pie(0.22, 1.18, 0.36, 180, 360, BLACK)            # carve cream
        # Re-assert the foot square (carve may have nicked its right wall).
        rect(0.0, bot_t, seam_l, 1.0, WHITE)

    return mask


def superellipse_mask(size: int, radius_frac: float) -> Image.Image:
    """Anti-aliased rounded-rectangle mask."""
    r = int(radius_frac * size)
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1],
                                        radius=r, fill=255)
    return m


def render_icon(mark_frac: float = 0.64, simplify: bool = False,
                background: str = "cream") -> Image.Image:
    """
    Render the icon at SIZE×SIZE (supersampled).
    background: 'cream' (rounded-square bg) or 'transparent' (mark only).
    """
    big = SIZE * OVER
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))

    if background == "cream":
        bg = Image.new("RGBA", (big, big), CREAM + (255,))
        bg.putalpha(superellipse_mask(big, BG_RADIUS_FRAC))
        canvas.alpha_composite(bg)

    mside = int(big * mark_frac)
    ox = (big - mside) // 2
    oy = (big - mside) // 2

    mark_mask = build_mark_mask(mside, simplify=simplify)
    navy_layer = Image.new("RGBA", (mside, mside), NAVY + (255,))
    canvas.paste(navy_layer, (ox, oy), mark_mask)

    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    out_path = os.path.abspath(OUT_PATH)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    img = render_icon()
    img.save(out_path, "PNG", optimize=False)
    print(f"Saved: {out_path}  ({img.width}×{img.height})")

    loaded = Image.open(out_path)
    assert loaded.size == (SIZE, SIZE), f"Wrong size: {loaded.size}"
    print(f"Center pixel: {loaded.getpixel((SIZE // 2, SIZE // 2))}")
    print("Sanity checks passed.")


if __name__ == "__main__":
    main()
