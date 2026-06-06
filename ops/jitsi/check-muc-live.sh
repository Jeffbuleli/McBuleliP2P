#!/bin/bash
# Vérif MUC SANS shell manuel — une commande, résultat lisible.
# Lance host+guest PUIS exécute ce script (ou --watch pendant le join).
#
# Usage:
#   sudo bash ops/jitsi/check-muc-live.sh test-live-mcbuleli
#   sudo bash ops/jitsi/check-muc-live.sh test-live-mcbuleli --watch
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
WATCH="${2:-}"
TARGET="${ROOM}@${CONFERENCE}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "sudo requis"; exit 1; }

run_check() {
  echo ""
  echo "========== $(date -u '+%H:%M:%S UTC') — ${TARGET} =========="

  echo ""
  echo "==> 1. Services"
  systemctl is-active prosody jicofo jitsi-videobridge2 nginx 2>/dev/null | paste - - - - || true

  echo ""
  echo "==> 2. Clients XMPP connectés (c2s — pas de shell)"
  prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | head -25 || \
    echo "(c2s show indisponible)"

  echo ""
  echo "==> 3. Room MUC (expect automatique — vous ne tapez rien)"
  LUA_RUN="/tmp/mcb-muc-check-${ROOM}.lua"
  sed -e "s|@@MCB_CONFERENCE@@|${CONFERENCE}|g" -e "s|@@MCB_ROOM@@|${ROOM}|g" \
    "${SCRIPT_DIR}/lib-prosody-muc-shell.lua" > "$LUA_RUN"

  if command -v expect >/dev/null 2>&1; then
    expect -c "
      set timeout 20
      log_user 1
      spawn prosodyctl shell
      expect \"prosody>\"
      send \"> assert(loadfile(\\\"${LUA_RUN}\\\"))()\r\"
      expect \"prosody>\"
      send \"bye\r\"
      expect eof
    " 2>/dev/null || echo "WARN: expect prosody shell échoué"
  else
    echo "SKIP expect — apt install -y expect"
  fi

  echo ""
  echo "==> 4. Logs Prosody (muc / room / erreurs — 3 min)"
  tail -500 /var/log/prosody/prosody.log 2>/dev/null | grep -iE \
    "${ROOM}|${CONFERENCE}|conference\.guest|not.?allowed|muc_domain|occupant|presence.*muc" \
    | tail -20 || echo "(aucune ligne muc)"

  echo ""
  echo "==> 5. Jicofo conférence"
  tail -300 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE \
    "${ROOM}|Allocated|Creating conference|conference-request" | tail -10 || \
    echo "(aucune — clients pas en MUC ou Jicofo idle)"

  echo ""
  echo "==> 6. Endpoints XMPP"
  for p in /http-bind /xmpp-websocket; do
    printf "  %s → " "$p"
    curl -sI -o /dev/null -w '%{http_code}\n' "https://${DOMAIN}${p}" 2>/dev/null || echo "ERR"
  done

  echo ""
  echo "VERDICT"
  if tail -500 /var/log/prosody/prosody.log 2>/dev/null | grep -q "${TARGET}"; then
    echo "  LOG: références à ${TARGET} — join MUC probable"
  else
    echo "  LOG: aucune trace ${TARGET} — auth OK mais pas entré en salle (websocket?)"
  fi
  echo "  Cherchez ci-dessus: target_FOUND occupant_count=2 = SUCCÈS"
  echo "  target_MISSING = post-auth drop → bash ops/jitsi/fix-nginx-websocket-complete.sh"
}

if [[ "$WATCH" == "--watch" || "$WATCH" == "-w" ]]; then
  echo "Watch mode — host+guest ouverts, Ctrl+C pour arrêter"
  while true; do run_check; sleep 5; done
else
  run_check
fi
