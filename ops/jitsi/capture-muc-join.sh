#!/bin/bash
# Capture stanzas — surveille conference.* (pas seulement live.*).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
TARGET="${ROOM}@${CONFERENCE}"
SECS="${CAPTURE_SECS:-30}"
OUT="/tmp/mcb-muc-stanzas-${ROOM}.log"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
command -v expect >/dev/null 2>&1 || { echo "apt install -y expect"; exit 1; }

CODE="$(curl -sI -o /dev/null -w '%{http_code}' "https://${DOMAIN}/xmpp-websocket" 2>/dev/null || echo 000)"
echo "xmpp-websocket HTTP ${CODE}"
[[ "$CODE" == "502" || "$CODE" == "000" ]] && { echo "nginx cassé → fix-nginx-xmpp-dedupe.sh"; exit 1; }

: > "$OUT"
echo "Capture ${SECS}s → $OUT"
echo ">>> Host + guest dans l'UI Jitsi (pas juste onglet ouvert) <<<"
echo ""

expect <<EXPECT 2>&1 | tee -a "$OUT"
set timeout 90
log_user 1
spawn prosodyctl shell
expect "prosody>"
send "watch:stanzas('${CONFERENCE}')\r"
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
echo "==> Stanzas MUC / ${ROOM} sur ${CONFERENCE}"
grep -iE "${ROOM}|${TARGET}|presence|muc|not.?allowed|error|unavailable|focus" "$OUT" | tail -40 || \
  echo "(aucune stanza MUC — clients bloqués AVANT join)"

echo ""
echo "==> Stanzas live.${DOMAIN} (ping seul = bloqué après auth)"
grep -iE "ping|presence|${ROOM}" "$OUT" | grep -i "${DOMAIN}" | tail -10 || true

echo ""
if grep -qiE "not.?allowed|policy-violation|forbidden" "$OUT"; then
  echo "VERDICT: JWT/token rejeté au join MUC"
elif grep -qi "${TARGET}" "$OUT"; then
  echo "VERDICT: join MUC ${TARGET} détecté"
elif grep -qi "ping" "$OUT" && ! grep -qi "${CONFERENCE}" "$OUT"; then
  echo "VERDICT: XMPP connecté mais Jitsi n'initie PAS la conférence (ping-only)"
  echo "  → vérifier console navigateur (F12) + config.js + focus component"
else
  echo "VERDICT: pas de trafic pendant capture — rejoignez PENDANT les ${SECS}s"
fi
