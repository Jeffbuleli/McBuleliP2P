#!/bin/bash
# McBuleli : tous les utilisateurs ont ?jwt= (gate nginx).
# Désactive anonymousdomain pour éviter les connexions guest qui échouent en boucle.
# Usage (root VPS): bash ops/jitsi/fix-jitsi-jwt-only-mode.sh
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root"
  exit 1
fi

[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").jwt-only.$(date +%Y%m%d%H%M%S)"

# Commenter anonymousdomain (Jitsi utilisera uniquement le domaine principal + JWT)
sed -i "s|^[[:space:]]*anonymousdomain:|        // anonymousdomain:|" "$MEET_CFG"

if ! grep -q 'mcbuleli-jwt-only' "$MEET_CFG"; then
  cat >> "$MEET_CFG" <<EOF

// mcbuleli-jwt-only — gate nginx exige jwt pour tous
config.hosts = config.hosts || {};
config.hosts.domain = '${DOMAIN}';
config.hosts.authdomain = '${DOMAIN}';
delete config.hosts.anonymousdomain;
EOF
fi

# Désactiver enableUserRolesBasedOnToken (peut bloquer l'entrée si claims incomplets)
sed -i 's/config\.enableUserRolesBasedOnToken = true/config.enableUserRolesBasedOnToken = false/g' "$MEET_CFG" || true
if ! grep -q 'enableUserRolesBasedOnToken' "$MEET_CFG"; then
  echo "config.enableUserRolesBasedOnToken = false;" >> "$MEET_CFG"
fi

if command -v node >/dev/null 2>&1; then
  node --check "$MEET_CFG" && echo "config.js syntax OK"
fi

systemctl restart prosody jicofo jitsi-videobridge2 nginx

echo ""
echo "=== config.js (domain / anonymous) ==="
grep -n 'domain:\|anonymousdomain\|authdomain\|enableUserRolesBasedOnToken\|mcbuleli-jwt-only' "$MEET_CFG" | tail -15
echo ""
echo "Retest : nouvel onglet → App → Démarrer le live"
