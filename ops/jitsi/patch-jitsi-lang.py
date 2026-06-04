#!/usr/bin/env python3
"""Remplace les libellés Jitsi visibles par McBuleli dans lang/*.json (VPS)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

APP = "McBuleli Academy Live"
APP_SHORT = "McBuleli"

# Clés connues (toasts, titres, promos)
KEY_OVERRIDES: dict[str, str] = {
    "thankYou": f"Merci d'avoir utilisé {APP} !",
    "headerTitle": APP,
    "productLabel": f"via {APP_SHORT}",
    "logoDeepLinking": f"Logo {APP_SHORT}",
    "jitsiOnMobile": f"{APP_SHORT} sur mobile — téléchargez l'application McBuleli",
    "confirmAddLink": f"Voulez-vous ajouter un lien {APP_SHORT} à cet événement ?",
}

EN_OVERRIDES: dict[str, str] = {
    "thankYou": f"Thank you for using {APP}!",
    "headerTitle": APP,
    "productLabel": f"via {APP_SHORT}",
    "logoDeepLinking": f"{APP_SHORT} logo",
    "jitsiOnMobile": f"{APP_SHORT} on mobile — download our app",
}


def patch_obj(obj: object, overrides: dict[str, str], lang: str) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in overrides and isinstance(v, str):
                obj[k] = overrides[k] if lang == "fr" else overrides.get(k, v)
            elif k in overrides:
                obj[k] = overrides[k]
            else:
                patch_obj(v, overrides, lang)
    elif isinstance(obj, list):
        for item in obj:
            patch_obj(item, overrides, lang)


def replace_jitsi_strings(obj: object) -> None:
    """Fallback: remplace Jitsi Meet dans les chaînes utilisateur."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str):
                if "Jitsi Meet" in v:
                    obj[k] = v.replace("Jitsi Meet", APP)
                elif "jitsi meet" in v.lower() and k not in ("aud",):
                    obj[k] = v.replace("jitsi meet", APP).replace("Jitsi meet", APP)
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
        (lang_dir / "main-fr.json", "fr", KEY_OVERRIDES),
        (lang_dir / "main.json", "en", EN_OVERRIDES),
    ]
    for path, lang, overrides in pairs:
        if not path.is_file():
            print(f"skip {path} (missing)")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        patch_obj(data, overrides, lang)
        replace_jitsi_strings(data)
        bak = path.with_suffix(path.suffix + ".bak")
        if not bak.exists():
            bak.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"patched {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
