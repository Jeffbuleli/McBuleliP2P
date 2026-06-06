#!/bin/bash
# Capture stanzas XMPP pendant join — SANS shell manuel.
# Lancer PUIS host+guest rejoignent dans les 20s.
#
# Usage: sudo bash ops/jitsi/capture-muc-join.sh test-live-mcbuleli
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
TARGET="${ROOM}@${CONFERENCE}"
SECS="${CAPTURE_SECS:-25}"
OUT="/tmp/mcb-muc-stanzas-${ROOM}.log"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
command -v expect >/dev/null 2>&1 || { echo "apt install -y expect"; exit 1; }

: > "$OUT"
echo "Capture ${SECS}s → $OUT"
echo "MAINTENANT: host + guest rejoignent test-live-mcbuleli"
echo ""

expect <<EXPECT | tee -a "$OUT"
set timeout [expr {$SECS + 10}]
log_user 1
spawn prosodyctl shell
expect "prosody>"
send "watch:stanzas('${DOMAIN}')\r"
expect {
    -re "presence|iq|message|conference|${ROOM}" {
        exp_continue
    }
    timeout {
        send "\x03"
    }
}
expect "prosody>" { send "bye\r" }
expect eof
EXPECT

echo ""
echo "==> Filtré MUC / ${ROOM}"
grep -iE "${ROOM}|${CONFERENCE}|presence|muc|not.?allowed|error|focus" "$OUT" | tail -40 || \
  echo "(rien — clients n'envoient pas de join MUC)"

echo ""
echo "Interprétation:"
echo "  presence to ${TARGET} → join MUC OK"
echo "  not-allowed / error → JWT room ou token_verification"
echo "  rien → disconnect client avant join"
