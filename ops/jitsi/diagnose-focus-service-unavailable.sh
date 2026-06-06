#!/bin/bash
# Console: service-unavailable sur conference request IQ → focus.live.mcbuleli.org
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"

echo "========== diagnose focus service-unavailable (${ROOM}) =========="

echo ""
echo "==> 1. Composant focus Prosody"
grep -A4 "Component \"focus.${DOMAIN}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null || \
  echo "FAIL: focus.${DOMAIN} absent → fix-jitsi-brewery-complete.sh"

echo ""
echo "==> 2. Jicofo processus + service"
systemctl is-active jicofo 2>/dev/null || echo "inactive"
pgrep -af 'org.jitsi.jicofo|jicofo\.jar' 2>/dev/null | head -3 || echo "(aucun processus jicofo)"

echo ""
echo "==> 3. focus@auth connecté ? (client_proxy exige session c2s Jicofo)"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || \
  echo "FAIL: focus@${AUTH} PAS connecté → cause #1 de service-unavailable"

echo ""
echo "==> 4. Jicofo.conf (muc-jid + client-proxy)"
grep -E 'conference-muc-jid|client-proxy|hostname|domain' /etc/jitsi/jicofo/jicofo.conf 2>/dev/null | head -8

echo ""
echo "==> 5. Jicofo.log récent"
grep -iE 'Registered|Authenticated|Connected|XmlPullParser|SEVERE|service-unavailable|conference' \
  /var/log/jitsi/jicofo.log 2>/dev/null | tail -12 || echo "(vide)"

echo ""
echo "==> 6. JVB dans brewery"
grep -iE 'Added new videobridge|Removed|bridge' /var/log/jitsi/jicofo.log 2>/dev/null | tail -4 || \
  echo "(aucun bridge — conf peut échouer après focus OK)"

echo ""
echo "INTERPRÉTATION"
echo "  service-unavailable + focus@auth absent = Jicofo déconnecté (zombie, XML parse, mdp)"
echo "  → sudo bash ops/jitsi/fix-focus-service-unavailable.sh"
