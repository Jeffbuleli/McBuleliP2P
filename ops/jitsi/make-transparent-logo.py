#!/usr/bin/env python3
"""Retire fond noir/blanc → PNG transparent pour watermark vidéo (style Jitsi)."""
from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])
    max_h = int(sys.argv[3]) if len(sys.argv) > 3 else 72
    if not src.is_file():
        print(f"missing {src}", file=sys.stderr)
        return 1
    try:
        from PIL import Image
    except ImportError:
        print("PIL missing", file=sys.stderr)
        return 2
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r < 45 and g < 45 and b < 45:
                px[x, y] = (r, g, b, 0)
            elif r > 235 and g > 235 and b > 235:
                px[x, y] = (r, g, b, 0)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    ratio = max_h / max(im.height, 1)
    nw = max(1, int(im.width * ratio))
    im = im.resize((nw, max_h), Image.Resampling.LANCZOS)
    im.save(out, "PNG", optimize=True)
    print(f"wrote {out} ({nw}x{max_h})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
