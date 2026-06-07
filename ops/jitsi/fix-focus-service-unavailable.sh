#!/bin/bash
# focus.live → service-unavailable sur conference IQ : resync Jicofo ↔ client_proxy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix focus service-unavailable =========="
echo "Console: StropheErrorHandler service-unavailable + Moderator giving up"
echo "Cause: IQ conference vers focus.${JITSI_DOMAIN:-live.mcbuleli.org} — client_proxy ne route pas vers Jicofo"
echo ""

exec bash "$SCRIPT_DIR/fix-focus-iq-route.sh"
