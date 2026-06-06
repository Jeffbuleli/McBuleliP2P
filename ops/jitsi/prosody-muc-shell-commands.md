# Prosody shell — MUC live (McBuleli)

Pendant que **host** et **guest** sont dans l’UI Jitsi (`test-live-mcbuleli`) :

```bash
sudo prosodyctl shell
```

## Room cible

```lua
local conf = "conference.live.mcbuleli.org"
local muc = prosody.hosts[conf]:get_module("muc")
local jid = "test-live-mcbuleli@" .. conf
local room = muc:get_room_from_jid(jid)

if room then
    print("ROOM:", room.jid)
    for occ in room:each_occupant() do
        print("  ", occ.nick, occ.bare_jid, occ.role)
    end
else
    print("ROOM ABSENTE:", jid)
end
```

## Toutes les rooms actives

```lua
local conf = "conference.live.mcbuleli.org"
local muc = prosody.hosts[conf]:get_module("muc")
for room in muc:each_room(true) do
    local n = 0
    for _ in room:each_occupant() do n = n + 1 end
    print(room.jid, "occupants=" .. n)
end
```

## Détecter split (autres composants MUC)

```lua
for name in pairs(prosody.hosts) do
    if name:find("conference") then print(name) end
end
```

Si vous voyez `conference.guest.live.mcbuleli.org` ou `conference.<tenant>.live...` avec des occupants → **split multi-tenant**.

## Script automatique

```bash
sudo bash ops/jitsi/diagnose-muc-occupants-live.sh test-live-mcbuleli --watch
```
