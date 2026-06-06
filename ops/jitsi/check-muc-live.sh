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
  echo "==> 2. c2s (connectez host+guest AVANT ce script)"
  prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | head -12 || true
  N="$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -c registered || echo 0)"
  echo "  sessions registered: ${N}"

  echo ""
  echo "==> 3. Room MUC"
  if command -v expect >/dev/null 2>&1; then
    expect <<EXPECT 2>&1 || true
set timeout 30
log_user 1
spawn prosodyctl shell
expect "prosody>"
send "> local jid='${TARGET}'; local h=prosody.hosts['${CONFERENCE}']; local mm=h and h:get_module('muc'); local r=mm and mm.get_room_from_jid and mm:get_room_from_jid(jid); if r then print('target_FOUND '..jid) else print('target_MISSING '..jid) end\r"
expect "prosody>"
send "> if r then local n=0; for o in r:each_occupant() do n=n+1; print('occupant',n,tostring(o.nick)) end; print('occupant_count='..tostring(n)) end\r"
expect "prosody>"
send "bye\r"
expect eof
EXPECT
  fi

  echo ""
  echo "==> 4. Logs MUC récents"
  tail -400 /var/log/prosody/prosody.log 2>/dev/null | grep -iE \
    "${ROOM}|${TARGET}|not.?allowed|token|presence" | tail -12 || echo "(aucune)"

  echo ""
  echo "==> 5. Jicofo"
  tail -150 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE "${ROOM}|Allocated" | tail -5 || echo "(aucune)"

  echo ""
  echo "VERDICT: occupant_count=2 = OK | target_MISSING + c2s>=2 = join MUC échoue"
  echo "  nginx 502 → bash ops/jitsi/fix-nginx-xmpp-dedupe.sh"
}

if [[ "$WATCH" == "--watch" || "$WATCH" == "-w" ]]; then
  while true; do run_check; sleep 5; done
else
  run_check
fi
