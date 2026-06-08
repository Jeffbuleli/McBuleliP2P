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

EXP_SECS="${TEST_JWT_EXP_SECS:-14400}"

JWT_OUT="$(python3 - "$APP_ID" "$DOMAIN" "$ROOM" "$SECRET" "$EXP_SECS" <<'PY'
import hmac, hashlib, base64, json, sys, time
from datetime import datetime, timezone

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

app_id, sub, room, secret, exp_secs = sys.argv[1:6]
now = int(time.time())
exp = now + int(exp_secs)
header = {"alg": "HS256", "typ": "JWT", "kid": app_id}
payload = {
    "iss": app_id,
    "aud": "jitsi",
    "sub": sub,
    "room": room,
    "moderator": True,
    "iat": now,
    "exp": exp,
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
jwt = f"{h}.{p}.{sig}"
exp_human = datetime.fromtimestamp(exp, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
print(jwt)
print(f"EXP:{exp_human}")
PY
)"
JWT="$(echo "$JWT_OUT" | head -1)"
JWT_EXP="$(echo "$JWT_OUT" | grep '^EXP:' | sed 's/^EXP://')"

# Pas de config.hosts.* dans le hash (JSON.parse casse sur focus.live…) — voir config.js force-join
HASH="#config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false&config.disableLobby=true&config.securityUi.hideLobbyButton=true&config.enableUserRolesBasedOnToken=false&config.defaultLogoUrl=%22%2Fimages%2Fmcbuleli-meet-watermark.png%22&interfaceConfig.APP_NAME=%22McBuleli%22&interfaceConfig.SHOW_JITSI_WATERMARK=true&userInfo.displayName=%22TestHost%22"

URL="https://${DOMAIN}/${ROOM}?jwt=${JWT}${HASH}"

echo "========== URL test direct (host moderator) =========="
echo "JWT expire: ${JWT_EXP:-?} (${EXP_SECS}s)"
echo ""
echo "$URL"
echo ""
echo "IMPORTANT — Authentication failed / Token is expired:"
echo "  → PAS un blocage Chrome privé — regénérer l'URL et coller TOUT DE SUITE"
echo "  → Ne pas réutiliser une URL du terminal (jwt expiré après ${EXP_SECS}s)"
echo ""
echo "1) FERMER tous onglets live.mcbuleli.org d'abord"
echo "2) Chrome PRIVÉ — coller URL MAINTENANT en onglet TOP-LEVEL"
echo "3) Vérifier ?jwt= présent dans la barre d'adresse"
echo "4) Console: PAS 'Token is expired' ni CORS mcbuleli.org/login"
echo "5) Pendant join: sudo bash ops/jitsi/watch-join-live.sh ${ROOM}"
