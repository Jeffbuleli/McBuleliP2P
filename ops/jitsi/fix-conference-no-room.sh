#!/bin/bash
# focus online mais room absente / 2 comptes isolés — restart propre + vérif allocation.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix conference no-room (${ROOM}) =========="

echo ""
echo "==> 1. Kill zombies + restart Jicofo/JVB"
bash "$SCRIPT_DIR/fix-jicofo-zombie.sh"
systemctl restart jitsi-videobridge2
sleep 15

echo ""
echo "==> 2. focus@auth + Registered + bridge"
FOCUS_OK=0
if prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@'; then
  FOCUS_OK=1
  prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus | head -3
else
  echo "focus absent — resync complète"
  bash "$SCRIPT_DIR/fix-focus-service-unavailable.sh"
  FOCUS_OK=1
fi

grep -iE 'Registered|Added new videobridge' /var/log/jitsi/jicofo.log 2>/dev/null | tail -4 || {
  echo "WARN: pas de Registered récent"
  bash "$SCRIPT_DIR/fix-jicofo-prosody.sh"
  sleep 12
  grep -iE 'Registered|Added new videobridge' /var/log/jitsi/jicofo.log 2>/dev/null | tail -4 || true
}

echo ""
echo "==> 3. Navigateur — OBLIGATOIRE après restart Jicofo"
echo "  • Fermer TOUS les onglets live.mcbuleli.org (host + guest)"
echo "  • Rouvrir via app McBuleli (ou gen-live-join-url.sh)"
echo "  • Host d'abord, 5 secondes, puis guest"
echo "  • Cmd+Shift+R sur chaque onglet si erreurs service-unavailable persistent"

echo ""
echo "==> 4. Pendant le join (30s):"
echo "  sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}"
echo "  sudo bash ops/jitsi/check-muc-live.sh ${ROOM}"
