#!/bin/bash
# « Vous avez été déconnecté » → forcer bosh/websocket sur live.mcbuleli.org (pas jigasi.meet.jitsi).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").bosh.$(date +%Y%m%d%H%M%S)"

python3 - "$MEET_CFG" "$DOMAIN" <<'PY'
import re, sys
path, domain = sys.argv[1], sys.argv[2]
text = open(path).read()

# Neutraliser références meet.jitsi / jigasi dans bosh/websocket/hiddenDomain
for key in ("bosh", "websocket", "hiddenDomain", "focusUserJid"):
    text = re.sub(rf'(?m)^(\s*)({re.escape(key)})\s*=', r"\1// \2=", text)

marker = "mcbuleli-bosh-fix"
if marker not in text:
    text += f"""

// {marker}
config.bosh = 'https://{domain}/http-bind';
config.websocket = 'wss://{domain}/xmpp-websocket';
config.hosts = config.hosts || {{}};
config.hosts.domain = '{domain}';
config.hosts.muc = 'conference.{domain}';
delete config.hosts.anonymousdomain;
delete config.hiddenDomain;
config.enableLobby = false;
config.disableLobby = true;
config.enableUserRolesBasedOnToken = false;
"""
open(path, "w").write(text)
print("OK")
PY

node --check "$MEET_CFG"
systemctl reload nginx

echo "--- config.js servi (bosh/websocket) ---"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'bosh|websocket|hiddenDomain|jigasi' | head -10
