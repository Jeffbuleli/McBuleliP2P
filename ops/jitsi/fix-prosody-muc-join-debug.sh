#!/bin/bash
# target_MISSING + 2 c2s : auth OK, join MUC échoue — debug + JWT conf.d + muc log.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

bash "$SCRIPT_DIR/fix-prosody-jwt-conf-d.sh"

for CFG in /etc/prosody/conf.d/${DOMAIN}.cfg.lua; do
  [[ -f "$CFG" ]] || continue
  cp -a "$CFG" "${CFG}.bak.muc-join.$(date +%Y%m%d%H%M%S)"
  python3 - "$CFG" "$CONFERENCE" <<'PY'
import re, sys
path, conf = sys.argv[1], sys.argv[2]
text = open(path).read()
muc_re = rf'(Component "{re.escape(conf)}" "muc"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'

def patch(m):
    header, body = m.group(1), m.group(2)
    if '"token_verification"' not in body:
        body = re.sub(r'(modules_enabled\s*=\s*\{)', r'\1\n        "token_verification";', body, count=1)
    if "muc_room_locking" not in body:
        body = "    muc_room_locking = false\n    muc_room_default_public_jids = true\n" + body
    if "log = {" not in body:
        body += '    log = { muc = "info"; }\n'
    return header + body

if re.search(muc_re, text, re.DOTALL):
    text = re.sub(muc_re, patch, text, count=1, flags=re.DOTALL)
open(path, "w").write(text)
print("OK muc component", path)
PY
done

: > /var/log/prosody/prosody.log 2>/dev/null || true
prosodyctl check config 2>&1 | tail -8 || true
systemctl restart prosody
sleep 3
systemctl restart jicofo

echo ""
echo "OK — procédure test:"
echo "  Terminal 1: sudo bash ops/jitsi/capture-muc-join.sh test-live-mcbuleli"
echo "  Terminal 2: host + guest rejoignent pendant les 25s"
echo "  Puis: sudo bash ops/jitsi/check-muc-live.sh test-live-mcbuleli"
