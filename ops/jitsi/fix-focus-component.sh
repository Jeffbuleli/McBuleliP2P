#!/bin/bash
# Force client_proxy focus.live → target_address = focus@auth (IQ conference).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
FOCUS_COMP="focus.${DOMAIN}"
FOCUS_JID="focus@${AUTH}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "FAIL: $CFG absent"; exit 1; }

cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").focus-comp.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$FOCUS_COMP" "$FOCUS_JID" <<'PY'
import re, sys
path, comp, target = sys.argv[1:4]
text = open(path).read()
block = f'''Component "{comp}" "client_proxy"
    target_address = "{target}"
'''
pat = rf'Component "{re.escape(comp)}"[^\n]*\n.*?(?=\n(?:VirtualHost|Component)\s|\Z)'
if re.search(pat, text, re.DOTALL):
    text = re.sub(pat, block.rstrip() + "\n", text, count=1, flags=re.DOTALL)
    print(f"PATCHED {comp} → {target}")
else:
    text = text.rstrip() + "\n\n" + block
    print(f"ADDED {comp} → {target}")
open(path, "w").write(text)
PY

prosodyctl check config 2>&1 | tail -5 || true
echo "==> focus component"
grep -A3 "Component \"${FOCUS_COMP}\"" "$CFG"

if [[ "${SKIP_RESTART:-0}" != "1" ]]; then
  systemctl restart prosody
  sleep 6
fi
