-- prosodyctl shell: > return (loadfile("..."))()
-- print() n'apparaît pas dans expect — utiliser return + fichier rapport.
local conference_host = "@@MCB_CONFERENCE@@"
local target_room = "@@MCB_ROOM@@"
local target_jid = target_room .. "@" .. conference_host
local report_path = "/tmp/mcb-muc-report-" .. target_room .. ".txt"

local hosts_tbl = (prosody and prosody.hosts) or hosts or {}
local lines = {}

local function emit(...)
    for i = 1, select("#", ...) do
        lines[#lines + 1] = tostring(select(i, ...))
    end
end

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
                emit(string.format("occupant[%d] nick=%s bare=%s role=%s",
                    n, tostring(occ.nick), tostring(occ.bare_jid or occ.jid), tostring(occ.role)))
            end
        end
    elseif room._occupants then
        for nick in pairs(room._occupants) do
            n = n + 1
            if verbose then
                emit(string.format("occupant[%d] nick=%s", n, tostring(nick)))
            end
        end
    end
    return n
end

local function each_room(muc_mod)
    if type(muc_mod.each_room) == "function" then
        for _, args in ipairs({{muc_mod, true}, {muc_mod}, {true}, {}}) do
            local ok, iter = pcall(muc_mod.each_room, table.unpack(args))
            if ok and iter then return iter end
        end
    end
    if muc_mod.rooms then
        return pairs(muc_mod.rooms)
    end
    return nil
end

local function run()
    emit("--- Hôtes conference* ---")
    for name in pairs(hosts_tbl) do
        if name:find("conference") then emit(name) end
    end

    emit("--- Room cible " .. target_jid .. " ---")
    local muc_mod, err = muc_module(conference_host)
    local summary
    if not muc_mod then
        emit("FAIL " .. err)
        summary = "FAIL " .. err
    else
        local room = find_room(muc_mod, target_jid)
        if not room then
            emit("FAIL target_MISSING " .. target_jid)
            summary = "FAIL target_MISSING " .. target_jid
        else
            local n = count_occupants(room, true)
            emit("OK target_FOUND " .. target_jid)
            emit("occupant_count=" .. n)
            summary = "OK target_FOUND " .. target_jid .. " occupant_count=" .. n
        end
    end

    emit("--- Rooms actives sur " .. conference_host .. " ---")
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
                        emit(string.format("ACTIVE %s occupants=%d", tostring(r.jid or "?"), cnt))
                    end
                end
            end
        end
        emit("room_count_" .. conference_host .. "=" .. total)
        emit("active_room_count=" .. active)
    end

    emit("--- Autres composants MUC (split?) ---")
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
                                emit("SPLIT_HOST " .. name .. " " .. tostring(r.jid or "?") .. " occupants=" .. cnt)
                            end
                        end
                    end
                end
            end
        end
    end

    return summary or "FAIL unknown"
end

local ok, result = xpcall(run, debug.traceback)
if not ok then
    emit("FAIL lua_error: " .. tostring(result))
    result = "FAIL lua_error"
end

local report = table.concat(lines, "\n")
pcall(function()
    local f = io.open(report_path, "w")
    if f then f:write(report); f:write("\n"); f:close() end
end)

return result
