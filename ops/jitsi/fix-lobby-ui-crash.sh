#!/bin/bash
# Crash Toolbox après IQ focus OK :
#   TypeError: Cannot read properties of undefined (reading 'isSupported')
#   at isLobbySupported → room.getLobby() undefined
#
# Cause : config.enableLobby=false empêche la création de l'objet Lobby (lib-jitsi-meet),
# mais le bouton Security appelle quand même conference.isLobbySupported().
#
# Fix : retirer enableLobby=false, garder lobby inactif via disableLobby + hideLobbyButton.
# Prosody peut rester sans muc_lobby_rooms (lobbySupported=false côté serveur).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
MARKER="mcbuleli-lobby-ui-safe"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").lobby-ui-safe.$(date +%Y%m%d%H%M%S)"

python3 - "$MEET_CFG" "$MARKER" <<'PY'
import re, sys

path, marker = sys.argv[1:3]
text = open(path).read()

# Retirer enableLobby=false partout (casse getLobby())
text = re.sub(r'(?m)^\s*config\.enableLobby\s*=\s*false\s*;\s*\n?', '', text)
text = re.sub(r'(?m)^\s*//\s*config\.enableLobby\s*=\s*false.*\n', '', text)

block = f"""

// {marker} — objet Lobby requis par Jitsi UI ; lobby fonctionnel off
config.disableLobby = true;
config.securityUi = config.securityUi || {{}};
config.securityUi.hideLobbyButton = true;
"""

if marker not in text:
    text = text.rstrip() + block + "\n"
else:
    text = re.sub(rf'(?ms)// {re.escape(marker)}.*', block.strip(), text, count=1)

open(path, "w").write(text)
print("OK: enableLobby=false retiré, hideLobbyButton=true")
PY

node --check "$MEET_CFG"
systemctl reload nginx 2>/dev/null || true

echo ""
echo "==> Vérif config.js servi"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'enableLobby|disableLobby|hideLobbyButton|lobby-ui-safe' | tail -8 || true

echo ""
echo "OK — fermez tous les onglets Jitsi, retest top-level (pas iframe McBuleli)"
echo "  Attendu console : Adding focus JID + PAS de crash isLobbySupported"
