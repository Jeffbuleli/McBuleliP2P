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
config.p2p = {{ enabled: true }};
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
echo "==> 2. Prosody — purge jigasi.meet.jitsi + lobby (blocs entiers)"
bash "$SCRIPT_DIR/fix-prosody-purge-stray-hosts.sh"

echo ""
echo "==> 2b. config.js — bosh/websocket sur ${DOMAIN}"
bash "$SCRIPT_DIR/fix-config-bosh-websocket.sh"

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
