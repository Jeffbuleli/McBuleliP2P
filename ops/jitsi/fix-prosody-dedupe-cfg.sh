#!/bin/bash
# Prosody: Duplicate option restrict_room_creation/storage/modules_enabled → MUC/focus cassés.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CONFERENCE="conference.${DOMAIN}"
FOCUS_JID="focus@${AUTH}"
FOCUS_COMP="focus.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "FAIL: $CFG absent"; exit 1; }

mkdir -p /root/nginx-backups
cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").dedupe.$(date +%Y%m%d%H%M%S)"

echo "========== fix-prosody-dedupe-cfg =========="
echo "AVANT: $(grep -c "Component \"${CONFERENCE}\"" "$CFG" 2>/dev/null || echo 0) bloc(s) Component ${CONFERENCE}"

python3 - "$CFG" "$CONFERENCE" "$FOCUS_JID" "$FOCUS_COMP" "$AUTH" "$INTERNAL" <<'PY'
import re, sys

path, conference, focus_jid, focus_comp, auth, internal = sys.argv[1:7]
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

internal_block = f'''Component "{internal}" "muc"
    storage = "memory"
    muc_room_cache_size = 1000
    muc_room_locking = false
    muc_room_default_public_jids = true
    modules_enabled = {{
        "muc_meeting_id";
        "ping";
    }}
'''

def remove_blocks(name):
    global text
    text = re.sub(
        rf'(?m)^(?:--\s*)?Component "{re.escape(name)}"[^\n]*\n.*?(?=\n(?:VirtualHost|Component)\s|\Z)',
        '',
        text,
        flags=re.DOTALL,
    )

domain = conference.replace("conference.", "", 1)
keep = {conference, focus_comp, internal}
removed = []

# Supprimer TOUS les Components optionnels (polls, breakout, etc.) — cause ParseError Jicofo
for comp in list(re.findall(r'(?m)^(?:--\s*)?Component "([^"]+)"', text)):
    if comp in keep:
        continue
    if domain not in comp and "auth." not in comp:
        continue
    remove_blocks(comp)
    removed.append(comp)

for comp in (conference, focus_comp, internal):
    remove_blocks(comp)

if removed:
    print("REMOVED optional:", ", ".join(sorted(set(removed))))

marker = "-- mcbuleli-dedupe-cfg"
if marker not in text:
    text = text.rstrip() + f"\n\n{marker}\n"

text = text.rstrip() + f"\n\n{internal_block}\n{muc_block}\n{focus_block}\n"

# Dédupliquer clés répétées dans chaque VirtualHost/Component (1ère occurrence gagne)
def dedupe_block_keys(block: str) -> str:
    seen = set()
    out = []
    in_modules = False
    for line in block.splitlines():
        stripped = line.strip()
        if stripped.startswith('modules_enabled'):
            if 'modules_enabled' in seen:
                in_modules = True
                continue
            seen.add('modules_enabled')
            in_modules = '{' in stripped and '}' not in stripped
            out.append(line)
            continue
        if in_modules:
            out.append(line)
            if '}' in stripped:
                in_modules = False
            continue
        m = re.match(r'^(\s*)(\w+)\s*=', line)
        if m:
            key = m.group(2)
            if key in seen:
                continue
            seen.add(key)
        out.append(line)
    return '\n'.join(out)

def dedupe_all_blocks(src: str) -> str:
    pat = re.compile(
        r'(?m)^((?:VirtualHost|Component)\s+"[^"]+"[^\n]*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)',
        re.DOTALL,
    )
    def repl(m):
        return m.group(1) + dedupe_block_keys(m.group(2)) + '\n'
    return pat.sub(repl, src)

text = dedupe_all_blocks(text)
open(path, "w").write(text)
print(f"OK: canonical {internal} + {conference} + {focus_comp}")
PY

AVAIL="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
if [[ -f "$AVAIL" ]]; then
  CFG_REAL="$(readlink -f "$CFG" 2>/dev/null || echo "$CFG")"
  AVAIL_REAL="$(readlink -f "$AVAIL" 2>/dev/null || echo "$AVAIL")"
  if [[ "$CFG_REAL" != "$AVAIL_REAL" ]]; then
    cp -a "$CFG" "$AVAIL"
  fi
fi

echo ""
echo "==> prosodyctl check (pas de Duplicate option)"
CHECK="$(prosodyctl check config 2>&1 || true)"
echo "$CHECK" | tail -20
if echo "$CHECK" | grep -qi 'Duplicate option'; then
  echo ""
  echo "FAIL: Duplicate option encore présent:"
  echo "$CHECK" | grep -i 'Duplicate option'
  echo ""
  echo "Coller pour analyse:"
  echo "  nl -ba $CFG | sed -n '95,140p'"
  exit 1
fi

echo ""
echo "==> Components actifs (attendu: 3 — internal, conference, focus)"
grep -E '^\s*Component "' "$CFG" | grep -v '^--' || true
COMP_N=$(grep -E '^\s*Component "' "$CFG" | grep -v '^--' | wc -l | tr -d ' ')
[[ "$COMP_N" -le 3 ]] || echo "WARN: ${COMP_N} components — ParseError Jicofo probable"

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
