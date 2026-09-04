#!/usr/bin/env python3
"""Polish Ngemba UI i18n (en/ln/sw/lua/kg) via OpenAI — short mobile-UI strings.

Important: request locales as tshiluba/kikongo (not ISO `kg`, which models confuse with Kyrgyz).
"""

from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ENV = ROOT / ".env"
I18N = Path(__file__).resolve().parents[1] / "src/lib/i18n.ts"
MOBILE_I18N = ROOT / "services/ngemba-mobile/src/lib/i18n.ts"
OUT = Path(__file__).resolve().parents[1] / "scripts/.cache/ui-i18n-polish.json"

API_LOCALES = ["en", "ln", "sw", "tshiluba", "kikongo"]
FILE_LOCALES = {
    "en": "en",
    "ln": "ln",
    "sw": "sw",
    "tshiluba": "lua",
    "kikongo": "kg",
}

SYSTEM = """You localize SHORT mobile UI strings for NGEMBA (citizen safety app, DRC, McBuleli).
French is the source of truth.

JSON locale keys MUST be exactly: en, ln, sw, tshiluba, kikongo
(kikongo = Kikongo of DRC, Latin script only — NEVER Kyrgyz / Cyrillic.)

Rules:
- Same keys for every locale.
- Short UI labels (often 1-5 words).
- Distinct natural Congolese wording: Lingala ≠ Tshiluba ≠ Kikongo ≠ Swahili.
- Language: en Language; ln Lokota; sw Lugha; tshiluba Ludimi; kikongo Ndinga.
- Witness: en Witness; ln Momonisi; sw Shahidi; tshiluba Mumonishi; kikongo Momonisi.
- Tagline Safety-Peace: en Safety - Peace; ln Bokebi - Kimya; sw Usalama - Amani; tshiluba/kikongo Usalama - Kimya.
- Discrete: ln Nzela ya libomba; sw Njia ya siri; tshiluba Nzela ya kubomba; kikongo Nzila ya kubomba.
- Keep SOS, NGEMBA, McBuleli, GPS, APK when brand/tech.
- ASCII hyphen only.
"""


def load_dotenv(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def openai_cfg():
    env = load_dotenv(ENV)
    key = (env.get("OPENAI_API_KEY") or "").strip()
    base = (env.get("OPENAI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
    model = (
        os.environ.get("OPENAI_TRANSLATE_MODEL")
        or env.get("OPENAI_TRANSLATE_MODEL")
        or env.get("OPENAI_ASSISTANT_MODEL")
        or env.get("OPENAI_MODEL")
        or "gpt-4o-mini"
    ).strip()
    if not key:
        raise SystemExit("OPENAI_API_KEY missing")
    return key, base, model


def chat(key: str, base: str, model: str, user: str) -> dict:
    body = {
        "model": model,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user},
        ],
    }
    if not model.startswith("gpt-5"):
        body["temperature"] = 0.15
    req = urllib.request.Request(
        f"{base}/chat/completions",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    last_err = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = json.loads(resp.read().decode())
            return json.loads(data["choices"][0]["message"]["content"])
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:500]
            print("HTTP", e.code, detail)
            last_err = e
            time.sleep(2 * (attempt + 1))
        except (TimeoutError, json.JSONDecodeError) as e:
            last_err = e
            print("retry", attempt + 1, type(e).__name__)
            time.sleep(2 * (attempt + 1))
    raise SystemExit(f"openai failed: {last_err}")


def extract_object_block(text: str, marker: str) -> str:
    idx = text.find(marker)
    if idx < 0:
        raise SystemExit(f"marker not found: {marker}")
    start = text.find("{", idx)
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    raise SystemExit("unbalanced brace")


def parse_ts_string_map(block: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for m in re.finditer(
        r'(?m)^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*"((?:\\.|[^"\\])*)"\s*,?\s*$',
        block,
    ):
        out[m.group(1)] = m.group(2).replace(r"\"", '"').replace(r"\n", "\n")
    return out


def has_cyrillic(s: str) -> bool:
    return bool(re.search(r"[\u0400-\u04FF]", s))


def apply_locale_strings(text: str, locale: str, mapping: dict[str, str]) -> str:
    pattern = rf"(\n  {locale}: \{{)([\s\S]*?)(\n  \}},)"
    m = re.search(pattern, text)
    if not m:
        raise SystemExit(f"locale block missing: {locale}")
    head, body, tail = m.group(1), m.group(2), m.group(3)
    for key, val in mapping.items():
        esc = val.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
        key_re = re.compile(
            rf'(?m)^(\s*{re.escape(key)}\s*:\s*)"(?:\\.|[^"\\])*"(\s*,?\s*)$'
        )
        body2, n = key_re.subn(rf'\1"{esc}"\2', body, count=1)
        if n == 0:
            print("warn missing key", locale, key)
        else:
            body = body2
    return text[: m.start()] + head + body + tail + text[m.end() :]


def main() -> None:
    key, base, model = openai_cfg()
    print("model", model)
    text = I18N.read_text(encoding="utf-8")
    fr = parse_ts_string_map(extract_object_block(text, "const baseFr: Copy = "))
    keys = [k for k in sorted(fr) if k != "legalDraftNotice"]
    merged = {FILE_LOCALES[a]: {} for a in API_LOCALES}

    batches = [keys[i : i + 12] for i in range(0, len(keys), 12)]
    for bi, batch in enumerate(batches, 1):
        payload = {k: fr[k] for k in batch}
        for attempt in range(4):
            user = (
                "Localize these French UI strings into en, ln, sw, tshiluba, kikongo.\n"
                "Return ALL keys for ALL locales.\n\n"
                + json.dumps(payload, ensure_ascii=False, indent=2)
            )
            print(f"batch {bi}/{len(batches)} attempt {attempt + 1} n={len(batch)}")
            result = chat(key, base, model, user)
            ok = True
            for api in API_LOCALES:
                part = result.get(api)
                if not isinstance(part, dict):
                    print("bad locale", api)
                    ok = False
                    break
                for k in batch:
                    val = part.get(k)
                    if not isinstance(val, str) or not val.strip():
                        print("missing", api, k)
                        ok = False
                        break
                    if api == "kikongo" and has_cyrillic(val):
                        print("cyrillic kikongo", k, val)
                        ok = False
                        break
                if not ok:
                    break
            if not ok:
                time.sleep(0.8)
                continue
            for api in API_LOCALES:
                floc = FILE_LOCALES[api]
                for k in batch:
                    merged[floc][k] = result[api][k].strip()
            break
        else:
            raise SystemExit(f"failed batch {bi}")
        time.sleep(0.25)

    for floc in merged:
        merged[floc]["legalDraftNotice"] = ""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", OUT)

    new_text = text
    for floc, mapping in merged.items():
        new_text = apply_locale_strings(new_text, floc, mapping)
    I18N.write_text(new_text, encoding="utf-8")
    print("updated", I18N)

    if MOBILE_I18N.exists():
        mtext = MOBILE_I18N.read_text(encoding="utf-8")
        for floc, mapping in merged.items():
            mtext = apply_locale_strings(mtext, floc, mapping)
        MOBILE_I18N.write_text(mtext, encoding="utf-8")
        print("updated", MOBILE_I18N)


if __name__ == "__main__":
    main()
