#!/bin/bash
# Vérif MUC — une commande.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
WATCH="${2:-}"
TARGET="${ROOM}@${CONFERENCE}"

[[ "$(id -u)" -eq 0 ]] || { echo "sudo requis"; exit 1; }

run_check() {
  echo ""
  echo "========== $(date -u '+%H:%M:%S UTC') — ${TARGET} =========="

  echo ""
  echo "==> 1. nginx XMPP"
  for p in /http-bind /xmpp-websocket; do
    printf "  %s → " "$p"
    curl -sI -o /dev/null -w '%{http_code}\n' "https://${DOMAIN}${p}" 2>/dev/null || echo ERR
  done

  echo ""
  echo "==> 2. c2s (host+guest connectés AVANT ce script)"
  prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | head -12 || true
  N="$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -c registered || echo 0)"
  echo "  sessions registered: ${N}"

  echo ""
  echo "==> 3. Room MUC (commande console muc:room — pas de guillemets Tcl)"
  if command -v expect >/dev/null 2>&1; then
    expect <<EXPECT 2>&1 || true
set timeout 30
log_user 1
spawn prosodyctl shell
expect "prosody>"
send "local r = muc:room(\"${TARGET}\"); if r then print(\"target_FOUND ${TARGET}\") else print(\"target_MISSING ${TARGET}\") end\r"
expect "prosody>"
send "if r then local n=0; for o in r:each_occupant() do n=n+1; print(\"occupant\", n, o.nick) end; print(\"occupant_count=\"..tostring(n)) end\r"
expect "prosody>"
send "bye\r"
expect eof
EXPECT
  fi

  echo ""
  echo "==> 4. focus + Jicofo"
  grep -A3 "Component \"focus.${DOMAIN}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null | head -5 || \
    echo "WARN: focus component absent"
  tail -80 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE 'Registered|bridge|${ROOM}|error|SEVERE' | tail -6 || echo "(aucun)"

  echo ""
  echo "==> 5. config.js servi (muc/bosh/ws)"
  curl -s "https://${DOMAIN}/config.js" | grep -iE 'hosts\.muc|bosh|websocket|prejoinPageEnabled|enableWelcomePage' | head -10

  echo ""
  echo "==> 6. Logs conference.*"
  tail -300 /var/log/prosody/prosody.log 2>/dev/null | grep -iE \
    "${ROOM}|${CONFERENCE}|not.?allowed|token|focus" | tail -12 || echo "(aucune)"

  echo ""
  echo "VERDICT"
  echo "  ping-only (capture) = clients connectés mais n'envoient PAS de join MUC"
  echo "  → bash ops/jitsi/capture-muc-join.sh (surveille conference.*)"
  echo "  occupant_count=2 = SUCCÈS"
}

if [[ "$WATCH" == "--watch" || "$WATCH" == "-w" ]]; then
  while true; do run_check; sleep 5; done
else
  run_check
fi
