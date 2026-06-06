-- Chargé via prosodyctl shell (ligne > assert(loadfile("..."))())
-- Placeholders remplacés par diagnose-muc-occupants-live.sh
local conference_host = "@@MCB_CONFERENCE@@"
local target_room = "@@MCB_ROOM@@"
local target_jid = target_room .. "@" .. conference_host

local function sep(t) print("--- " .. t .. " ---") end

sep("Hôtes conference*")
for name in pairs(prosody.hosts) do
    if name:find("conference") then print(name) end
end

sep("Room cible")
local host = prosody.hosts[conference_host]
local muc_mod = host and (host.get_module and host:get_module("muc") or (host.modules and host.modules.muc))
local room
if muc_mod then
    if muc_mod.room then
        room = muc_mod:room(target_jid)
    elseif muc_mod.get_room then
        room = muc_mod:get_room(target_jid)
    end
end
if not room and muc and muc.room then
    room = muc:room(target_jid)
end
if not room then
    print("FAIL target_MISSING " .. target_jid)
else
    print("OK target_FOUND " .. target_jid)
    local n = 0
    if room.each_occupant then
        for occ in room:each_occupant() do
            n = n + 1
            print(string.format("occupant[%d] nick=%s bare=%s role=%s",
                n, tostring(occ.nick), tostring(occ.bare_jid or occ.jid), tostring(occ.role)))
        end
    elseif room._occupants then
        for nick, occ in pairs(room._occupants) do
            n = n + 1
            print(string.format("occupant[%d] nick=%s", n, tostring(nick)))
        end
    end
    print("occupant_count=" .. n)
end

sep("Autres hosts conference avec rooms")
if muc_mod and muc_mod.each_room then
    local total = 0
    for r in muc_mod:each_room(true) do
        total = total + 1
        local cnt = 0
        if r.each_occupant then for _ in r:each_occupant() do cnt = cnt + 1 end end
        if cnt > 0 then print(string.format("ACTIVE %s occupants=%d", r.jid or "?", cnt)) end
    end
    print("room_count_" .. conference_host .. "=" .. total)
else
    print("WARN each_room indisponible sur " .. conference_host)
end

sep("Autres composants MUC")
for name, h in pairs(prosody.hosts) do
    if name:find("conference") and name ~= conference_host then
        local mm = h.get_module and h:get_module("muc") or (h.modules and h.modules.muc)
        if mm and mm.each_room then
            for r in mm:each_room(true) do
                local cnt = 0
                if r.each_occupant then for _ in r:each_occupant() do cnt = cnt + 1 end end
                if cnt > 0 then print("SPLIT_HOST " .. name .. " " .. (r.jid or "?") .. " occupants=" .. cnt) end
            end
        end
    end
end
