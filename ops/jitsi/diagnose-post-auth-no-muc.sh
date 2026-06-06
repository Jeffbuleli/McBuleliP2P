#!/bin/bash
# Auth @live.mcbuleli.org OK mais zéro join MUC + disconnect — diagnostic ciblé.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
ROOM="${1:-test-live-mcbuleli}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

echo "=============================================="
echo " Post-auth drop — pas de MUC join"
echo "=============================================="

echo ""
echo "==> 1. Modules bosh/websocket sur VirtualHost ${DOMAIN}"
grep -A40 "VirtualHost \"${DOMAIN}\"" "$CFG" | grep -E 'modules_enabled|bosh|websocket|consider_|c2s_require' | head -15

echo ""
echo "==> 2. MUC token_verification"
grep -A25 "Component \"conference.${DOMAIN}\"" "$CFG" | grep -E 'modules_enabled|token_verification|muc_' | head -10

echo ""
echo "==> 3. nginx XMPP proxy (timeouts + X-Forwarded-Proto)"
grep -E 'xmpp-websocket|http-bind|proxy_read_timeout|X-Forwarded-Proto' \
  /etc/nginx/snippets/mcbuleli-xmpp-proxy.conf 2>/dev/null || echo "WARN: snippet absent"

echo ""
echo "==> 4. Endpoints"
for path in /http-bind /xmpp-websocket; do
  code="$(curl -sI -o /dev/null -w '%{http_code}' "https://${DOMAIN}${path}" 2>/dev/null || echo 000)"
  echo "  ${path} → HTTP ${code}"
done

echo ""
echo "==> 5. Prosody — erreurs token / muc / not-allowed (30 dernières lignes)"
grep -iE 'not.?allowed|forbidden|token|affiliation|muc|${ROOM}|error|unexpected eof' \
  /var/log/prosody/prosody.log 2>/dev/null | tail -30 || echo "(aucune)"

echo ""
echo "==> 6. config.js — transport XMPP client"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'bosh|websocket|hosts\.muc|anonymousdomain' | head -10

echo ""
echo "==> 7. Jicofo — conférences (fichier log)"
grep -iE "${ROOM}|Allocated|Creating|conference-request" /var/log/jitsi/jicofo.log 2>/dev/null | tail -10 || \
  echo "(aucune — normal si clients ne joignent pas MUC)"

echo ""
echo "INTERPRÉTATION"
echo "  A) bosh/websocket absents du vhost → fix-prosody-live-websocket.sh"
echo "  B) snippet nginx sans X-Forwarded-Proto/timeouts → fix-nginx-websocket-complete.sh"
echo "  C) lignes not-allowed/token sur muc → JWT room claim ou secret"
echo "  D) tout OK mais disconnect → Ctrl+Shift+R navigateur + retest 60s"
