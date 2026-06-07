#!/bin/bash
# service-unavailable sur conference IQ alors que focus@auth semble online.
# Cause fréquente: client_proxy stale + sessions c2s zombies + mdp focus désync.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix-focus-hard-reset =========="
echo "Console: service-unavailable + Moderator Failed + PreJoin rejected"
echo ""
echo "AVANT: fermer TOUS les onglets live.mcbuleli.org (vous aviez peut-être 4+ c2s)"
echo ""

echo "==> 1. Stop Jicofo + JVB"
systemctl stop jicofo jitsi-videobridge2 2>/dev/null || true
bash "$SCRIPT_DIR/fix-jicofo-zombie.sh" 2>/dev/null || true

echo ""
echo "==> 2. Restart Prosody (purge client_proxy + c2s stale)"
systemctl restart prosody
sleep 6

echo ""
echo "==> 3. Resync mdp focus/jvb + jicofo.conf + brewery"
bash "$SCRIPT_DIR/fix-jicofo-prosody.sh"

echo ""
echo "==> 4. Start JVB + Jicofo"
systemctl start jitsi-videobridge2
sleep 5
systemctl start jicofo
sleep 15

echo ""
echo "==> 5. Vérification"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || {
  echo "FAIL: focus@${AUTH} absent après reset"
  tail -20 /var/log/jitsi/jicofo.log 2>/dev/null
  exit 1
}
grep -iE 'Registered|Added new videobridge' /var/log/jitsi/jicofo.log 2>/dev/null | tail -4

C2S_N=$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -c registered 2>/dev/null || true)
C2S_N=${C2S_N:-0}
echo "c2s ${DOMAIN}: ${C2S_N} (attendu 0 avant nouveau join)"

echo ""
echo "==> 6. TEST navigateur — règles strictes"
echo "  • URL avec ?jwt= (gen-live-join-url.sh) — vérifier jwt dans barre d'adresse"
echo "  • Fenêtre PRIVÉE, onglet TOP-LEVEL (pas iframe McBuleli)"
echo "  • NE PAS utiliser l'app pendant ce test"
echo "  • Cmd+Shift+R après ouverture"
echo ""
bash "$SCRIPT_DIR/gen-live-join-url.sh" test-live-mcbuleli
