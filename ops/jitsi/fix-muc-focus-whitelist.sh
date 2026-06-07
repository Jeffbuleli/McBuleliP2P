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

# Éviter Duplicate option — remplacer tout le bloc muc par une version canonique
canonical = f'''Component "{conference}" "muc"
    storage = "memory"
    restrict_room_creation = false
    admins = {{ "{focus_jid}" }}
    muc_room_locking = false
    muc_room_default_public_jids = true
    muc_access_whitelist = {{ "{focus_jid}" }}
    modules_enabled = {{
        "muc_meeting_id";
        "muc_domain_mapper";
    }}
'''
text = re.sub(
    rf'(?m)^(?:--\s*)?Component "{re.escape(conference)}"[^\n]*\n.*?(?=\n(?:VirtualHost|Component)\s|\Z)',
    '',
    text,
    flags=re.DOTALL,
)
text = text.rstrip() + f"\n\n{canonical}\n"
print(f"OK: replaced Component {conference} (dedupe)")

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
