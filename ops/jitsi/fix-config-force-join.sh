#!/bin/bash
# Clients XMPP secure + ping-only : forcer join immédiat (prejoin/welcome off).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
MARKER="mcbuleli-force-join"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || exit 1

cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").force-join.$(date +%Y%m%d%H%M%S)"

# Désactiver pré-join / welcome dans var config (pas seulement le bloc final)
sed -i \
  -e 's/prejoinPageEnabled = true/prejoinPageEnabled = false/g' \
  -e 's/prejoinPageEnabled=true/prejoinPageEnabled=false/g' \
  -e 's/prejoinPageEnabled: true/prejoinPageEnabled: false/g' \
  -e 's/enableWelcomePage = true/enableWelcomePage = false/g' \
  -e 's/enableWelcomePage=true/enableWelcomePage=false/g' \
  -e 's/enableWelcomePage: true/enableWelcomePage: false/g' \
  "$MEET_CFG"
python3 - "$MEET_CFG" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
text2 = re.sub(
    r'(prejoinConfig\s*:\s*\{[^}]*?)enabled\s*:\s*true',
    r'\1enabled: false',
    text,
    flags=re.DOTALL,
)
if text2 != text:
    open(path, 'w').write(text2)
PY

python3 - "$MEET_CFG" "$DOMAIN" "$CONFERENCE" "$MARKER" <<'PY'
import re, sys
path, domain, conference, marker = sys.argv[1:5]
text = open(path).read()
text = re.sub(r'(?ms)// mcbuleli-force-join.*', '', text)
block = f"""

// {marker}
config.prejoinPageEnabled = false;
config.prejoinConfig = {{ enabled: false }};
config.enableWelcomePage = false;
config.requireDisplayName = false;
config.enableUserRolesBasedOnToken = false;
config.disableDeepLinking = true;
config.startWithAudioMuted = true;
config.startWithVideoMuted = true;
config.disableLobby = true;
config.securityUi = config.securityUi || {};
config.securityUi.hideLobbyButton = true;
config.hosts = config.hosts || {{}};
config.hosts.domain = '{domain}';
config.hosts.muc = '{conference}';
config.hosts.focus = 'focus.{domain}';
config.bosh = 'https://{domain}/http-bind';
config.websocket = 'wss://{domain}/xmpp-websocket';
delete config.hosts.anonymousdomain;
delete config.hiddenDomain;
"""
text = text.rstrip() + block + "\n"
open(path, "w").write(text)
PY

node --check "$MEET_CFG"
systemctl reload nginx

echo "OK — Ctrl+Shift+R sur les 2 navigateurs puis retest capture-muc-join"
