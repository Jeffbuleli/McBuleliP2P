#!/usr/bin/env python3
"""Remplace les libellés Jitsi visibles par McBuleli dans lang/*.json (VPS)."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

APP = "McBuleli"

# Clés connues (toasts, titres, promos)
KEY_OVERRIDES: dict[str, str] = {
    "thankYou": f"Merci d'avoir participé via {APP} !",
    "headerTitle": APP,
    "productLabel": f"via {APP}",
    "logoDeepLinking": f"Logo {APP}",
    "jitsiOnMobile": f"{APP} sur mobile — téléchargez l'application McBuleli",
    "confirmAddLink": f"Voulez-vous ajouter un lien {APP} à cet événement ?",
}

EN_OVERRIDES: dict[str, str] = {
    "thankYou": f"Thank you for joining via {APP}!",
    "headerTitle": APP,
    "productLabel": f"via {APP}",
    "logoDeepLinking": f"{APP} logo",
    "jitsiOnMobile": f"{APP} on mobile — download our app",
    "confirmAddLink": f"Do you want to add a {APP} link to this event?",
}


def patch_obj(obj: object, overrides: dict[str, str]) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in overrides:
                obj[k] = overrides[k]
            else:
                patch_obj(v, overrides)
    elif isinstance(obj, list):
        for item in obj:
            patch_obj(item, overrides)


def replace_jitsi_strings(obj: object) -> None:
    """Fallback: remplace Jitsi Meet / Jitsi dans les chaînes utilisateur."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str) and k not in ("aud", "code"):
                s = v
                s = re.sub(r"\bvia Jitsi Meet\b", f"via {APP}", s, flags=re.I)
                s = re.sub(r"\bJitsi Meet\b", APP, s, flags=re.I)
                s = re.sub(r"\bJitsi\b", APP, s)
                if s != v:
                    obj[k] = s
            else:
                replace_jitsi_strings(v)
    elif isinstance(obj, list):
        for item in obj:
            replace_jitsi_strings(item)


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: patch-jitsi-lang.py /usr/share/jitsi-meet/lang", file=sys.stderr)
        return 1
    lang_dir = Path(sys.argv[1])
    pairs = [
        (lang_dir / "main-fr.json", KEY_OVERRIDES),
        (lang_dir / "main.json", EN_OVERRIDES),
    ]
    for path, overrides in pairs:
        if not path.is_file():
            print(f"skip {path} (missing)")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        patch_obj(data, overrides)
        replace_jitsi_strings(data)
        bak = path.with_suffix(path.suffix + ".bak")
        if not bak.exists():
            bak.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"patched {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
