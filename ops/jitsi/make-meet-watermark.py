#!/usr/bin/env python3
"""
Watermark vidéo McBuleli — fond transparent, anneau vert, symbole marron.
Usage: make-meet-watermark.py <source.png> <out.png> [size=128]
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

# Palette McBuleli (harmonie live — lisible sur visages, fond transparent)
GREEN = (48, 95, 51)      # #305f33
BROWN = (122, 78, 58)      # #7A4E3A — marron chaud


def classify(r: int, g: int, b: int) -> str:
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if lum < 42:
        return "bg"
    if r > 228 and g > 228 and b > 228:
        return "bg"
    # rouge vif (symbole centre)
    if r > 140 and r > g + 35 and r > b + 35:
        return "brown"
    # vert (anneau)
    if g > 70 and g > r + 18 and g > b + 10:
        return "green"
    # anti-alias vert
    if g >= r and g >= b and g > 55:
        return "green"
    # anti-alias rouge/marron
    if r >= g and r > 80:
        return "brown"
    return "bg"


def process(src: Path, out: Path, size: int) -> None:
    from PIL import Image

    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    out_im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out_im.load()

    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            kind = classify(r, g, b)
            if kind == "bg":
                opx[x, y] = (0, 0, 0, 0)
            elif kind == "green":
                edge = min(1.0, max(0.55, (0.299 * r + 0.587 * g + 0.114 * b) / 140))
                a = int(255 * edge)
                opx[x, y] = (*GREEN, a)
            else:
                edge = min(1.0, max(0.55, (0.299 * r + 0.587 * g + 0.114 * b) / 130))
                a = int(255 * edge)
                opx[x, y] = (*BROWN, a)

    bbox = out_im.getbbox()
    if bbox:
        out_im = out_im.crop(bbox)

    # Carré avec marge légère (coin vidéo Jitsi)
    side = max(out_im.width, out_im.height)
    pad = max(2, int(side * 0.06))
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    ox = (canvas.width - out_im.width) // 2
    oy = (canvas.height - out_im.height) // 2
    canvas.paste(out_im, (ox, oy), out_im)

    ratio = size / max(canvas.height, 1)
    nw = max(1, int(canvas.width * ratio))
    nh = max(1, int(canvas.height * ratio))
    final = canvas.resize((nw, nh), Image.Resampling.LANCZOS)

    # Opacité globale 88 % — discret sur visages, anneau encore lisible
    fa = final.split()[3]
    fa = fa.point(lambda a: int(a * 0.88) if a else 0)
    final.putalpha(fa)

    out.parent.mkdir(parents=True, exist_ok=True)
    final.save(out, "PNG", optimize=True)
    print(f"wrote {out} ({nw}x{nh}, transparent)")


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: make-meet-watermark.py <source.png> <out.png> [size]", file=sys.stderr)
        return 1
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    size = int(sys.argv[3]) if len(sys.argv) > 3 else 128
    if not src.is_file():
        print(f"missing {src}", file=sys.stderr)
        return 1
    process(src, out, size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
