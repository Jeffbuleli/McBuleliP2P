#!/bin/bash
# Supprime jigasi.meet.jitsi, lobby Prosody, hôtes meet.jitsi par défaut (cause split + déconnexion).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
LOBBY="lobby.${DOMAIN}"
GUEST="guest.${DOMAIN}"
MAIN_CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$MAIN_CFG" ]] || MAIN_CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
DISABLED="/root/nginx-backups/prosody-disabled-$(date +%Y%m%d%H%M%S)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
mkdir -p "$DISABLED"

echo "==> 1. Fichiers Prosody dédiés aux hôtes parasites → $DISABLED"
shopt -s nullglob
for f in /etc/prosody/conf.d/*.lua /etc/prosody/conf.avail/*.lua; do
  [[ -f "$f" ]] || continue
  base="$(basename "$f")"
  # Garder uniquement la config du domaine live (+ prosody.cfg.lua géré à part)
  if [[ "$base" == "${DOMAIN}.cfg.lua" ]] || [[ "$base" == "prosody.cfg.lua" ]]; then
    continue
  fi
  if grep -qE 'jigasi\.meet\.jitsi|meet\.jitsi|auth\.meet\.jitsi|jaas\.cfg' "$f" 2>/dev/null || [[ "$base" == "jaas.cfg.lua" ]]; then
    echo "DISABLE file: $f"
    cp -a "$f" "$DISABLED/"
    rm -f "/etc/prosody/conf.d/$(basename "$f")" 2>/dev/null || true
    mv -f "$f" "$DISABLED/$(basename "$f").disabled" 2>/dev/null || true
  fi
done
shopt -u nullglob

echo ""
echo "==> 2. Édition $MAIN_CFG (blocs entiers commentés)"
[[ -f "$MAIN_CFG" ]] || { echo "ERREUR: $MAIN_CFG absent"; exit 1; }
cp -a "$MAIN_CFG" "$DISABLED/$(basename "$MAIN_CFG").bak"

python3 - "$MAIN_CFG" "$DOMAIN" "$LOBBY" "$GUEST" <<'PY'
import re, sys

path, domain, lobby, guest = sys.argv[1:5]
text = open(path).read()

def comment_lua_blocks(src, names):
    out = src
    for name in names:
        # VirtualHost "name" ou Component "name" jusqu'au prochain VirtualHost/Component non indenté
        pat = rf'(?m)^(\s*)(VirtualHost|Component) "{re.escape(name)}"\s*$'
        while True:
            m = re.search(pat, out)
            if not m:
                break
            start = m.start()
            tail = out[m.end():]
            nxt = re.search(r'\n(?=(?:VirtualHost|Component) ")', tail)
            end = m.end() + (nxt.start() if nxt else len(tail))
            block = out[start:end]
            if block.lstrip().startswith("--"):
                break
            commented = "\n".join(
                (("-- " + line) if line.strip() and not line.lstrip().startswith("--") else line)
                for line in block.splitlines()
            )
            out = out[:start] + commented + out[end:]
            print(f"OK: commented block {name}")
    return out

# Hôtes à neutraliser dans le fichier principal
strays = [
    "jigasi.meet.jitsi",
    "meet.jitsi",
    "auth.meet.jitsi",
    "localhost",
    lobby,
    guest,
]
text = comment_lua_blocks(text, strays)

# Retirer muc_lobby_rooms partout (liste modules)
text = re.sub(r'(?m)^\s*"muc_lobby_rooms";\s*\n?', "", text)
text = re.sub(r'(?m)^\s*"muc_lobby_rooms",\s*\n?', "", text)

if "mcbuleli-prosody-purge" not in text:
    text += "\n-- mcbuleli-prosody-purge: lobby + jigasi disabled\n"

open(path, "w").write(text)
print("OK: main cfg patched")
PY

echo ""
echo "==> 3. prosodyctl check + restart"
prosodyctl check config 2>&1 | tail -10 || true
systemctl restart prosody
sleep 3

echo ""
echo "==> 4. État après restart (ne doit PLUS charger jigasi/lobby)"
grep -iE 'jigasi\.meet|muc_lobby|Lobby component loaded' /var/log/prosody/prosody.log | tail -6 || echo "(aucune ligne jigasi/lobby récente = OK)"

echo ""
echo "OK — purge stray hosts done"
