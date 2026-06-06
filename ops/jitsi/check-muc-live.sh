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
  echo "==> 2. c2s (Security doit être secure/TLS, pas insecure)"
  prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | head -12 || true
  if prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -q insecure; then
    echo "  *** ALERTE: sessions insecure → bash ops/jitsi/fix-prosody-websocket-global.sh"
  fi

  echo ""
  echo "==> 3. muc:room() via expect (inline — pas loadfile)"
  if command -v expect >/dev/null 2>&1; then
    expect -c "
      set timeout 20
      log_user 1
      spawn prosodyctl shell
      expect \"prosody>\"
      send \"> local r=muc:room('${TARGET}')\r\"
      expect \"prosody>\"
      send \"> if r then print('target_FOUND ${TARGET}') else print('target_MISSING ${TARGET}') end\r\"
      expect \"prosody>\"
      send \"> if r then local n=0; for o in r:each_occupant() do n=n+1; print('occupant',n,o.nick,o.bare_jid) end; print('occupant_count='..n) end\r\"
      expect \"prosody>\"
      send \"> for name in pairs(prosody.hosts) do if name:find('conference') then print('muc_host',name) end end\r\"
      expect \"prosody>\"
      send \"bye\r\"
      expect eof
    " 2>/dev/null || echo "WARN: expect failed"
  else
    echo "apt install -y expect"
  fi

  echo ""
  echo "==> 4. jigasi parasite ?"
  grep -i 'jigasi\.meet' /var/log/prosody/prosody.log 2>/dev/null | tail -2 || echo "OK"

  echo ""
  echo "==> 5. Logs MUC récents"
  tail -400 /var/log/prosody/prosody.log 2>/dev/null | grep -iE \
    "${ROOM}|${TARGET}|not.?allowed|presence" | tail -15 || echo "(aucune)"

  echo ""
  echo "==> 6. Jicofo"
  tail -200 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE \
    "${ROOM}|Allocated|Creating" | tail -6 || echo "(aucune)"

  echo ""
  echo "VERDICT: occupant_count=2 + secure c2s = SUCCÈS"
}

if [[ "$WATCH" == "--watch" || "$WATCH" == "-w" ]]; then
  while true; do run_check; sleep 5; done
else
  run_check
fi
