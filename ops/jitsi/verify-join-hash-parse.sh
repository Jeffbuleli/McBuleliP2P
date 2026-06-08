#!/bin/bash
# Simule parseURLParams Jitsi sur le hash URL — SyntaxError = ping-only garanti.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
ROOM="${1:-test-live-mcbuleli}"

echo "========== verify-join-hash-parse ${ROOM} =========="

python3 - "$DOMAIN" "$ROOM" <<'PY'
import json, re, subprocess, sys, urllib.parse

domain, room = sys.argv[1:3]

# Hash minimal (gen-live-join-url) + hash type app (strings JSON)
samples = {
    "gen-live-join-url": (
        "#config.prejoinPageEnabled=false"
        "&config.prejoinConfig.enabled=false"
        "&config.disableLobby=true"
        "&config.securityUi.hideLobbyButton=true"
        "&config.enableUserRolesBasedOnToken=false"
        "&userInfo.displayName=%22TestHost%22"
    ),
    "app-like": (
        "#config.prejoinPageEnabled=false"
        "&config.prejoinConfig.enabled=false"
        "&config.disableLobby=true"
        "&config.securityUi.hideLobbyButton=true"
        "&config.enableUserRolesBasedOnToken=false"
        "&config.startWithVideoMuted=true"
        f"&config.defaultLogoUrl={urllib.parse.quote(json.dumps(f'https://{domain}/images/mcbuleli-meet-watermark.png'))}"
        f"&config.subject={urllib.parse.quote(json.dumps('Test | McBuleli'))}"
        f"&userInfo.displayName={urllib.parse.quote(json.dumps('Test User'))}"
    ),
    "BROKEN-hosts-in-hash": (
        "#config.hosts.focus=focus." + domain
        "&config.prejoinPageEnabled=false"
    ),
}

def parse_jitsi_hash(fragment: str) -> list[str]:
    errs = []
    if not fragment or fragment == "#":
        return errs
    body = fragment.lstrip("#")
    for pair in body.split("&"):
        if not pair or "=" not in pair:
            continue
        key, val = pair.split("=", 1)
        decoded = urllib.parse.unquote(val)
        # Jitsi: bool/number nus OK; strings doivent être JSON valide
        if decoded in ("true", "false"):
            continue
        try:
            n = float(decoded)
            if decoded == str(int(n)) if n == int(n) else decoded == str(n):
                continue
        except ValueError:
            pass
        try:
            json.loads(decoded)
        except json.JSONDecodeError as e:
            errs.append(f"  FAIL {key}={decoded!r} → {e}")
    return errs

print("==> Hash samples (parseURLParams)")
ok = True
for name, frag in samples.items():
    errs = parse_jitsi_hash(frag)
    if errs:
        ok = False
        print(f"\n{name}: SYNTAX ERROR")
        print("\n".join(errs))
    else:
        print(f"  OK {name}")

print("\n==> config.js servi — conflits prejoin / roles")
try:
    import urllib.request
    body = urllib.request.urlopen(f"https://{domain}/config.js", timeout=15).read().decode()
except Exception as e:
    print(f"  FAIL curl config.js: {e}")
    sys.exit(1)

for pat in (
    r"prejoinPageEnabled\s*=\s*(\w+)",
    r"prejoinConfig\s*=\s*\{[^}]*enabled\s*:\s*(\w+)",
    r"enableUserRolesBasedOnToken\s*=\s*(\w+)",
    r"requireDisplayName\s*=\s*(\w+)",
    r"hosts\.anonymousdomain",
):
    hits = re.findall(pat, body, re.I)
    if hits:
        print(f"  {pat}: {hits[-3:]}")

prejoin_lines = [l.strip() for l in body.splitlines() if re.search(r"prejoin", l, re.I)]
if prejoin_lines:
    print("  dernières lignes prejoin:")
    for l in prejoin_lines[-4:]:
        print(f"    {l[:120]}")

anon = "hosts.anonymousdomain" in body or "anonymousdomain" in body
if anon:
    print("  WARN anonymousdomain présent → split host/guest possible")

print("\n==> VERDICT")
if not ok:
    print("  Hash cassé → conference.join() jamais appelé (ping-only)")
    print("  → ne pas mettre config.hosts.* dans le hash URL")
    sys.exit(1)
last_prejoin = [l for l in body.splitlines() if "prejoinPageEnabled" in l]
if last_prejoin and "false" not in last_prejoin[-1].lower():
    print(f"  FAIL prejoin actif en dernier: {last_prejoin[-1].strip()}")
    print("  → sudo bash ops/jitsi/fix-config-force-join.sh")
    sys.exit(1)
print("  Hash + config.js OK côté serveur")
print("  Si ping-only persiste → erreur JS navigateur (Cmd+Option+J) ou GUM bloqué")
print(f"  Test isolé: sudo bash ops/jitsi/gen-live-join-url.sh {room}")
PY
