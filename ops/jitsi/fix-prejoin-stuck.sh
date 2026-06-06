#!/bin/bash
# Bouton « Join meeting » figé — pré-join Jitsi + rôles JWT + focus.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFIG="/etc/jitsi/meet/${DOMAIN}-config.js"
CFG_PROSODY="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/apply-mcbuleli-brand.sh"
bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh"

echo "==> config.js (pré-join / JWT roles)"
grep -nE 'prejoinPageEnabled|enableUserRolesBasedOnToken|enableWelcomePage' "$CONFIG" | tail -8

echo "==> focus component"
grep -A3 "Component \"focus.${DOMAIN}\"" "$CFG_PROSODY" 2>/dev/null || echo "WARN: focus.${DOMAIN} absent"

systemctl restart prosody jicofo jitsi-videobridge2
systemctl reload nginx

echo "OK — retestez via l'app (Démarrer / Rejoindre). L'URL courte sans ?jwt= dans la barre est normale après chargement."
