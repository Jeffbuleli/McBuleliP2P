#!/bin/bash
# Pré-join « Rejoindre la réunion » + bouton figé → prejoinConfig + Jicofo/focus.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CONFIG="/etc/jitsi/meet/${DOMAIN}-config.js"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "==> 1. Désactiver pré-join (ancien + nouveau format Jitsi)"
cp -a "$CONFIG" "/root/nginx-backups/$(basename "$CONFIG").prejoin.$(date +%Y%m%d%H%M%S)"
sed -i \
  -e 's/prejoinPageEnabled = true/prejoinPageEnabled = false/g' \
  -e 's/prejoinPageEnabled=true/prejoinPageEnabled=false/g' \
  -e 's/prejoinPageEnabled: true/prejoinPageEnabled: false/g' \
  -e 's/prejoinPageEnabled:true/prejoinPageEnabled: false/g' \
  "$CONFIG"
# Cibler prejoinConfig sans casser d'autres enabled:true — réécrire bloc si présent
python3 - "$CONFIG" <<'PY'
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
    print("OK: prejoinConfig.enabled → false")
PY
grep -q 'prejoinConfig.enabled = false' "$CONFIG" || cat >> "$CONFIG" <<'EOF'

config.prejoinConfig = config.prejoinConfig || {};
config.prejoinConfig.enabled = false;
config.prejoinPageEnabled = false;
EOF

bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh"
node --check "$CONFIG"

echo ""
echo "==> 2. Jicofo localhost + focus"
if [[ -f "$SCRIPT_DIR/fix-jicofo-localhost.sh" ]]; then
  bash "$SCRIPT_DIR/fix-jicofo-localhost.sh"
else
  systemctl restart jicofo
fi

echo ""
echo "==> 3. prejoin dans config (grep)"
grep -nE 'prejoinPageEnabled|prejoinConfig' "$CONFIG" | tail -12

echo ""
echo "==> 4. Pendant un clic « Rejoindre » sur mobile, lancez :"
echo "  grep -iE 'conference|focus|test-live|error|Allocated' /var/log/jitsi/jicofo.log | tail -15"
