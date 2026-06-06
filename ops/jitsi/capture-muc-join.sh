#!/bin/bash
# Capture stanzas XMPP pendant join — lancer PUIS host+guest dans les N secondes.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
TARGET="${ROOM}@${CONFERENCE}"
SECS="${CAPTURE_SECS:-30}"
OUT="/tmp/mcb-muc-stanzas-${ROOM}.log"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
command -v expect >/dev/null 2>&1 || { echo "apt install -y expect"; exit 1; }

# Vérifier nginx XMPP
CODE="$(curl -sI -o /dev/null -w '%{http_code}' "https://${DOMAIN}/xmpp-websocket" 2>/dev/null || echo 000)"
echo "xmpp-websocket HTTP ${CODE} (attendu 200/400, pas 502)"
if [[ "$CODE" == "502" || "$CODE" == "000" ]]; then
  echo "ERREUR nginx — lancez: sudo bash ops/jitsi/fix-nginx-xmpp-dedupe.sh"
  exit 1
fi

: > "$OUT"
echo "Capture ${SECS}s → $OUT"
echo ">>> MAINTENANT: host + guest rejoignent ${ROOM} <<<"
echo ""

expect <<EXPECT 2>&1 | tee -a "$OUT"
set timeout 60
log_user 1
spawn prosodyctl shell
expect "prosody>"
send "watch:stanzas('${DOMAIN}')\r"
sleep ${SECS}
send "\x03"
expect {
    "prosody>" {}
    timeout {}
}
send "bye\r"
expect eof
EXPECT

echo ""
echo "==> Filtré MUC / ${ROOM}"
grep -iE "${ROOM}|${CONFERENCE}|presence|muc|not.?allowed|error|focus|unavailable" "$OUT" | tail -40 || \
  echo "(rien — pas de stanzas pendant ${SECS}s)"

echo ""
if grep -qiE "not.?allowed|policy-violation|forbidden" "$OUT"; then
  echo "VERDICT: JWT/token rejeté sur join MUC"
elif grep -qi "${TARGET}" "$OUT"; then
  echo "VERDICT: join MUC vers ${TARGET} détecté"
else
  echo "VERDICT: aucun join — nginx websocket ou clients pas connectés pendant capture"
fi
