# Prosody shell — MUC live (McBuleli)

Pendant que **host** et **guest** sont dans l’UI Jitsi (`test-live-mcbuleli`) :

```bash
sudo prosodyctl shell
```

## Room cible (API officielle Prosody)

Docs : https://prosody.im/doc/console — section **MUC commands**

```lua
> room = muc:room("test-live-mcbuleli@conference.live.mcbuleli.org")
> room
> room and room:each_occupant
```

Ou script chargé :

```lua
> return (loadfile("/tmp/mcb-muc-check-test-live-mcbuleli.lua"))()
```

(Généré par `diagnose-muc-occupants-live.sh`)

## Stanzas live (voir join MUC en direct)

```lua
watch:stanzas("live.mcbuleli.org")
```

Ctrl+C puis `bye` pour quitter.

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
