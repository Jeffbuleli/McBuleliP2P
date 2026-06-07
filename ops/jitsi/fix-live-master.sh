#!/bin/bash
# McBuleli Live — master fix: audit → backup → unified baseline → validate.
# Ensures ALL users join the SAME MUC: ${ROOM}@conference.live.mcbuleli.org
#
# Usage (root VPS):
#   cd ~/McBuleliP2P && git pull
#   sudo bash ops/jitsi/fix-live-master.sh [room]
#   sudo bash ops/jitsi/audit-muc-fragmentation.sh [room]
#
# During live test (2 browsers):
#   sudo bash ops/jitsi/capture-muc-join.sh [room]
#   sudo bash ops/jitsi/check-muc-live.sh [room]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
FOCUS="focus.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
REPORT="/tmp/mcbuleli-fix-live-master-$(date +%Y%m%d%H%M%S).log"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root: sudo bash $0"; exit 1; }

exec > >(tee -a "$REPORT") 2>&1
echo "========== fix-live-master.sh =========="
echo "Domain: ${DOMAIN}"
echo "Target MUC: ${ROOM}@${CONFERENCE}"
echo "Report: ${REPORT}"
echo "Started: $(date -Is)"

# Block deprecated foot-gun
if [[ "${ALLOW_DEPRECATED_JITSI_FIXES:-}" != "1" ]]; then
  echo ""
  echo "==> Guard: fix-prosody-jwt-guest.sh is DEPRECATED (causes split MUC)"
  if grep -rq 'fix-prosody-jwt-guest' /etc/cron* ~/McBuleliP2P/ops/jitsi/deploy-live-vps.sh 2>/dev/null; then
    echo "WARN: check deploy scripts do not call fix-prosody-jwt-guest.sh"
  fi
fi

echo ""
echo "==> Phase 0: Pre-fix audit"
bash "$SCRIPT_DIR/audit-muc-fragmentation.sh" "$ROOM" || PRE_FAIL=$?
PRE_FAIL="${PRE_FAIL:-0}"
echo "Pre-audit failures: ${PRE_FAIL}"

echo ""
echo "==> Phase 1: Unified baseline (config + Prosody + nginx + Jicofo/JVB)"
bash "$SCRIPT_DIR/fix-live-unified-baseline.sh"

echo ""
echo "==> Phase 2: nginx dedupe (duplicate /http-bind breaks XMPP)"
bash "$SCRIPT_DIR/fix-nginx-xmpp-dedupe.sh" 2>/dev/null || bash "$SCRIPT_DIR/fix-nginx-xmpp-proxy.sh"

echo ""
echo "==> Phase 3: Force immediate join (prejoin/welcome off)"
bash "$SCRIPT_DIR/fix-config-force-join.sh"

echo ""
echo "==> Phase 4: Jicofo JVM XML limits (disco#info / ping-only)"
bash "$SCRIPT_DIR/fix-jicofo-jvm-xml-limits.sh" 2>/dev/null || systemctl restart jicofo

echo ""
echo "==> Phase 5: Focus + conference allocation"
bash "$SCRIPT_DIR/fix-focus-service-unavailable.sh" 2>/dev/null || \
  bash "$SCRIPT_DIR/fix-jicofo-prosody.sh" 2>/dev/null || true

echo ""
echo "==> Phase 6: Prosody auth vhost + JVB XMPP"
bash "$SCRIPT_DIR/fix-prosody-auth-vhost.sh" 2>/dev/null || true
bash "$SCRIPT_DIR/fix-jvb-force-xmpp-standalone.sh" 2>/dev/null || \
  bash "$SCRIPT_DIR/fix-jvb-force-xmpp.sh" 2>/dev/null || true

echo ""
echo "==> Phase 7: Final service restart"
systemctl restart prosody
sleep 4
systemctl restart jitsi-videobridge2
sleep 3
bash "$SCRIPT_DIR/fix-jicofo-zombie.sh" 2>/dev/null || systemctl restart jicofo
sleep 10
nginx -t && systemctl reload nginx

echo ""
echo "==> Phase 8: Post-fix verification"
bash "$SCRIPT_DIR/verify-config-served.sh" || true
bash "$SCRIPT_DIR/verify-join-hash-parse.sh" "$ROOM" || true

echo ""
echo "==> Phase 9: Coherence audit (must pass)"
if bash "$SCRIPT_DIR/audit-muc-fragmentation.sh" "$ROOM"; then
  AUDIT_OK=1
else
  AUDIT_OK=0
fi

echo ""
echo "========== FIX COMPLETE =========="
echo "Report saved: ${REPORT}"
echo ""
echo "LIVE VALIDATION (required for SUCCESS):"
echo "  1. Close ALL live.mcbuleli.org tabs"
echo "  2. Host joins first via McBuleli app OR:"
echo "     sudo bash ops/jitsi/gen-live-join-url.sh ${ROOM}"
echo "  3. Guest joins 5s later (same room name)"
echo "  4. During join:"
echo "     sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}"
echo "     sudo bash ops/jitsi/check-muc-live.sh ${ROOM}"
echo ""
echo "SUCCESS = target_FOUND + occupant_count=2 + same JID ${ROOM}@${CONFERENCE}"

if [[ "${AUDIT_OK:-0}" -eq 1 ]]; then
  exit 0
else
  echo ""
  echo "WARN: Post-fix audit had failures — review report above"
  exit 1
fi
