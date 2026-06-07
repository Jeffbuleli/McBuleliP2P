#!/bin/bash
# Surveille join EN DIRECT pendant que host+guest rejoignent (60s).
# Usage: sudo bash ops/jitsi/watch-join-live.sh [room]
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
AUTH="auth.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
TARGET="${ROOM}@${CONFERENCE}"
SECS="${WATCH_SECS:-60}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== watch-join-live ${TARGET} (${SECS}s) =========="
echo "AVANT de lancer: fermer tous onglets live.mcbuleli.org"
echo "PENDANT ${SECS}s: host puis guest, onglets AU PREMIER PLAN, Cmd+Shift+R"
echo ""

JICOFO="/var/log/jitsi/jicofo.log"
PROSODY="/var/log/prosody/prosody.log"
J_START=$(wc -l < "$JICOFO" 2>/dev/null || echo 0)
P_START=$(wc -l < "$PROSODY" 2>/dev/null || echo 0)

for ((i = SECS; i >= 1; i--)); do
  printf "\r  %2ds — rejoignez maintenant..." "$i"
  sleep 1
done
printf "\r  surveillance terminée.%-28s\n" ""

echo ""
echo "==> focus@auth (maintenant)"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || echo "(focus absent)"

echo ""
echo "==> Jicofo NOUVEAU (${ROOM} / Allocated / Creating)"
tail -n +"$((J_START + 1))" "$JICOFO" 2>/dev/null | grep -iE "${ROOM}|Allocated|Creating conference|SEVERE|error" | tail -15 || \
  echo "(aucune activité Jicofo pour ${ROOM})"

echo ""
echo "==> Prosody NOUVEAU (MUC / service-unavailable)"
tail -n +"$((P_START + 1))" "$PROSODY" 2>/dev/null | grep -iE "${TARGET}|${ROOM}|service-unavailable|focus\.|not.?allowed" | tail -15 || \
  echo "(aucune ligne MUC/focus)"

echo ""
echo "==> Room MUC"
prosodyctl shell muc room "${TARGET}" 2>&1 | tail -3 || true

echo ""
if tail -n +"$((J_START + 1))" "$JICOFO" 2>/dev/null | grep -qiE "${ROOM}|Allocated.*${CONFERENCE}"; then
  echo "VERDICT: Jicofo a traité la conférence → MUC devrait exister"
elif tail -n +"$((P_START + 1))" "$PROSODY" 2>/dev/null | grep -qi 'service-unavailable'; then
  echo "VERDICT: service-unavailable pendant join → fix-focus-service-unavailable.sh"
  echo "  Puis FERMER onglets + Cmd+Shift+R"
elif prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -q registered; then
  echo "VERDICT: clients XMPP OK mais pas d'allocation Jicofo"
  echo "  → Console Chrome: service-unavailable ou prejoin?"
  echo "  → sudo bash ops/jitsi/fix-config-force-join.sh"
  echo "  → sudo bash ops/jitsi/diagnose-ping-only-served.sh ${ROOM}"
else
  echo "VERDICT: aucun client — rejoindre pendant watch-join-live"
fi
