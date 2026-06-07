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
echo "1) FERMER tous onglets live.mcbuleli.org d'abord"
echo "2) Chrome PRIVÉ — coller URL en onglet TOP-LEVEL (pas iframe / pas via app McBuleli)"
echo "3) Vérifier ?jwt= présent dans la barre d'adresse"
echo "4) Cmd+Option+J — PAS d'erreur CORS mcbuleli.org/login (sinon = iframe/app → test invalide)"
echo "5) Pendant join: sudo bash ops/jitsi/watch-join-live.sh ${ROOM}"
