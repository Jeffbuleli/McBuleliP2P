#!/bin/bash
# Vérif MUC — une commande, pas de shell manuel.
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
  echo "==> 1. Services"
  systemctl is-active prosody jicofo jitsi-videobridge2 nginx 2>/dev/null | paste - - - - || true

  echo ""
  echo "==> 2. consider_websocket_secure configuré ?"
  grep -hE 'consider_websocket_secure|consider_bosh_secure' \
    /etc/prosody/prosody.cfg.lua /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null | head -6 || \
    echo "MANQUANT → bash ops/jitsi/fix-prosody-websocket-global.sh"

  echo ""
  echo "==> 3. c2s connectés"
  prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | head -10 || true

  echo ""
  echo "==> 4. Room MUC (modulemanager — muc global souvent nil)"
  if command -v expect >/dev/null 2>&1; then
    expect -c "
      set timeout 25
      log_user 1
      spawn prosodyctl shell
      expect \"prosody>\"
      send \"> local mm=require('core.modulemanager').get_module('${CONFERENCE}','muc')\r\"
      expect \"prosody>\"
      send \"> local r=mm and mm.get_room_from_jid and mm:get_room_from_jid('${TARGET}')\r\"
      expect \"prosody>\"
      send \"> if r then print('target_FOUND ${TARGET}') else print('target_MISSING ${TARGET}') end\r\"
      expect \"prosody>\"
      send \"> if r then local n=0; for o in r:each_occupant() do n=n+1; print('occupant',n,tostring(o.nick),tostring(o.bare_jid)) end; print('occupant_count='..n) end\r\"
      expect \"prosody>\"
      send \"bye\r\"
      expect eof
    " 2>/dev/null || echo "WARN: expect failed"
  fi

  echo ""
  echo "==> 5. jigasi dans /etc/prosody (doit être vide)"
  grep -rl 'jigasi\.meet\.jitsi' /etc/prosody/ 2>/dev/null | head -5 || echo "OK"

  echo ""
  echo "==> 6. Logs MUC (depuis dernier restart prosody)"
  RESTART="$(systemctl show prosody -p ActiveEnterTimestamp --value 2>/dev/null || echo '')"
  echo "  prosody restart: ${RESTART:-?}"
  tail -600 /var/log/prosody/prosody.log 2>/dev/null | grep -iE \
    "${ROOM}|${TARGET}|presence|muc.*${ROOM}|not.?allowed|token" | tail -15 || echo "(aucune)"

  echo ""
  echo "==> 7. Jicofo"
  tail -200 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE \
    "${ROOM}|Allocated|Creating" | tail -6 || echo "(aucune)"

  echo ""
  echo "VERDICT"
  echo "  occupant_count=2 → SUCCÈS"
  echo "  target_MISSING + 2 c2s → auth OK, join MUC échoue → fix-prosody-websocket-global + finish-baseline"
  echo "  'insecure' dans c2s = souvent NORMAL derrière nginx (HTTP local)"
}

if [[ "$WATCH" == "--watch" || "$WATCH" == "-w" ]]; then
  while true; do run_check; sleep 5; done
else
  run_check
fi
