#!/bin/bash
# auth.live.mcbuleli.org doit avoir authentication = "internal_hashed" pour focus/jvb.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
MAIN="/etc/prosody/prosody.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "root required"; exit 1; }
[[ -f "$CFG" ]] || { echo "missing $CFG"; exit 1; }

cp -a "$CFG" "${CFG}.bak.authvhost.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$AUTH" <<'PY'
import re, sys
path, auth = sys.argv[1], sys.argv[2]
text = open(path).read()
pat = rf'(VirtualHost "{re.escape(auth)}"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'

def patch(m):
    body = m.group(2)
    if not re.search(r'authentication\s*=\s*"internal_hashed"', body):
        body = '    authentication = "internal_hashed"\n' + body
    if not re.search(r'c2s_require_encryption\s*=\s*false', body):
        body = '    c2s_require_encryption = false\n' + body
    return m.group(1) + body

if not re.search(pat, text, re.DOTALL):
    block = f'''
VirtualHost "{auth}"
    authentication = "internal_hashed"
    c2s_require_encryption = false
    ssl = {{
        key = "/etc/prosody/certs/{auth}.key";
        certificate = "/etc/prosody/certs/{auth}.crt";
    }}
'''
    text = text + block
    print(f"ADDED VirtualHost {auth}")
else:
    text = re.sub(pat, patch, text, count=1, flags=re.DOTALL)
    print(f"PATCHED VirtualHost {auth}")

open(path, "w").write(text)
PY

# admins global
for f in "$MAIN" "$CFG"; do
  [[ -f "$f" ]] || continue
  if grep -q '^admins' "$f"; then
    if ! grep -q "focus@${AUTH}" "$f"; then
      sed -i "s|^admins = {|admins = { \"focus@${AUTH}\", \"jvb@${AUTH}\", |" "$f"
    fi
  else
    echo "admins = { \"focus@${AUTH}\", \"jvb@${AUTH}\" }" >> "$f"
  fi
done

echo "=== auth VirtualHost ==="
grep -A8 "VirtualHost \"${AUTH}\"" "$CFG"

prosodyctl check config || true
if [[ "${SKIP_RESTART:-0}" != "1" ]]; then
  systemctl restart prosody
fi
echo "OK — relancez fix jicofo password puis restart jicofo"
