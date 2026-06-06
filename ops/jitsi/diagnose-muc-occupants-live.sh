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
  echo "==> B. Prosody shell — rooms actives sur ${CONFERENCE}"
  if ! command -v prosodyctl >/dev/null 2>&1; then
    echo "ERREUR: prosodyctl absent"
    return 1
  fi

  prosodyctl shell 2>/dev/null <<LUA || echo "WARN: prosodyctl shell a échoué (Prosody actif ?)"
-- diagnose-muc-occupants-live.sh
local conference_host = "${CONFERENCE}"
local target_room = "${ROOM}"
local target_jid = target_room .. "@" .. conference_host

local function sep(title)
    print("")
    print("--- " .. title .. " ---")
end

sep("Hôtes Prosody (conference*)")
for name in pairs(prosody.hosts) do
    if name:find("conference") or name:find("${DOMAIN}") then
        print(name)
    end
end

local host = prosody.hosts[conference_host]
if not host then
    print("FAIL: pas de host Prosody [" .. conference_host .. "]")
    print("=> split possible: clients sur un autre composant MUC")
    return
end

local muc_mod = nil
if host.get_module then
    muc_mod = host:get_module("muc")
end
if not muc_mod and host.modules then
    muc_mod = host.modules.muc
end

if not muc_mod then
    print("FAIL: module muc absent sur " .. conference_host)
    return
end

sep("Rooms actives (each_room)")
local room_count = 0
local target_found = false

local function show_occupants(room)
    local n = 0
    if room.each_occupant then
        for occupant in room:each_occupant() do
            n = n + 1
            local nick = occupant.nick or "?"
            local bare = occupant.bare_jid or occupant.jid or "?"
            local role = occupant.role or "?"
            print(string.format("    occupant[%d] nick=%s bare=%s role=%s", n, tostring(nick), tostring(bare), tostring(role)))
        end
    elseif room._occupants then
        for nick, occ in pairs(room._occupants) do
            n = n + 1
            print(string.format("    occupant[%d] nick=%s", n, tostring(nick)))
        end
    else
        print("    (API occupants indisponible — room existe)")
    end
    return n
end

if muc_mod.each_room then
    for room in muc_mod:each_room(true) do
        room_count = room_count + 1
        local jid = room.jid or "?"
        local occ_n = show_occupants(room)
        print(string.format("ROOM[%d] jid=%s occupants=%s", room_count, jid, tostring(occ_n)))
        if jid == target_jid then target_found = true end
    end
elseif muc_mod.each_room_all then
    for room in muc_mod:each_room_all() do
        room_count = room_count + 1
        local jid = room.jid or "?"
        local occ_n = show_occupants(room)
        print(string.format("ROOM[%d] jid=%s occupants=%s", room_count, jid, tostring(occ_n)))
        if jid == target_jid then target_found = true end
    end
else
    print("WARN: each_room non exposé — tentative get_room_from_jid")
end

sep("Room cible: " .. target_jid)
local room = nil
if muc_mod.get_room_from_jid then
    room = muc_mod:get_room_from_jid(target_jid)
elseif muc_mod.get_room then
    room = muc_mod:get_room(target_room)
end

if room then
    target_found = true
    local occ_n = show_occupants(room)
    print("OK: room cible EXISTE — occupants=" .. tostring(occ_n))
    if occ_n == 0 then
        print("=> auth XMPP OK mais personne dans la MUC (disconnect avant join?)")
    elseif occ_n == 1 then
        print("=> 1 seul dans la MUC — l'autre client est ailleurs ou pas entré")
    elseif occ_n >= 2 then
        print("=> 2+ dans la MUC — split = UI/media/Jicofo, pas la room XMPP")
    end
else
    print("FAIL: room cible ABSENTE")
    print("=> clients n'ont pas rejoint " .. target_jid)
end

sep("Autres composants MUC (guest / subdomain / lobby)")
for name, h in pairs(prosody.hosts) do
    if name:find("conference") and name ~= conference_host then
        print("AUTRE MUC HOST: " .. name)
        local mm = h.get_module and h:get_module("muc") or (h.modules and h.modules.muc)
        if mm and mm.each_room then
            for room in mm:each_room(true) do
                local jid = room.jid or "?"
                local cnt = 0
                if room.each_occupant then
                    for _ in room:each_occupant() do cnt = cnt + 1 end
                end
                if cnt > 0 then
                    print(string.format("  ACTIVE %s occupants=%d", jid, cnt))
                end
            end
        end
    end
end

sep("Résumé")
print("rooms_sur_" .. conference_host .. "=" .. room_count)
print("target_" .. target_room .. "=" .. (target_found and "FOUND" or "MISSING"))
LUA

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
