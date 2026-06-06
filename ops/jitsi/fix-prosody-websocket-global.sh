#!/bin/bash
# WebSocket/BOSH derrière nginx — consider_* sur GLOBAL + VirtualHost live (Jitsi).
# Ne PAS retirer consider_* du vhost (cassait les joins MUC).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MAIN="/etc/prosody/prosody.cfg.lua"
CERT_KEY="/etc/prosody/certs/${DOMAIN}.key"
CERT_CRT="/etc/prosody/certs/${DOMAIN}.crt"

patch_vhost() {
  local CFG="$1"
  [[ -f "$CFG" ]] || return 0
  cp -a "$CFG" "${CFG}.bak.ws.$(date +%Y%m%d%H%M%S)"
  python3 - "$CFG" "$DOMAIN" "$CERT_KEY" "$CERT_CRT" <<'PY'
import re, sys
path, domain, key, crt = sys.argv[1:5]
text = open(path).read()
vhost_re = rf'(VirtualHost "{re.escape(domain)}"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'

def patch(m):
    header, body = m.group(1), m.group(2)
    if "ssl = {" not in body and __import__("os").path.isfile(crt):
        body = f'''    ssl = {{
        key = "{key}";
        certificate = "{crt}";
    }}
''' + body
    for mod in ('"bosh"', '"websocket"', '"smacks"', '"ping"'):
        if mod not in body:
            body = re.sub(r'(modules_enabled\s*=\s*\{)', rf'\1\n        {mod};', body, count=1)
    flags = {
        "consider_websocket_secure": "true",
        "consider_bosh_secure": "true",
        "cross_domain_websocket": "true",
        "cross_domain_bosh": "true",
        "c2s_require_encryption": "false",
    }
    for k, v in flags.items():
        if re.search(rf'^\s*{k}\s*=', body, re.M):
            body = re.sub(rf'^\s*{k}\s*=.*$', f'    {k} = {v}', body, flags=re.M)
        else:
            body = f'    {k} = {v}\n' + body
    return header + body

if re.search(vhost_re, text, re.DOTALL):
    text = re.sub(vhost_re, patch, text, count=1, flags=re.DOTALL)
open(path, "w").write(text)
print("OK vhost websocket", path)
PY
}

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

[[ -f "$CERT_CRT" ]] || prosodyctl cert generate "$DOMAIN" 2>/dev/null || true

cp -a "$MAIN" "/root/nginx-backups/prosody.cfg.lua.ws.$(date +%Y%m%d%H%M%S)"
python3 - "$MAIN" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
for key in ("consider_websocket_secure", "consider_bosh_secure"):
    if re.search(rf"(?m)^{key}\s*=", text):
        text = re.sub(rf"(?m)^{key}\s*=.*", f"{key} = true", text)
    else:
        text = f"{key} = true\n" + text
if "trusted_proxies" not in text:
    text += '\ntrusted_proxies = { "127.0.0.1", "::1" }\n'
open(path, "w").write(text)
print("OK global")
PY

for f in /etc/prosody/conf.d/${DOMAIN}.cfg.lua /etc/prosody/conf.avail/${DOMAIN}.cfg.lua; do
  patch_vhost "$f"
done

prosodyctl check config 2>&1 | tail -10 || true
systemctl restart prosody
sleep 3
systemctl restart jicofo

echo ""
grep -nE 'consider_websocket|consider_bosh' /etc/prosody/prosody.cfg.lua \
  /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null | head -8
echo ""
echo "Note: c2s:show 'insecure' derrière nginx peut être normal (HTTP local nginx→Prosody)."
echo "Test join MUC: bash ops/jitsi/check-muc-live.sh test-live-mcbuleli"
