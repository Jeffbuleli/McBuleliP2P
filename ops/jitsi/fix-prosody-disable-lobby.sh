#!/bin/bash
# Invité bloqué en lobby Prosody + host en salle = chacun voit « 1 participant ».
# config.js disableLobby ne suffit pas si muc_lobby_rooms est actif côté Prosody.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
LOBBY="lobby.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "Missing Prosody cfg: $CFG"; exit 1; }

STAMP="$(date +%Y%m%d%H%M%S)"
cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").no-lobby.${STAMP}"

python3 - "$CFG" "$DOMAIN" "$LOBBY" <<'PY'
import re, sys

path, domain, lobby = sys.argv[1:4]
text = open(path).read()

# VirtualHost live — retirer muc_lobby_rooms des modules
vh_pat = rf'(VirtualHost "{re.escape(domain)}".*?)(?=\n(?:VirtualHost|Component)\s)'

def strip_lobby_module(m):
    block = m.group(1)
    if "mcbuleli-prosody-no-lobby" in block:
        return block
    block = re.sub(r'^\s*"muc_lobby_rooms";\s*\n', "", block, flags=re.M)
    block = re.sub(r'^\s*"muc_lobby_rooms",\s*\n', "", block, flags=re.M)
    if "mcbuleli-prosody-no-lobby" not in block:
        block = block.rstrip() + '\n    -- mcbuleli-prosody-no-lobby\n'
    return block

text2 = re.sub(vh_pat, strip_lobby_module, text, count=1, flags=re.DOTALL)
if text2 == text:
    print("WARN: VirtualHost block unchanged (muc_lobby_rooms déjà absent?)")
text = text2

# Commenter Component lobby.* si présent
lobby_comp = rf'Component "{re.escape(lobby)}"'
if re.search(lobby_comp, text) and not re.search(rf'--\s*Component "{re.escape(lobby)}"', text):
    text = re.sub(
        rf'(?m)^(\s*)Component "{re.escape(lobby)}"',
        r'\1-- Component "' + lobby + '"',
        text,
        count=1,
    )
    print(f"OK: commented Component {lobby}")

open(path, "w").write(text)
print("OK: Prosody lobby disabled")
PY

prosodyctl check config
systemctl restart prosody
sleep 2
systemctl restart jicofo jitsi-videobridge2

echo ""
echo "==> modules VirtualHost ${DOMAIN}"
grep -A40 "VirtualHost \"${DOMAIN}\"" "$CFG" | grep -E 'muc_lobby|mcbuleli-prosody-no-lobby|modules_enabled' | head -8

echo ""
echo "==> lobby component"
grep -n "lobby.${DOMAIN}" "$CFG" | head -4 || echo "(aucun)"

echo ""
echo "OK — fermez tous les onglets Jitsi, host « Démarrer » puis invité « Vidéo »"
echo "Pendant join: sudo grep -i lobby /var/log/prosody/prosody.log | tail -8"
