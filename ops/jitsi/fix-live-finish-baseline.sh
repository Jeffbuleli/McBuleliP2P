#!/bin/bash
# Si fix-live-unified-baseline s'est arrêté à apply-jitsi-jwt — finir étapes 4-7.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "==> Kill jigasi.meet.jitsi"
bash "$SCRIPT_DIR/fix-prosody-kill-jigasi-host.sh"

echo ""
echo "==> WebSocket global (fix insecure c2s)"
bash "$SCRIPT_DIR/fix-prosody-websocket-global.sh"

echo ""
echo "==> nginx websocket"
bash "$SCRIPT_DIR/fix-nginx-websocket-complete.sh"

echo ""
echo "==> Jicofo + JVB"
bash "$SCRIPT_DIR/fix-jicofo-localhost.sh" || true
bash "$SCRIPT_DIR/fix-jitsi-brewery-complete.sh" || true
bash "$SCRIPT_DIR/fix-jicofo-zombie.sh" || true

prosodyctl check config 2>&1 | tail -10 || true
systemctl restart prosody
sleep 4
systemctl restart jitsi-videobridge2 jicofo
systemctl reload nginx
sleep 5

systemctl is-active prosody jicofo jitsi-videobridge2 nginx
echo ""
echo "OK — test: sudo bash ops/jitsi/check-muc-live.sh test-live-mcbuleli"
