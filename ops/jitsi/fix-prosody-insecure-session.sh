#!/bin/bash
# « No stream features to offer on insecure session » + jigasi parasite.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
MAIN="/etc/prosody/prosody.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "==> 1. Purge jigasi / jaas / lobby"
bash "$SCRIPT_DIR/fix-prosody-purge-stray-hosts.sh"

echo ""
echo "==> 2. Prosody n'écoute c2s que sur localhost (stop scans 0.0.0.0:5222)"
if [[ -f "$MAIN" ]]; then
  cp -a "$MAIN" "/root/nginx-backups/prosody.cfg.lua.bak.$(date +%Y%m%d%H%M%S)"
  if grep -q '^interfaces\s*=' "$MAIN"; then
    sed -i 's/^interfaces\s*=.*/interfaces = { "127.0.0.1", "::1" }/' "$MAIN"
  else
    grep -q 'mcbuleli-c2s-interfaces' "$MAIN" || cat >> "$MAIN" <<'EOF'

-- mcbuleli-c2s-interfaces
interfaces = { "127.0.0.1", "::1" }
EOF
  fi
fi

echo ""
echo "==> 3. VirtualHost ${DOMAIN} — websocket/bosh sécurisés derrière nginx"
cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").insecure.$(date +%Y%m%d%H%M%S)"
python3 - "$CFG" "$DOMAIN" "$AUTH" <<'PY'
import re, sys
path, domain, auth = sys.argv[1:4]
text = open(path).read()

def patch_vhost(name, extras: dict):
    global text
    pat = rf'VirtualHost "{re.escape(name)}"'
    if pat not in text:
        print(f"WARN: missing {name}")
        return
    # Insérer clés après la ligne VirtualHost si absentes
    for key, val in extras.items():
        if re.search(rf'^\s*{re.escape(key)}\s*=', text, re.M):
            text = re.sub(
                rf'^\s*{re.escape(key)}\s*=.*$',
                f'    {key} = {val}',
                text,
                count=1,
                flags=re.M,
            )
        else:
            text = re.sub(
                pat,
                f'VirtualHost "{name}"\n    {key} = {val}',
                text,
                count=1,
            )
        print(f"SET {name} {key}={val}")

patch_vhost(domain, {
    "consider_websocket_secure": "true",
    "consider_bosh_secure": "true",
    "cross_domain_websocket": "true",
    "cross_domain_bosh": "true",
})

# auth — Jicofo/JVB en local sans TLS strict sur c2s
patch_vhost(auth, {
    "c2s_require_encryption": "false",
})

open(path, "w").write(text)
PY

echo ""
echo "==> 4. Vérifier clés dans le fichier"
grep -nE 'consider_websocket_secure|consider_bosh_secure|c2s_require_encryption' "$CFG" | head -8

prosodyctl check config
systemctl restart prosody
sleep 4
bash "$SCRIPT_DIR/fix-jicofo-localhost.sh" 2>/dev/null || systemctl restart jicofo

echo ""
echo "==> 5. Ports (5222 doit être 127.0.0.1 seulement)"
ss -tlnp | grep 5222 || true

echo ""
echo "==> 6. Logs frais (attendez 10s sans client, puis retest navigateur)"
: > /var/log/prosody/prosody.log 2>/dev/null || true
sleep 2
echo "(log vidé — retestez Jitsi puis: grep insecure /var/log/prosody/prosody.log | tail -5)"
echo "OK"
