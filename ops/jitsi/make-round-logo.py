#!/usr/bin/env python3
"""Génère mcbuleli-round.png (logo circulaire) pour watermark + favicon."""
from __future__ import annotations

import sys
from pathlib import Path

def main() -> int:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "mcbuleli-logo.png")
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "mcbuleli-round.png")
    size = int(sys.argv[3] if len(sys.argv) > 3 else "72")
    if not src.is_file():
        print(f"missing {src}", file=sys.stderr)
        return 1
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("PIL missing — pip install pillow ou utiliser SVG seul", file=sys.stderr)
        return 2
    im = Image.open(src).convert("RGBA")
    im = im.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    im.putalpha(mask)
    im.save(out, "PNG", optimize=True)
    print(f"wrote {out} ({size}px)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
