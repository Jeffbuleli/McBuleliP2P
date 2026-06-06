#!/bin/bash
# Auth OK puis disconnect sans join MUC — Prosody live vhost: bosh/websocket + secure flags.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "Missing $CFG"; exit 1; }

cp -a "$CFG" "${CFG}.bak.live-ws.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$DOMAIN" "$CONFERENCE" <<'PY'
import re, sys

path, domain, conference = sys.argv[1:4]
text = open(path).read()

vhost_re = rf'(VirtualHost "{re.escape(domain)}"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'

def patch_live(m):
    header, body = m.group(1), m.group(2)
    # Modules indispensables navigateur → MUC
    if 'modules_enabled' in body:
        for mod in ('"bosh"', '"websocket"', '"smacks"', '"ping"'):
            if mod not in body:
                body = re.sub(
                    r'(modules_enabled\s*=\s*\{)',
                    rf'\1\n        {mod};',
                    body,
                    count=1,
                )
    else:
        body = '''    modules_enabled = {
        "bosh";
        "websocket";
        "smacks";
        "ping";
        "speakerstats";
        "turncredentials";
        "conference_duration";
        "room_metadata";
    }
''' + body
    flags = {
        "consider_websocket_secure": "true",
        "consider_bosh_secure": "true",
        "cross_domain_websocket": "true",
        "cross_domain_bosh": "true",
        "c2s_require_encryption": "false",
    }
    for key, val in flags.items():
        if re.search(rf'^\s*{re.escape(key)}\s*=', body, re.M):
            body = re.sub(rf'^\s*{re.escape(key)}\s*=.*$', f'    {key} = {val}', body, flags=re.M)
        else:
            body = f'    {key} = {val}\n' + body
    # STUN warning fix
    if 'external_services' not in body:
        body += f'''
    external_services = {{
        {{ type = "stun"; host = "{domain}"; port = 3478; transport = "udp"; }};
    }}
'''
    return header + body

if not re.search(vhost_re, text, re.DOTALL):
    print(f"VirtualHost {domain} not found", file=sys.stderr)
    sys.exit(1)
text = re.sub(vhost_re, patch_live, text, count=1, flags=re.DOTALL)

# MUC: token_verification + log debug temporaire
muc_re = rf'(Component "{re.escape(conference)}" "muc"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'

def patch_muc(m):
    header, body = m.group(1), m.group(2)
    if '"token_verification"' not in body:
        body = re.sub(
            r'(modules_enabled\s*=\s*\{)',
            r'\1\n        "token_verification";',
            body,
            count=1,
        )
    if 'muc_room_locking' not in body:
        body = "    muc_room_locking = false\n    muc_room_default_public_jids = true\n" + body
    if 'muc#room@' not in body and 'log' not in body:
        body += '    log = { muc = "info"; }\n'
    return header + body

if re.search(muc_re, text, re.DOTALL):
    text = re.sub(muc_re, patch_muc, text, count=1, flags=re.DOTALL)
else:
    print(f"WARN: Component {conference} not found", file=sys.stderr)

open(path, "w").write(text)
print("OK Prosody live websocket + muc token")
PY

prosodyctl check config
systemctl restart prosody
sleep 3
systemctl restart jicofo

echo ""
echo "==> Vérification modules live vhost"
grep -A35 "VirtualHost \"${DOMAIN}\"" "$CFG" | grep -E 'modules_enabled|bosh|websocket|consider_|c2s_require' | head -12

echo ""
echo "OK — retest join; grep MUC:"
echo "  grep -iE 'muc|test-live|not.?allowed|token' /var/log/prosody/prosody.log | tail -30"
