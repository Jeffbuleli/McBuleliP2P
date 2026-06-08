#!/usr/bin/env python3
"""Patch /usr/share/jitsi-meet/interface_config.js — watermark + APP_NAME (comme meet.jit.si côté serveur)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

APP = "McBuleli"
WM = "images/mcbuleli-meet-watermark.png"

REPLACEMENTS: list[tuple[str, str]] = [
    (r"DEFAULT_LOGO_URL:\s*'[^']*'", f"DEFAULT_LOGO_URL: '{WM}'"),
    (r"DEFAULT_WELCOME_PAGE_LOGO_URL:\s*'[^']*'", f"DEFAULT_WELCOME_PAGE_LOGO_URL: '{WM}'"),
    (r"APP_NAME:\s*'[^']*'", f"APP_NAME: '{APP}'"),
    (r"NATIVE_APP_NAME:\s*'[^']*'", f"NATIVE_APP_NAME: '{APP}'"),
    (r"PROVIDER_NAME:\s*'[^']*'", f"PROVIDER_NAME: '{APP}'"),
    (r"SHOW_JITSI_WATERMARK:\s*\w+", "SHOW_JITSI_WATERMARK: true"),
    (r"SHOW_WATERMARK_FOR_GUESTS:\s*\w+", "SHOW_WATERMARK_FOR_GUESTS: true"),
    (r"SHOW_BRAND_WATERMARK:\s*\w+", "SHOW_BRAND_WATERMARK: false"),
    (r"SHOW_POWERED_BY:\s*\w+", "SHOW_POWERED_BY: false"),
    (r"SHOW_PROMOTIONAL_CLOSE_PAGE:\s*\w+", "SHOW_PROMOTIONAL_CLOSE_PAGE: false"),
    (r"JITSI_WATERMARK_LINK:\s*'[^']*'", "JITSI_WATERMARK_LINK: ''"),
]


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: patch-interface-config.py /usr/share/jitsi-meet/interface_config.js", file=sys.stderr)
        return 1
    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"skip {path} (missing)")
        return 0
    text = path.read_text(encoding="utf-8")
    bak = path.with_suffix(path.suffix + ".bak")
    if not bak.exists():
        bak.write_text(text, encoding="utf-8")
    for pat, repl in REPLACEMENTS:
        text, n = re.subn(pat, repl, text, count=1)
        if n:
            print(f"  {repl}")
    path.write_text(text, encoding="utf-8")
    print(f"patched {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
