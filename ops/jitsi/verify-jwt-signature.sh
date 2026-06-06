#!/bin/bash
# Vérifie qu'un JWT de l'URL est signé avec le même secret que Prosody.
# Usage: bash ops/jitsi/verify-jwt-signature.sh 'eyJhbG...'
set -euo pipefail

JWT="${1:-}"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"

if [[ -z "$JWT" ]]; then
  echo "Usage: bash verify-jwt-signature.sh '<jwt sans ?jwt=>'"
  exit 1
fi

python3 - "$JWT" "$CFG" <<'PY'
import base64, hashlib, hmac, json, re, sys

jwt, cfg_path = sys.argv[1], sys.argv[2]
text = open(cfg_path).read()
secret = re.search(r'app_secret\s*=\s*"([^"]*)"', text).group(1)
parts = jwt.split(".")
if len(parts) != 3:
    print("ERREUR: JWT invalide (3 parties attendues)")
    sys.exit(1)

def b64url_decode(s):
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)

header = json.loads(b64url_decode(parts[0]))
payload = json.loads(b64url_decode(parts[1]))
signing_input = f"{parts[0]}.{parts[1]}".encode()
expected = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
expected_b64 = base64.urlsafe_b64encode(expected).rstrip(b"=").decode()
ok = hmac.compare_digest(expected_b64, parts[2])

print("=== Payload ===")
print(json.dumps(payload, indent=2))
print()
print(f"iss={payload.get('iss')} sub={payload.get('sub')} aud={payload.get('aud')} room={payload.get('room')}")
print(f"moderator={payload.get('moderator')}")
print()
if ok:
    print("OK — Signature valide avec app_secret Prosody")
else:
    print("ÉCHEC — Signature INVALIDE (secret Render ≠ Prosody ?)")
    sys.exit(1)
PY
