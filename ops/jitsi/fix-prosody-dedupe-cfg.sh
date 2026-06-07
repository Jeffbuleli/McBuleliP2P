#!/bin/bash
# Prosody: Duplicate option restrict_room_creation/storage/modules_enabled → MUC/focus cassés.
# Cause: fix-muc-focus-whitelist et autres scripts ont empilé des blocs conference muc.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CONFERENCE="conference.${DOMAIN}"
FOCUS_JID="focus@${AUTH}"
FOCUS_COMP="focus.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "FAIL: $CFG absent"; exit 1; }

mkdir -p /root/nginx-backups
cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").dedupe.$(date +%Y%m%d%H%M%S)"

echo "========== fix-prosody-dedupe-cfg =========="
echo "AVANT: $(grep -c "Component \"${CONFERENCE}\"" "$CFG" 2>/dev/null || echo 0) bloc(s) Component ${CONFERENCE}"

python3 - "$CFG" "$CONFERENCE" "$FOCUS_JID" "$FOCUS_COMP" "$AUTH" <<'PY'
import re, sys

path, conference, focus_jid, focus_comp, auth = sys.argv[1:6]
text = open(path).read()

muc_block = f'''Component "{conference}" "muc"
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

focus_block = f'''Component "{focus_comp}" "client_proxy"
    target_address = "{focus_jid}"
'''

# Supprimer TOUS les blocs conference muc (y compris dupliqués / commentés partiellement)
text = re.sub(
    rf'(?m)^(?:--\s*)?Component "{re.escape(conference)}"[^\n]*\n.*?(?=\n(?:VirtualHost|Component)\s|\Z)',
    '',
    text,
    flags=re.DOTALL,
)

# Supprimer blocs focus client_proxy dupliqués
text = re.sub(
    rf'(?m)^(?:--\s*)?Component "{re.escape(focus_comp)}"[^\n]*\n.*?(?=\n(?:VirtualHost|Component)\s|\Z)',
    '',
    text,
    flags=re.DOTALL,
)

marker = "-- mcbuleli-dedupe-cfg"
if marker not in text:
    text = text.rstrip() + f"\n\n{marker}\n"

text = text.rstrip() + f"\n\n{muc_block}\n{focus_block}\n"
open(path, "w").write(text)
print(f"OK: single Component {conference} + {focus_comp}")
PY

AVAIL="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
[[ -f "$AVAIL" && "$AVAIL" != "$CFG" ]] && cp -a "$CFG" "$AVAIL"

echo ""
echo "==> prosodyctl check (pas de Duplicate option)"
CHECK="$(prosodyctl check config 2>&1 || true)"
echo "$CHECK" | tail -15
if echo "$CHECK" | grep -qi 'Duplicate option'; then
  echo "FAIL: Duplicate option encore présent — lignes:"
  echo "$CHECK" | grep -i 'Duplicate option'
  exit 1
fi

echo ""
echo "==> Blocs conference + focus"
grep -n "Component \"${CONFERENCE}\"" "$CFG" | head -3
grep -A10 "Component \"${CONFERENCE}\"" "$CFG" | head -12

if [[ "${SKIP_RESTART:-0}" != "1" ]]; then
  systemctl restart prosody
  sleep 6
  systemctl restart jicofo jitsi-videobridge2
  sleep 12
fi

echo "OK — puis: sudo bash ops/jitsi/fix-focus-pre-join.sh"
