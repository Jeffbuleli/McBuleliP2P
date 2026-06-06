#!/bin/bash
# 2 appareils = 1 participant chacun → host (JWT domain) vs guest (anonymousdomain) = 2 MUC séparés.
# McBuleli : tout le monde passe par live.mcbuleli.org + JWT (gate nginx).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").same-room.$(date +%Y%m%d%H%M%S)"

# 1) Un seul domaine XMPP pour tous (pas guest.live séparé)
bash "$SCRIPT_DIR/fix-jitsi-jwt-only-mode.sh" 2>/dev/null || true
sed -i "s|^[[:space:]]*anonymousdomain:|        // anonymousdomain:|" "$MEET_CFG"

if ! grep -q 'mcbuleli-same-room' "$MEET_CFG"; then
  cat >> "$MEET_CFG" <<EOF

// mcbuleli-same-room — host + invités dans la MÊME salle
config.hosts = config.hosts || {};
config.hosts.domain = '${DOMAIN}';
config.hosts.authdomain = '${DOMAIN}';
delete config.hosts.anonymousdomain;
config.enableLobby = false;
config.disableLobby = true;
config.enableUserRolesBasedOnToken = true;
EOF
fi

bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh" 2>/dev/null || true
node --check "$MEET_CFG"

systemctl restart prosody jicofo jitsi-videobridge2
systemctl reload nginx

echo ""
echo "=== Vérification (anonymousdomain doit être absent/commenté) ==="
grep -nE 'anonymousdomain|enableLobby|mcbuleli-same-room|hosts\.domain' "$MEET_CFG" | tail -12
echo ""
echo "OK — retest : HOT Démarrer + invité Rejoindre → Participants (2)"
