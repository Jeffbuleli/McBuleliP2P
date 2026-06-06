#!/bin/bash
# URL Jitsi directe (JWT) — test navigateur SANS passer par l'app McBuleli.
# Usage: sudo bash ops/jitsi/gen-live-join-url.sh test-live-mcbuleli
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
ROOM="${1:-test-live-mcbuleli}"
APP_ID="${JITSI_APP_ID:-mcbuleli_live}"
SECRET_FILE="/root/.mcbuleli-jitsi-secret"

[[ -f "$SECRET_FILE" ]] || { echo "FAIL: $SECRET_FILE absent"; exit 1; }
SECRET="$(tr -d '[:space:]' < "$SECRET_FILE")"
[[ ${#SECRET} -ge 16 ]] || { echo "FAIL: secret trop court"; exit 1; }

JWT="$(python3 - "$APP_ID" "$DOMAIN" "$ROOM" "$SECRET" <<'PY'
import hmac, hashlib, base64, json, sys, time

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

app_id, sub, room, secret = sys.argv[1:5]
now = int(time.time())
header = {"alg": "HS256", "typ": "JWT", "kid": app_id}
payload = {
    "iss": app_id,
    "aud": "jitsi",
    "sub": sub,
    "room": room,
    "moderator": True,
    "exp": now + 3600,
    "context": {
        "user": {
            "id": "test-host",
            "name": "Test Host",
            "moderator": True,
            "affiliation": "owner",
            "lobby_bypass": True,
        }
    },
}
h = b64url(json.dumps(header, separators=(",", ":")).encode())
p = b64url(json.dumps(payload, separators=(",", ":")).encode())
sig = b64url(hmac.new(secret.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest())
print(f"{h}.{p}.{sig}")
PY
)"

# Pas de config.hosts.* dans le hash (JSON.parse casse sur focus.live…) — voir config.js force-join
HASH="#config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false&config.enableLobby=false&config.disableLobby=true&config.enableUserRolesBasedOnToken=false&userInfo.displayName=%22TestHost%22"

URL="https://${DOMAIN}/${ROOM}?jwt=${JWT}${HASH}"

echo "========== URL test direct (host moderator) =========="
echo "$URL"
echo ""
echo "1) Copier l'URL dans Chrome (fenêtre privée, extensions OFF)"
echo "2) Cmd+Option+J sur CET onglet (live.mcbuleli.org)"
echo "3) Autoriser caméra/micro si demandé"
echo "4) Pendant join: sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}"
