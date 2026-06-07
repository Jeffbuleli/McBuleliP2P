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
  # grep -c prints 0 and exits 1 when no match — never use "|| echo 0" (yields "0\n0")
  N=$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -c registered 2>/dev/null || true)
  N=${N:-0}
  echo "  sessions registered: ${N}"

  echo ""
  echo "==> 3. Room MUC (host.modules.muc — muc:room() = commande console, pas global Lua)"
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  LUA_SNIP="${SCRIPT_DIR}/lib-prosody-muc-shell.lua"
  LUA_RUN="/tmp/mcb-muc-check-${ROOM}.lua"
  if [[ -f "$LUA_SNIP" ]] && command -v expect >/dev/null 2>&1; then
    sed -e "s|@@MCB_CONFERENCE@@|${CONFERENCE}|g" -e "s|@@MCB_ROOM@@|${ROOM}|g" \
      "$LUA_SNIP" > "$LUA_RUN"
    chmod 644 "$LUA_RUN"
    expect <<EXPECT 2>&1 || true
set timeout 30
log_user 1
spawn prosodyctl shell
expect "prosody>"
send "muc:room('${TARGET}')\r"
expect "prosody>"
send "> return (loadfile('${LUA_RUN}'))()\r"
expect {
    -re {\| Result: (.+)} {}
    "prosody>" {}
    timeout {}
}
send "bye\r"
expect eof
EXPECT
    REPORT="/tmp/mcb-muc-report-${ROOM}.txt"
    if [[ -f "$REPORT" ]]; then
      echo "--- rapport MUC (fichier) ---"
      cat "$REPORT"
    fi
  else
    echo "WARN: ${LUA_SNIP} absent ou expect manquant — git pull"
  fi

  AUTH="auth.${DOMAIN}"
  FOCUS_ONLINE=0
  echo ""
  echo "==> 4. focus + Jicofo (service-unavailable = focus@auth absent)"
  grep -A3 "Component \"focus.${DOMAIN}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null | head -5 || \
    echo "WARN: focus component absent"
  if prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@'; then
    FOCUS_ONLINE=1
    prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus | head -2
  else
    echo "FAIL: focus@${AUTH} non connecté → fix-focus-service-unavailable.sh"
  fi
  tail -120 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE 'Registered|bridge|XmlPullParser|SEVERE|service-unavailable|${ROOM}' | tail -8 || echo "(aucun)"

  echo ""
  echo "==> 5. config.js servi (muc/bosh/ws)"
  curl -s "https://${DOMAIN}/config.js" | grep -iE 'hosts\.muc|bosh|websocket|prejoinPageEnabled|enableWelcomePage' | head -10

  echo ""
  echo "==> 6. Auth clients récents (pas focus@auth)"
  tail -500 /var/log/prosody/prosody.log 2>/dev/null | grep -iE \
    "Authenticated as .*@${DOMAIN}" | grep -vi "focus@auth" | tail -6 || \
    echo "(aucune auth client récente sur ${DOMAIN})"

  MUC_OK=0
  if [[ -f "/tmp/mcb-muc-report-${ROOM}.txt" ]] && grep -q 'OK target_FOUND' "/tmp/mcb-muc-report-${ROOM}.txt" 2>/dev/null; then
    MUC_OK=1
  fi

  JICOFO_ALLOC=0
  grep -qiE "${ROOM}|Allocated.*${CONFERENCE}|Creating conference" /var/log/jitsi/jicofo.log 2>/dev/null && JICOFO_ALLOC=1
  MUC_LOG=0
  grep -qiE "${TARGET}|${ROOM}.*${CONFERENCE}" /var/log/prosody/prosody.log 2>/dev/null && MUC_LOG=1
  PREJOIN_BAD=0
  curl -s "https://${DOMAIN}/config.js" 2>/dev/null | grep -iE 'prejoinPageEnabled|prejoinConfig' | tail -1 | grep -qiE 'true|enabled:\s*true' && PREJOIN_BAD=1

  echo ""
  echo "VERDICT"
  if [[ "$MUC_OK" -eq 1 ]]; then
    grep -E 'occupant_count=' "/tmp/mcb-muc-report-${ROOM}.txt" 2>/dev/null | tail -1 || true
    echo "  SUCCÈS — room MUC active"
  elif [[ "$FOCUS_ONLINE" -eq 0 ]]; then
    echo "  Console: service-unavailable sur conference IQ → focus.${DOMAIN}"
    echo "  Cause: Jicofo pas connecté comme focus@${AUTH}"
    echo "  → sudo bash ops/jitsi/fix-focus-service-unavailable.sh"
  elif [[ "$N" -ge 1 && "$JICOFO_ALLOC" -eq 0 && "$MUC_LOG" -eq 0 ]]; then
    echo "  PING-ONLY ou FOCUS FAIL: ${N} c2s + focus session OK mais ZÉRO Allocated/MUC"
    echo "  → Si console: service-unavailable + Moderator → fix-focus-service-unavailable.sh"
    echo "  → Si console: pas d'erreur focus → conference.join() jamais appelé (JS/prejoin)"
    echo "  1) FERMER tous onglets live.mcbuleli.org (host + guest)"
    echo "  2) sudo bash ops/jitsi/fix-conference-no-room.sh ${ROOM}"
    echo "  3) sudo bash ops/jitsi/diagnose-ping-only-served.sh ${ROOM}"
    echo "  4) sudo bash ops/jitsi/join-test-live.sh ${ROOM}   # capture PUIS ouvrir URL"
    [[ "$PREJOIN_BAD" -eq 1 ]] && echo "  → prejoin encore true: sudo bash ops/jitsi/fix-config-force-join.sh"
    echo "  → requireDisplayName=true (branding) bloque aussi: fix-config-force-join.sh"
  elif [[ "$N" -ge 1 ]]; then
    echo "  Clients XMPP OK (${N} c2s) + focus online mais room absente"
    echo "  → Jicofo alloc=${JICOFO_ALLOC} muc_log=${MUC_LOG} — relancer join après fix"
    echo "  → sudo bash ops/jitsi/fix-conference-no-room.sh ${ROOM}"
    echo "  → sudo bash ops/jitsi/diagnose-focus-online-no-room.sh ${ROOM}"
  else
    echo "  Aucun client sur ${DOMAIN} — ouvrir live.mcbuleli.org puis relancer"
  fi
  echo "  occupant_count=2 = SUCCÈS final"
}

if [[ "$WATCH" == "--watch" || "$WATCH" == "-w" ]]; then
  while true; do run_check; sleep 5; done
else
  run_check
fi
