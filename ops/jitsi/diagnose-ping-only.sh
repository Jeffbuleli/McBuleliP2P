#!/bin/bash
# Symptôme: 2 c2s secure, ping-only, pas de MUC — diagnostic ciblé.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"

echo "========== diagnose-ping-only ${ROOM} =========="

echo ""
echo "==> 1. focus component"
grep -A5 "Component \"focus.${DOMAIN}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null || \
  echo "FAIL: pas de focus.${DOMAIN}"

echo ""
echo "==> 2. Jicofo"
grep -iE 'Registered|Authenticated|Added new videobridge|SEVERE|error' /var/log/jitsi/jicofo.log 2>/dev/null | tail -8

echo ""
echo "==> 3. JWT sur conf.d (actif)"
grep -nE 'authentication|app_id|app_secret|token_verification' \
  /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null | head -15

echo ""
echo "==> 4. config.js servi"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'hosts\.muc|prejoin|welcome|anonymousdomain|bosh|websocket' | head -12

echo ""
echo "==> 5. Test page room (doit être 200 avec jwt)"
echo -n "  sans jwt: "
curl -sI -o /dev/null -w '%{http_code}\n' "https://${DOMAIN}/${ROOM}"
echo -n "  avec jwt=fake: "
curl -sI -o /dev/null -w '%{http_code}\n' "https://${DOMAIN}/${ROOM}?jwt=test"

echo ""
echo "==> 6. Valeurs effectives config.js"
bash "$(dirname "$0")/verify-config-served.sh" 2>/dev/null || true

echo ""
echo "INTERPRÉTATION ping-only"
echo "  XMPP OK + ping = client authentifié mais conference.join() jamais appelé"
echo "  Cause #1 (90%): écran pré-join — bouton « Rejoindre » pas cliqué OU prejoin encore true"
echo "  Cause #2: erreur JS navigateur (F12 → conference / muc / token / GUM)"
echo "  Cause #3: onglet ouvert sans passer par l'app McBuleli (hash #config.prejoin... absent)"
echo "  Actions:"
echo "    sudo bash ops/jitsi/fix-config-force-join.sh && sudo bash ops/jitsi/verify-config-served.sh"
echo "    sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}  # lancer PUIS rejoindre dans les 30s"
echo "    Host + guest via l'app McBuleli, Ctrl+Shift+R, caméra autorisée"
