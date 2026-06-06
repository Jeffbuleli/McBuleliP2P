-- prosodyctl shell: > assert(loadfile("..."))()
-- Console Lua: global `hosts` (pas toujours prosody.hosts). muc:room() = commande shell.
local conference_host = "@@MCB_CONFERENCE@@"
local target_room = "@@MCB_ROOM@@"
local target_jid = target_room .. "@" .. conference_host

local hosts_tbl = (prosody and prosody.hosts) or hosts or {}

local function sep(t) print("--- " .. t .. " ---") end

local function muc_module(conf_host)
    local h = hosts_tbl[conf_host]
    if not h then return nil, "host_missing " .. conf_host end
    local m = (h.modules and h.modules.muc) or (h.get_module and h:get_module("muc"))
    if not m then return nil, "muc_module_missing on " .. conf_host end
    return m
end

local function find_room(muc_mod, jid)
    if muc_mod.get_room_from_jid then
        local ok, r = pcall(muc_mod.get_room_from_jid, muc_mod, jid)
        if ok and r then return r end
        ok, r = pcall(muc_mod.get_room_from_jid, jid)
        if ok and r then return r end
    end
    if muc_mod.rooms then
        local ok, r = pcall(function() return muc_mod.rooms[jid] end)
        if ok and r then return r end
    end
    return nil
end

local function count_occupants(room, verbose)
    local n = 0
    if room.each_occupant then
        for occ in room:each_occupant() do
            n = n + 1
            if verbose then
                print(string.format("occupant[%d] nick=%s bare=%s role=%s",
                    n, tostring(occ.nick), tostring(occ.bare_jid or occ.jid), tostring(occ.role)))
            end
        end
    elseif room._occupants then
        for nick in pairs(room._occupants) do
            n = n + 1
            if verbose then
                print(string.format("occupant[%d] nick=%s", n, tostring(nick)))
            end
        end
    end
    return n
end

local function each_room(muc_mod)
    if type(muc_mod.each_room) == "function" then
        local ok, iter = pcall(muc_mod.each_room, muc_mod, true)
        if ok and iter then return iter end
        ok, iter = pcall(muc_mod.each_room, muc_mod)
        if ok and iter then return iter end
        ok, iter = pcall(muc_mod.each_room, true)
        if ok and iter then return iter end
        ok, iter = pcall(muc_mod.each_room)
        if ok and iter then return iter end
    end
    if muc_mod.rooms then
        return pairs(muc_mod.rooms)
    end
    return nil
end

local function run()
    sep("Hôtes conference*")
    for name in pairs(hosts_tbl) do
        if name:find("conference") then print(name) end
    end

    sep("Room cible " .. target_jid)
    local muc_mod, err = muc_module(conference_host)
    if not muc_mod then
        print("FAIL " .. err)
    else
        local room = find_room(muc_mod, target_jid)
        if not room then
            print("FAIL target_MISSING " .. target_jid)
        else
            print("OK target_FOUND " .. target_jid)
            print("occupant_count=" .. count_occupants(room, true))
        end
    end

    sep("Rooms actives sur " .. conference_host)
    if muc_mod then
        local iter = each_room(muc_mod)
        local total, active = 0, 0
        if iter then
            for r in iter do
                if type(r) == "table" and (r.jid or r.each_occupant) then
                    total = total + 1
                    local cnt = count_occupants(r, false)
                    if cnt > 0 then
                        active = active + 1
                        print(string.format("ACTIVE %s occupants=%d", tostring(r.jid or "?"), cnt))
                    end
                end
            end
        end
        print("room_count_" .. conference_host .. "=" .. total)
        print("active_room_count=" .. active)
    end

    sep("Autres composants MUC (split?)")
    for name, h in pairs(hosts_tbl) do
        if name:find("conference") and name ~= conference_host then
            local mm = (h.modules and h.modules.muc) or (h.get_module and h:get_module("muc"))
            if mm then
                local iter = each_room(mm)
                if iter then
                    for r in iter do
                        if type(r) == "table" and r.each_occupant then
                            local cnt = count_occupants(r, false)
                            if cnt > 0 then
                                print("SPLIT_HOST " .. name .. " " .. tostring(r.jid or "?") .. " occupants=" .. cnt)
                            end
                        end
                    end
                end
            end
        end
    end
end

local ok, err = xpcall(run, debug.traceback)
if not ok then
    print("FAIL lua_error: " .. tostring(err))
end
