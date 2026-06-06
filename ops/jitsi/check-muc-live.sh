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
  echo "==> 3. Room MUC (lib-prosody-muc-shell.lua — muc global nil en console)"
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  LUA_SNIP="${SCRIPT_DIR}/lib-prosody-muc-shell.lua"
  LUA_RUN="/tmp/mcb-muc-check-${ROOM}.lua"
  if [[ -f "$LUA_SNIP" ]] && command -v expect >/dev/null 2>&1; then
    sed -e "s|@@MCB_CONFERENCE@@|${CONFERENCE}|g" -e "s|@@MCB_ROOM@@|${ROOM}|g" \
      "$LUA_SNIP" > "$LUA_RUN"
    expect <<EXPECT 2>&1 || true
set timeout 30
log_user 1
spawn prosodyctl shell
expect "prosody>"
send "> assert(loadfile(\"${LUA_RUN}\"))()\r"
expect "prosody>"
send "bye\r"
expect eof
EXPECT
  else
    echo "WARN: ${LUA_SNIP} absent ou expect manquant — git pull"
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
  echo "  → bash ops/jitsi/capture-muc-join.sh ${ROOM}"
  echo "  occupant_count=2 = SUCCÈS"
}

if [[ "$WATCH" == "--watch" || "$WATCH" == "-w" ]]; then
  while true; do run_check; sleep 5; done
else
  run_check
fi
