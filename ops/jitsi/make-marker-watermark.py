#!/usr/bin/env python3
"""
Watermark McBuleli — traits blancs sur fond transparent (style Jitsi / marqueur sur vitre).
Usage: make-marker-watermark.py [out.png] [scale=2]
"""
from __future__ import annotations

import sys
from pathlib import Path

WHITE = (255, 255, 255, 220)  # ~86 % — discret sur visages
STROKE = 3


def _font(size: int):
    from PIL import ImageFont

    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw(out: Path, scale: int = 2) -> None:
    from PIL import Image, ImageDraw

    w, h = 148 * scale, 36 * scale
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = scale
    sw = max(2, STROKE * s // 2)

    # Icône écran + nœuds (traits seuls, pas de fond)
    ox, oy = int(4 * s), int(6 * s)
    # écran
    d.rounded_rectangle(
        (ox + int(2 * s), oy + int(8 * s), ox + int(28 * s), oy + int(24 * s)),
        radius=int(2 * s),
        outline=WHITE,
        width=sw,
    )
    # pied
    d.line(
        (ox + int(12 * s), oy + int(24 * s), ox + int(12 * s), oy + int(27 * s)),
        fill=WHITE,
        width=sw,
    )
    d.line(
        (ox + int(8 * s), oy + int(27 * s), ox + int(16 * s), oy + int(27 * s)),
        fill=WHITE,
        width=sw,
    )
    # lignes + nœuds
    nodes = (
        (ox + int(8 * s), oy + int(8 * s), ox + int(8 * s), oy + int(3 * s)),
        (ox + int(15 * s), oy + int(8 * s), ox + int(15 * s), oy + int(5 * s)),
        (ox + int(22 * s), oy + int(8 * s), ox + int(22 * s), oy + int(3 * s)),
    )
    for x1, y1, x2, y2 in nodes:
        d.line((x1, y1, x2, y2), fill=WHITE, width=sw)
        r = max(2, int(1.6 * s))
        d.ellipse((x2 - r, y2 - r, x2 + r, y2 + r), fill=WHITE)

    # Wordmark
    font = _font(int(15 * s))
    d.text((ox + int(34 * s), oy + int(7 * s)), "McBuleli", fill=WHITE, font=font)

    bbox = im.getbbox()
    if bbox:
        pad = int(2 * s)
        im = im.crop(
            (
                max(0, bbox[0] - pad),
                max(0, bbox[1] - pad),
                min(w, bbox[2] + pad),
                min(h, bbox[3] + pad),
            )
        )

    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "PNG", optimize=True)
    print(f"wrote {out} ({im.width}x{im.height}, marker white / transparent)")


def main() -> int:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "mcbuleli-meet-watermark-marker.png")
    scale = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    draw(out, scale)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
