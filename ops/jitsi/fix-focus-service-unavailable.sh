#!/bin/bash
# focus.live → service-unavailable sur conference IQ : resync Jicofo ↔ client_proxy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix focus service-unavailable =========="

echo ""
echo "==> 1. Limites JVM XML (évite XmlPullParser → déco Jicofo)"
bash "$SCRIPT_DIR/fix-jicofo-jvm-xml-limits.sh"

echo ""
echo "==> 2. Resync Jicofo/Prosody (focus+jvb, localhost, brewery, composants)"
bash "$SCRIPT_DIR/fix-jicofo-prosody.sh"

echo ""
echo "==> 3. Vérification focus@auth"
sleep 3
if prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi focus; then
  echo "OK: focus@${AUTH} session active"
  prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus | head -2
else
  echo "WARN: focus@${AUTH} toujours absent — journalctl:"
  journalctl -u jicofo -n 25 --no-pager | tail -15
  exit 1
fi

echo ""
echo "==> 4. Jicofo Registered + bridge"
grep -iE 'Registered|Added new videobridge' /var/log/jitsi/jicofo.log 2>/dev/null | tail -4 || true

echo ""
echo "OK — retest navigateur (Cmd+Shift+R sur live.mcbuleli.org), puis:"
echo "  sudo bash ops/jitsi/capture-muc-join.sh test-live-mcbuleli"
echo "  sudo bash ops/jitsi/check-muc-live.sh test-live-mcbuleli"
