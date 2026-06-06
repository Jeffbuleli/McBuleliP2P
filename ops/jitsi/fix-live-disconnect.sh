#!/bin/bash
# Corrige « Vous avez été déconnecté » : purge jigasi, bosh, nginx XMPP, Prosody modules.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "==> 1. Purge jigasi + lobby Prosody"
bash "$SCRIPT_DIR/fix-prosody-purge-stray-hosts.sh"

echo ""
echo "==> 2. Modules bosh + websocket sur VirtualHost ${DOMAIN}"
cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").xmpp-modules.$(date +%Y%m%d%H%M%S)"
python3 - "$CFG" "$DOMAIN" <<'PY'
import re, sys
path, domain = sys.argv[1], sys.argv[2]
text = open(path).read()
pat = rf'(VirtualHost "{re.escape(domain)}".*?)(?=\n(?:VirtualHost|Component) ")'
m = re.search(pat, text, re.DOTALL)
if not m:
    print("WARN: VirtualHost introuvable"); sys.exit(0)
block = m.group(1)
for mod in ("bosh", "websocket", "smacks"):
    if f'"{mod}"' not in block and f"'{mod}'" not in block:
        if "modules_enabled" in block:
            block = re.sub(
                r'(modules_enabled\s*=\s*\{)',
                r'\1\n        "' + mod + '";',
                block,
                count=1,
            )
        else:
            block += f'\n    modules_enabled = {{\n        "{mod}";\n    }}\n'
        print(f"ADDED module {mod}")
text = text[: m.start(1)] + block + text[m.end(1) :]
open(path, "w").write(text)
PY

echo ""
echo "==> 3. config.js — restauration syntaxe + overrides"
bash "$SCRIPT_DIR/fix-config-js-emergency-restore.sh"

echo ""
echo "==> 3b. Prosody websocket/bosh derrière nginx TLS"
bash "$SCRIPT_DIR/fix-prosody-websocket-secure.sh"

echo ""
echo "==> 4. Nginx proxy XMPP"
bash "$SCRIPT_DIR/fix-nginx-xmpp-proxy.sh"

echo ""
echo "==> 5. Jicofo + services"
bash "$SCRIPT_DIR/fix-jicofo-localhost.sh" 2>/dev/null || true
prosodyctl check config
systemctl restart prosody
sleep 3
systemctl restart jicofo jitsi-videobridge2

echo ""
bash "$SCRIPT_DIR/diagnose-live-disconnect.sh"

echo ""
echo "OK — fermez tous les onglets, navigation privée, retestez."
