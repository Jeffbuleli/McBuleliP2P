#!/bin/bash
# Pourquoi 2 appareils = 2 salles séparées (1 participant chacun).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
GUEST="guest.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"

echo "==> 1. config.js actif (anonymousdomain / lobby)"
grep -nE '^[[:space:]]*anonymousdomain:|delete config\.hosts\.anonymousdomain|config\.enableLobby|config\.disableLobby|hosts\.muc|mcbuleli-no-guest' \
  "$MEET_CFG" 2>/dev/null | grep -v '// enableLobbyChat' | tail -20 || true

echo ""
echo "==> 2. Prosody — domaine d'auth récent (live vs guest)"
grep -iE "Authenticated.*(${DOMAIN}|${GUEST})" /var/log/prosody/prosody.log 2>/dev/null | tail -12 || true

echo ""
echo "==> 3. Prosody — join MUC ${ROOM}"
grep -iE "${ROOM}|conference\.(${DOMAIN}|${GUEST})|muc.*${ROOM}" /var/log/prosody/prosody.log 2>/dev/null | tail -20 || true

echo ""
echo "==> 4. Jicofo — conférence ${ROOM}"
grep -iE "${ROOM}|conference|Allocated|participant|focus" /var/log/jitsi/jicofo.log 2>/dev/null | tail -20 || true

echo ""
echo "==> 5. Guest VirtualHost Prosody"
PROSODY_CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$PROSODY_CFG" ]] || PROSODY_CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
grep -n "VirtualHost \"${GUEST}\"" -A2 "$PROSODY_CFG" 2>/dev/null | head -6 || echo "(guest vhost absent)"

echo ""
echo "==> Interprétation"
echo "  - Si section 2 montre guest.${DOMAIN} → client utilise encore anonymousdomain (cache config.js)"
echo "  - Si section 3 montre conference.guest.* → MUC séparée (fix-no-guest-split.sh)"
echo "  - Si section 4 sans ${ROOM} → Jicofo ne voit pas la salle (focus/XMPP)"
echo "  - Relancez PENDANT que les 2 sont connectés pour des lignes fraîches"
