#!/bin/bash
# FAQ Jitsi: focus@auth doit être dans muc_access_whitelist + admins sur le Component MUC.
# https://jitsi.github.io/handbook/docs/faq
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CONFERENCE="conference.${DOMAIN}"
FOCUS_JID="focus@${AUTH}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "FAIL: $CFG absent"; exit 1; }

cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").muc-whitelist.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$CONFERENCE" "$FOCUS_JID" <<'PY'
import re, sys

path, conference, focus_jid = sys.argv[1:4]
text = open(path).read()

# Retirer muc_wait_for_host (handbook JWT — bloque invités sans host)
text = re.sub(r'^\s*"muc_wait_for_host";\s*\n', '', text, flags=re.M)

muc_re = rf'(Component "{re.escape(conference)}" "muc"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'

def patch_muc(m):
    body = m.group(2)
    if "muc_access_whitelist" not in body:
        body = body.rstrip() + f'\n    muc_access_whitelist = {{ "{focus_jid}" }}\n'
    else:
        body = re.sub(
            r'muc_access_whitelist\s*=\s*\{[^}]*\}',
            f'muc_access_whitelist = {{ "{focus_jid}" }}',
            body,
            count=1,
        )
    if re.search(r'^\s*admins\s*=', body, re.M):
        if focus_jid not in body:
            body = re.sub(
                r'(admins\s*=\s*\{)',
                rf'\1 "{focus_jid}",',
                body,
                count=1,
            )
    else:
        body = body.rstrip() + f'\n    admins = {{ "{focus_jid}" }}\n'
    if "muc_room_locking" not in body:
        body += "    muc_room_locking = false\n"
    if "muc_room_default_public_jids" not in body:
        body += "    muc_room_default_public_jids = true\n"
    return m.group(1) + body

if re.search(muc_re, text, re.DOTALL):
    text = re.sub(muc_re, patch_muc, text, count=1, flags=re.DOTALL)
    print(f"OK: patched Component {conference}")
else:
    print(f"WARN: Component {conference} not found", file=sys.stderr)
    sys.exit(1)

open(path, "w").write(text)
PY

# Sync conf.avail si présent
AVAIL="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
if [[ -f "$AVAIL" && "$AVAIL" != "$CFG" ]]; then
  cp -a "$CFG" "$AVAIL"
fi

prosodyctl check config
if [[ "${SKIP_RESTART:-}" != "1" ]]; then
  systemctl restart prosody
  sleep 4
  systemctl restart jicofo
  sleep 10
fi

echo "==> MUC component (whitelist/admins)"
grep -A20 "Component \"${CONFERENCE}\"" "$CFG" | grep -E 'muc_access_whitelist|admins|muc_wait_for_host|muc_room_locking' || true

echo "OK — retest join après hard refresh navigateur"
