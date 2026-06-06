#!/bin/bash
# Host + invité = 1 participant chacun malgré même URL :
# - config.js en cache avec anonymousdomain → guest.live (MUC séparée)
# - lobby (déjà fix-disable-lobby.sh)
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
GUEST="guest.${DOMAIN}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
PROSODY_CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$PROSODY_CFG" ]] || PROSODY_CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="$(date +%Y%m%d%H%M%S)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").no-guest.${STAMP}"

# --- 1) config.js : un seul domaine, lobby off ---
bash "$SCRIPT_DIR/fix-jitsi-jwt-only-mode.sh" 2>/dev/null || true
bash "$SCRIPT_DIR/fix-disable-lobby.sh" 2>/dev/null || true
bash "$SCRIPT_DIR/fix-prosody-disable-lobby.sh" 2>/dev/null || true
sed -i "s|^[[:space:]]*anonymousdomain:|        // anonymousdomain:|" "$MEET_CFG"
sed -i "s|config\.hosts\.anonymousdomain = '${GUEST}'|// config.hosts.anonymousdomain = '${GUEST}'|g" "$MEET_CFG" || true

if ! grep -q 'mcbuleli-no-guest-split' "$MEET_CFG"; then
  cat >> "$MEET_CFG" <<EOF

// mcbuleli-no-guest-split — force même MUC pour host + invités
config.hosts = config.hosts || {};
config.hosts.domain = '${DOMAIN}';
config.hosts.authdomain = '${DOMAIN}';
config.hosts.muc = 'conference.${DOMAIN}';
delete config.hosts.anonymousdomain;
config.enableLobby = false;
config.disableLobby = true;
config.enableUserRolesBasedOnToken = false;
config.deploymentInfo = config.deploymentInfo || {};
config.deploymentInfo.product = 'mcbuleli';
config.deploymentInfo.environment = 'same-room-${STAMP}';
EOF
fi

bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh" 2>/dev/null || true
node --check "$MEET_CFG"

# --- 2) Prosody : désactiver VirtualHost guest (évite conference.guest.*) ---
if [[ -f "$PROSODY_CFG" ]]; then
  cp -a "$PROSODY_CFG" "${PROSODY_CFG}.bak.no-guest.${STAMP}"
  python3 - "$PROSODY_CFG" "$GUEST" <<'PY'
import re, sys
path, guest = sys.argv[1], sys.argv[2]
text = open(path).read()
pat = rf'VirtualHost "{re.escape(guest)}"\s*\n'
if not re.search(pat, text):
    print(f"SKIP: no VirtualHost {guest}")
    sys.exit(0)
# Commenter tout le bloc guest
def comment_block(m):
    block = m.group(0)
    if block.lstrip().startswith('--'):
        return block
    lines = []
    for line in block.splitlines():
        if line.strip():
            lines.append('-- ' + line if not line.startswith('--') else line)
        else:
            lines.append(line)
    return '\n'.join(lines) + '\n'
text = re.sub(
    pat + r'.*?(?=\n(?:VirtualHost|Component|-- VirtualHost)\s|\Z)',
    comment_block,
    text,
    count=1,
    flags=re.DOTALL,
)
open(path, 'w').write(text)
print(f"OK: commented VirtualHost {guest}")
PY
  prosodyctl check config
fi

# --- 3) nginx : pas de cache sur *-config.js ---
NGINX_VHOST=""
for f in /etc/nginx/sites-enabled/live.mcbuleli.org.conf \
         /etc/nginx/sites-enabled/live.mcbuleli.org; do
  [[ -f "$f" ]] && NGINX_VHOST="$f" && break
done
if [[ -n "$NGINX_VHOST" ]] && ! grep -q 'mcbuleli-config-nocache' "$NGINX_VHOST"; then
  cp -a "$NGINX_VHOST" "/root/nginx-backups/$(basename "$NGINX_VHOST").nocache.${STAMP}"
  sed -i '/mcbuleli-config-nocache/d' "$NGINX_VHOST"
  sed -i "/server_name.*live\.mcbuleli\.org;/a\\
    # mcbuleli-config-nocache\\
    location ~ -config\\.js\$ {\\
        add_header Cache-Control \"no-store, no-cache, must-revalidate\";\\
        try_files \\\$uri =404;\\
    }" "$NGINX_VHOST"
  nginx -t
fi

systemctl restart prosody jicofo jitsi-videobridge2
systemctl reload nginx

echo ""
echo "=== config.js (domain / guest / lobby) ==="
grep -nE 'anonymousdomain|enableLobby|mcbuleli-no-guest|hosts\.muc|deploymentInfo\.environment' "$MEET_CFG" | tail -15
echo ""
echo "=== Prosody guest vhost (doit être commenté) ==="
grep -n "VirtualHost \"${GUEST}\"" "$PROSODY_CFG" 2>/dev/null | head -3 || echo "(absent)"
echo ""
echo "OK — FERMEZ tous les onglets Jitsi, videz cache mobile, retest."
echo "Pendant join des 2 : bash ops/jitsi/diagnose-split-room.sh test-live-mcbuleli"
