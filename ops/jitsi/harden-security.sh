#!/bin/bash
# McBuleli live.mcbuleli.org — security hardening (JWT-only + nginx + Meet config).
# Run on VPS as root after git pull:
#   sudo bash ops/jitsi/harden-security.sh
#
# Idempotent. Backs up config under /root/nginx-backups/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
MARKER="mcbuleli-security-hardening"
DISABLE_SCREENSHARE="${MCBULELI_JITSI_DISABLE_SCREENSHARE:-true}"
MAX_HOURS="${MCBULELI_JITSI_MAX_HOURS:-4}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "==> McBuleli Jitsi security hardening ($DOMAIN)"

mkdir -p /root/nginx-backups

echo "==> 1/6 JWT-only Prosody + Meet (no anonymous guest domain)"
bash "$SCRIPT_DIR/fix-jitsi-jwt-only-mode.sh"

echo "==> 2/6 Nginx gate (McBuleli login without ?jwt=)"
bash "$SCRIPT_DIR/apply-nginx-live-gate.sh"

echo "==> 3/6 Meet config.js — disable uploads, optional screen share, E2EE, max duration"
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }
cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").harden.$(date +%Y%m%d%H%M%S)"
sed -i "s|// mcbuleli-security-hardening.*||" "$MEET_CFG" || true

SCREEN_VAL="false"
[[ "$DISABLE_SCREENSHARE" == "true" || "$DISABLE_SCREENSHARE" == "1" ]] && SCREEN_VAL="true"

python3 - "$MEET_CFG" "$MARKER" "$SCREEN_VAL" "$MAX_HOURS" <<'PY'
import re
import sys

path, marker, disable_ss, max_h = sys.argv[1:5]
text = open(path, encoding="utf-8").read()
text = re.sub(r"\n// mcbuleli-security-hardening[\s\S]*", "", text)
block = """
// %s
config.disableThirdPartyRequests = true;
config.enableEmailInStats = false;
config.fileSharing = { enabled: false };
config.disableScreensharing = %s;
config.desktopSharingFrameRate = { min: 5, max: 5 };
config.e2ee = { enabled: true };
config.maxConferenceDuration = { value: %s, unit: 'hours' };
config.enableLobbyChat = false;
config.hideLobbyButton = true;
config.disableLobby = true;
config.enableInsecureRoomNameWarning = false;
config.enableClosePage = false;
config.analytics = { disabled: true };
""" % (marker, disable_ss, int(max_h))
open(path, "w", encoding="utf-8").write(text.rstrip() + block + "\n")
PY

node --check "$MEET_CFG"

echo "==> 4/6 Nginx — rate limit + /sounds/ referer check"
SECURITY_SNIPPET=/etc/nginx/snippets/mcbuleli-live-security.conf
cat > "$SECURITY_SNIPPET" <<'EOF'
# mcbuleli-live-security — included in live.mcbuleli.org server blocks
limit_req_zone $binary_remote_addr zone=mcb_live_room:10m rate=15r/m;
limit_req_status 429;

# Notification sounds — block hotlinking / directory scraping
location ^~ /sounds/ {
    valid_referers server_names ~live\.mcbuleli\.org;
    if ($invalid_referer) { return 403; }
    try_files $uri =404;
    add_header Cache-Control "private, max-age=3600";
}
EOF

find_nginx_vhost() {
  for f in /etc/nginx/sites-enabled/live.mcbuleli.org.conf \
           /etc/nginx/sites-enabled/live.mcbuleli.org \
           /etc/nginx/sites-available/live.mcbuleli.org.conf; do
    [[ -f "$f" ]] && echo "$f" && return 0
  done
  return 1
}

NGINX_VHOST="$(find_nginx_vhost)" || { echo "nginx vhost not found"; exit 1; }
sed -i '/include snippets\/mcbuleli-live-security.conf;/d' "$NGINX_VHOST"
python3 - "$NGINX_VHOST" <<'PY'
import sys

path = sys.argv[1]
lines = open(path, encoding="utf-8").read().splitlines(keepends=True)
out: list[str] = []
depth = 0
in_live = False
inserted = 0

for line in lines:
    if in_live and line.strip() == "}" and depth == 1:
        out.append("    include snippets/mcbuleli-live-security.conf;\n")
        inserted += 1
        in_live = False
    out.append(line)
    if "server_name" in line and "live.mcbuleli.org" in line:
        in_live = True
    depth += line.count("{") - line.count("}")

open(path, "w", encoding="utf-8").writelines(out)
print(f"==> security include inséré dans {inserted} bloc(s) server")
PY

GATE_SNIPPET=/etc/nginx/snippets/mcbuleli-live-gate.conf
if [[ -f "$GATE_SNIPPET" ]] && ! grep -q 'limit_req zone=mcb_live_room' "$GATE_SNIPPET"; then
  sed -i '/location ~ \^\/(\[A-Za-z0-9\]/a\    limit_req zone=mcb_live_room burst=5 nodelay;' "$GATE_SNIPPET" || true
fi

echo "==> 5/6 Access log format (IP + room path)"
ACCESS_LOG_CONF=/etc/nginx/conf.d/mcbuleli-live-log.conf
cat > "$ACCESS_LOG_CONF" <<'EOF'
log_format mcb_live '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" rt=$request_time';
EOF
if ! grep -q 'access_log.*mcb_live' "$NGINX_VHOST" 2>/dev/null; then
  python3 - "$NGINX_VHOST" <<'PY'
import sys
path = sys.argv[1]
needle = "    access_log /var/log/nginx/live.mcbuleli.org.access.log mcb_live;\n"
lines = open(path, encoding="utf-8").read().splitlines(keepends=True)
if any(needle.strip() in ln for ln in lines):
    raise SystemExit(0)
out, depth, in_live, inserted = [], 0, False, 0
for line in lines:
    if in_live and line.strip() == "}" and depth == 1:
        out.append(needle)
        inserted += 1
        in_live = False
    out.append(line)
    if "server_name" in line and "live.mcbuleli.org" in line:
        in_live = True
    depth += line.count("{") - line.count("}")
open(path, "w", encoding="utf-8").writelines(out)
PY
fi

nginx -t
systemctl reload nginx

echo "==> 6/6 Package versions + CVE reminder"
if command -v dpkg-query >/dev/null 2>&1; then
  dpkg-query -W -f='${Package} ${Version}\n' jitsi-meet jitsi-meet-prosody jitsi-videobridge2 jicofo 2>/dev/null || true
fi
echo ""
echo "Review CVEs: apt list --upgradable | grep -i jitsi"
echo "Optional: searchsploit jitsi  (on a machine with exploit-db)"

echo ""
echo "OK — McBuleli Jitsi hardened."
echo "  • JWT-only (Render JITSI_JWT_SECRET = Prosody app_secret)"
echo "  • Gate nginx → login mcbuleli.org without ?jwt="
echo "  • File upload off, screen share=$DISABLE_SCREENSHARE, max ${MAX_HOURS}h"
echo "  • App audit: jitsi_access_log (migration 0096)"
echo ""
echo "Verify:"
echo "  curl -sI https://${DOMAIN}/test-room | head -3   # expect 302"
echo "  curl -sI https://${DOMAIN}/sounds/reactions-applause.mp3 | head -3  # expect 403 without referer"
