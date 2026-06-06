#!/bin/bash
# Lancer PENDANT que host + invité sont dans la salle (même si déconnectés).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
ROOM="${1:-test-live-mcbuleli}"

echo "==> 1. Lobby encore actif ?"
grep -iE 'Lobby component loaded|muc_lobby' /var/log/prosody/prosody.log | tail -3 || echo "(aucun)"

echo ""
echo "==> 2. jigasi encore actif ?"
grep -i 'jigasi\.meet' /var/log/prosody/prosody.log | tail -3 || echo "(aucun)"

echo ""
echo "==> 3. Auth récente (live vs guest)"
grep -iE "Authenticated.*@${DOMAIN}|Authenticated.*@guest\." /var/log/prosody/prosody.log | tail -6

echo ""
echo "==> 4. Jicofo conférence ${ROOM}"
grep -iE "${ROOM}|Allocated|Creating conference|conference" /var/log/jitsi/jicofo.log | tail -8 || echo "(aucun)"

echo ""
echo "==> 5. Prosody c2s_interfaces"
grep -nE 'c2s_interfaces|^interfaces' /etc/prosody/prosody.cfg.lua 2>/dev/null | head -5

echo ""
echo "==> 6. muc_lobby_rooms dans modules ?"
grep -n 'muc_lobby_rooms' /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null || echo "(absent = OK)"

echo ""
echo "==> 7. MUC JID exacte ${ROOM}@conference.${DOMAIN} (CRITIQUE)"
grep -iE "${ROOM}@conference\.${DOMAIN}|${ROOM}@conference\." /var/log/prosody/prosody.log 2>/dev/null | tail -12 || \
  echo "(aucune — relancer PENDANT que les 2 sont dans l'UI)"

echo ""
echo "==> 8. MUC distinctes récentes sur conference.${DOMAIN}"
grep -oE '[a-zA-Z0-9._-]+@conference\.'"${DOMAIN}" /var/log/prosody/prosody.log 2>/dev/null | sort -u | tail -15 || echo "(aucune)"

echo ""
echo "==> 9. JVB colibri (média)"
grep -iE 'colibri|endpoint|Conference' /var/log/jitsi/jvb.log 2>/dev/null | tail -8 || echo "(aucune)"

echo ""
echo "==> Diagnostic approfondi: bash ops/jitsi/diagnose-muc-jid-live.sh ${ROOM}"
