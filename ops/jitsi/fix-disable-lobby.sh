#!/bin/bash
# Invité en lobby + host en salle = chacun voit « 1 participant ».
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").no-lobby.$(date +%Y%m%d%H%M%S)"

if ! grep -q 'mcbuleli-same-room' "$MEET_CFG"; then
  cat >> "$MEET_CFG" <<EOF

// mcbuleli-same-room — host + invités dans la MÊME salle (lobby off)
// NE PAS enableLobby=false — casse isLobbySupported (Toolbox crash)
config.disableLobby = true;
config.securityUi = config.securityUi || {};
config.securityUi.hideLobbyButton = true;
config.enableUserRolesBasedOnToken = false;
EOF
fi

node --check "$MEET_CFG"
systemctl reload nginx

echo ""
grep -nE 'mcbuleli-same-room|enableLobby|disableLobby' "$MEET_CFG" | grep -v '// enableLobbyChat' | tail -8
echo ""
echo "OK — fermez tous les onglets Jitsi, puis retest Démarrer + Rejoindre"
