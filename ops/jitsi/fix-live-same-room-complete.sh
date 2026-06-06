#!/bin/bash
# Host + invité = 2 meetings séparés (1 participant chacun).
# Causes traitées : lobby Prosody, guest domain, jigasi.meet.jitsi parasite, transcription.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
LOBBY="lobby.${DOMAIN}"
GUEST="guest.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "==> 1. config.js — guest off, lobby off, pas de jigasi/hiddenDomain"
if [[ -f "$MEET_CFG" ]]; then
  cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").same-room.$(date +%Y%m%d%H%M%S)"
  bash "$SCRIPT_DIR/fix-no-guest-split.sh" 2>/dev/null || bash "$SCRIPT_DIR/fix-disable-lobby.sh"
  python3 - "$MEET_CFG" "$DOMAIN" <<'PY'
import re, sys
path, domain = sys.argv[1], sys.argv[2]
text = open(path).read()
# Commenter hiddenDomain / jigasi / meet.jitsi defaults
text = re.sub(
    r"(?m)^(\s*)(hiddenDomain|recordingService|transcription|liveStreaming)\s*=",
    r"\1// \2 =",
    text,
)
# Bloc final idempotent
marker = "mcbuleli-same-room-complete"
if marker not in text:
    text += f"""

// {marker}
config.transcription = {{ disabled: true, enableCaptionButton: false }};
config.liveStreaming = {{ enabled: false }};
config.recordingService = {{ enabled: false }};
delete config.hiddenDomain;
config.p2p = {{ enabled: false }};
config.hosts = config.hosts || {{}};
config.hosts.domain = '{domain}';
config.hosts.muc = 'conference.{domain}';
delete config.hosts.anonymousdomain;
config.enableLobby = false;
config.disableLobby = true;
config.enableUserRolesBasedOnToken = false;
"""
open(path, "w").write(text)
print("OK config.js")
PY
  node --check "$MEET_CFG"
fi

echo ""
echo "==> 2. Prosody — lobby off + retirer jigasi.meet.jitsi / localhost parasites"
[[ -f "$CFG" ]] || { echo "WARN: $CFG absent"; exit 1; }
cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").same-room.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$DOMAIN" "$LOBBY" "$GUEST" <<'PY'
import re, sys, glob

path, domain, lobby, guest = sys.argv[1:5]
text = open(path).read()

# VirtualHost live — retirer muc_lobby_rooms
vh_pat = rf'(VirtualHost "{re.escape(domain)}".*?)(?=\n(?:VirtualHost|Component)\s)'

def strip_lobby(m):
    block = m.group(1)
    block = re.sub(r'^\s*"muc_lobby_rooms";\s*\n', "", block, flags=re.M)
    if "mcbuleli-same-room-complete" not in block:
        block = block.rstrip() + "\n    -- mcbuleli-same-room-complete\n"
    return block

text = re.sub(vh_pat, strip_lobby, text, count=1, flags=re.DOTALL)

# Comment lobby component
text = re.sub(
    rf'(?m)^(\s*)Component "{re.escape(lobby)}"',
    r'\1-- Component "' + lobby + '"',
    text,
    count=1,
)

# Comment guest vhost if still active
def comment_guest(m):
    b = m.group(0)
    if b.lstrip().startswith("--"):
        return b
    return "\n".join("-- " + ln if ln.strip() else ln for ln in b.splitlines()) + "\n"

text = re.sub(
    rf'VirtualHost "{re.escape(guest)}".*?(?=\n(?:VirtualHost|Component)\s|\Z)',
    comment_guest,
    text,
    count=1,
    flags=re.DOTALL,
)

open(path, "w").write(text)

# Comment stray default hosts in all prosody conf.d
strays = ("jigasi.meet.jitsi", "meet.jitsi", "localhost", "auth.meet.jitsi")
for f in glob.glob("/etc/prosody/conf.d/*.lua"):
    t = open(f).read()
    orig = t
    for s in strays:
        t = re.sub(
            rf'(?m)^(\s*)VirtualHost "{re.escape(s)}"',
            r'\1-- VirtualHost "' + s + '"',
            t,
        )
        t = re.sub(
            rf'(?m)^(\s*)Component "{re.escape(s)}"',
            r'\1-- Component "' + s + '"',
            t,
        )
    if t != orig:
        open(f, "w").write(t)
        print(f"OK: commented stray hosts in {f}")

print("OK Prosody")
PY

echo ""
echo "==> 3. Jigasi (optionnel) — stop si actif (évite jigasi.meet.jitsi dans les logs)"
systemctl stop jigasi 2>/dev/null || true
systemctl disable jigasi 2>/dev/null || true

echo ""
echo "==> 4. Jicofo focus + brewery"
bash "$SCRIPT_DIR/fix-jicofo-localhost.sh" 2>/dev/null || true

prosodyctl check config || true
systemctl restart prosody
sleep 3
systemctl restart jicofo jitsi-videobridge2
systemctl reload nginx 2>/dev/null || true

echo ""
echo "==> 5. Vérifications"
echo "--- config.js servi ---"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'anonymousdomain|hiddenDomain|jigasi|enableLobby|p2p\.enabled|hosts\.muc' | head -12 || true

echo ""
echo "--- Prosody lobby / jigasi ---"
grep -iE 'muc_lobby|jigasi\.meet' "$CFG" | head -6 || echo "(aucun actif)"

echo ""
echo "OK — fermez TOUS les onglets Jitsi. Host « Démarrer » puis invité « Vidéo »."
echo "Pendant join:"
echo "  sudo journalctl -u jicofo -f"
echo "  sudo grep -iE 'test-live|lobby|jigasi' /var/log/prosody/prosody.log | tail -10"
