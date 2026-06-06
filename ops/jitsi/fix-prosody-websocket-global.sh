#!/bin/bash
# c2s:show → Security "insecure" = clients ne joignent pas la MUC.
# consider_websocket_secure doit être GLOBAL (prosodyctl check l'exige).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MAIN="/etc/prosody/prosody.cfg.lua"
CFG_D="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
CFG_A="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
cp -a "$MAIN" "/root/nginx-backups/prosody.cfg.lua.ws-global.$(date +%Y%m%d%H%M%S)"

python3 - "$MAIN" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()

flags = {
    "consider_websocket_secure": "true",
    "consider_bosh_secure": "true",
}
for key, val in flags.items():
    if re.search(rf"(?m)^{key}\s*=", text):
        text = re.sub(rf"(?m)^{key}\s*=.*", f"{key} = {val}", text)
    else:
        text = re.sub(
            r"(?m)^(interfaces\s*=)",
            f"{key} = {val}\n\\1",
            text,
            count=1,
        ) if re.search(r"(?m)^interfaces\s*=", text) else f"{key} = {val}\n" + text

# Proxy nginx → Prosody :5280
if "trusted_proxies" not in text:
    text += '\ntrusted_proxies = { "127.0.0.1", "::1" }\n'

open(path, "w").write(text)
print("OK global consider_* + trusted_proxies")
PY

for CFG in "$CFG_D" "$CFG_A"; do
  [[ -f "$CFG" ]] || continue
  cp -a "$CFG" "${CFG}.bak.ws-global.$(date +%Y%m%d%H%M%S)"
  python3 - "$CFG" "$DOMAIN" <<'PY'
import re, sys
path, domain = sys.argv[1], sys.argv[2]
text = open(path).read()
# Retirer doublons vhost (doivent être globaux)
for key in ("consider_websocket_secure", "consider_bosh_secure", "cross_domain_bosh"):
    text = re.sub(rf'(?m)^\s*{key}\s*=.*\n', '', text)
# Vhost live: c2s_require_encryption false pour bosh/ws
vhost = rf'VirtualHost "{re.escape(domain)}"'
if vhost in text and "c2s_require_encryption" not in text:
    text = re.sub(vhost, f'VirtualHost "{domain}"\n    c2s_require_encryption = false', text, count=1)
open(path, "w").write(text)
print("OK cleaned vhost", path)
PY
done

prosodyctl check config 2>&1 | tail -12 || true
systemctl restart prosody
sleep 3
systemctl restart jicofo

echo ""
echo "==> c2s après fix (attendu: Security secure ou TLS)"
prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | head -8 || true
