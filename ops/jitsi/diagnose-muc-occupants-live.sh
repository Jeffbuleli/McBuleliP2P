#!/bin/bash
# Diagnostic MUC RÉEL pendant join host+guest.
# Liste rooms actives, occupants, JID exact — détecte split multi-tenant.
#
# Usage:
#   sudo bash ops/jitsi/diagnose-muc-occupants-live.sh test-live-mcbuleli
#   sudo bash ops/jitsi/diagnose-muc-occupants-live.sh test-live-mcbuleli --watch
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
WATCH="${2:-}"
TARGET_JID="${ROOM}@${CONFERENCE}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

run_once() {
  echo ""
  echo "========== $(date -u '+%Y-%m-%d %H:%M:%S UTC') =========="
  echo "Cible: ${TARGET_JID}"
  echo ""

  echo "==> A. Config — muc_domain_mapper / subdomain / domain_mapper"
  echo "--- /etc/prosody ---"
  grep -RIn --include='*.lua' -E 'muc_domain_mapper|domain_mapper|subdomain' /etc/prosody/ 2>/dev/null | grep -v '\.disabled' | head -30 || echo "(aucune ligne)"
  echo ""
  echo "--- /etc/jitsi ---"
  grep -RIn -E 'muc_domain_mapper|domain_mapper|subdomain|hosts\.muc|anonymousdomain' \
    /etc/jitsi/meet/ /etc/jitsi/jicofo/ 2>/dev/null | grep -v '// enableLobbyChat' | head -35 || echo "(aucune ligne)"
  echo ""
  echo "--- config.js SERVI (muc / subdomain) ---"
  curl -s "https://${DOMAIN}/config.js" 2>/dev/null | grep -iE 'subdomain|hosts\.muc|muc:|anonymousdomain|domain_mapper' | head -12 || true

  echo ""
  echo "==> B. Prosody shell — muc:room() + occupants (mod_admin_shell)"
  if ! command -v prosodyctl >/dev/null 2>&1; then
    echo "ERREUR: prosodyctl absent"
    return 1
  fi

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  LUA_SNIP="${SCRIPT_DIR}/lib-prosody-muc-shell.lua"
  LUA_RUN="/tmp/mcb-muc-check-${ROOM}.lua"
  if [[ ! -f "$LUA_SNIP" ]]; then
    echo "ERREUR: $LUA_SNIP absent — git pull"
    return 1
  fi
  sed -e "s|@@MCB_CONFERENCE@@|${CONFERENCE}|g" -e "s|@@MCB_ROOM@@|${ROOM}|g" \
    "$LUA_SNIP" > "$LUA_RUN"

  # Connexions c2s actives (shortcut prosodyctl — ne bloque pas)
  echo "--- c2s:show(${DOMAIN}) ---"
  prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | head -20 || echo "(c2s show indisponible)"

  MUC_SHELL_OK=0
  if command -v expect >/dev/null 2>&1; then
    echo "--- prosodyctl shell (expect + muc:room) ---"
    expect <<EXPECT || true
set timeout 25
log_user 1
spawn prosodyctl shell
expect {
    "prosody>" {
        send "> return (loadfile(\"${LUA_RUN}\"))()\r"
        expect "prosody>"
        send "bye\r"
        expect eof
    }
    timeout { puts "TIMEOUT prosody shell"; exit 1 }
    eof { exit 0 }
}
EXPECT
    MUC_SHELL_OK=1
  else
    echo "WARN: expect absent — commandes MANUELLES ci-dessous"
  fi

  if [[ "$MUC_SHELL_OK" -eq 0 ]]; then
    echo ""
    echo "MANUEL (pendant host+guest connectés):"
    echo "  sudo prosodyctl shell"
    echo "  > return (loadfile(\"${LUA_RUN}\"))()"
    echo "  ou:"
    echo "  > room = muc:room(\"${TARGET_JID}\")"
    echo "  > room and room:each_occupant"
    echo "  bye"
    echo ""
    echo "  apt install -y expect   # pour automatiser"
  fi

  echo ""
  echo "==> C. Prosody log — joins / muc récents (2 min)"
  grep -iE "${ROOM}|conference\.${DOMAIN}|conference\.guest|muc_domain|not.?allowed|occupant" \
    /var/log/prosody/prosody.log 2>/dev/null | tail -25 || echo "(aucune)"

  echo ""
  echo "==> D. Auth récente (quel domaine XMPP)"
  grep -iE "Authenticated as .*@(${DOMAIN}|guest\.|conference\.)" \
    /var/log/prosody/prosody.log 2>/dev/null | tail -8 || echo "(aucune)"

  echo ""
  echo "INTERPRÉTATION (section B)"
  echo "  target_FOUND + occupants=2  → même MUC OK, bug Jicofo/JVB/UI"
  echo "  target_FOUND + occupants=1  → un seul entré en MUC (l'autre ailleurs ou déco)"
  echo "  target_MISSING + rooms=0    → auth OK mais join MUC jamais fait (websocket?)"
  echo "  AUTRE MUC HOST + occupants  → split domain_mapper / guest / subdomain"
}

if [[ "$WATCH" == "--watch" || "$WATCH" == "-w" ]]; then
  echo "Mode watch — Ctrl+C pour arrêter. Lancez host+guest maintenant."
  while true; do
    run_once
    sleep 3
  done
else
  run_once
  echo ""
  echo "Relance en boucle pendant join:"
  echo "  sudo bash $0 ${ROOM} --watch"
  echo ""
  echo "Shell manuel:"
  echo "  sudo prosodyctl shell"
  echo '  muc = prosody.hosts["'${CONFERENCE}'"]:get_module("muc")'
  echo '  for room in muc:each_room(true) do print(room.jid) end'
fi
