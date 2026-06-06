#!/bin/bash
# Jicofo brewery OK mais service-unavailable → JVB pas dans brewery + composants Prosody.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-jvb-config.sh
source "${SCRIPT_DIR}/lib-jvb-config.sh"

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
VCFG="/etc/jitsi/videobridge/config"
JVB_CONF="/etc/jitsi/videobridge/jvb.conf"
SIP="/etc/jitsi/videobridge/sip-communicator.properties"
JICOFO="/etc/jitsi/jicofo/jicofo.conf"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

JVB_PASS="$(grep -E '^JVB_AUTH_PASSWORD=|^JVB_SECRET=' "$VCFG" 2>/dev/null | head -1 | cut -d= -f2- || openssl rand -hex 16)"
FOCUS_PASS="$(grep ^JICOFO_AUTH_PASSWORD= /etc/jitsi/jicofo/config 2>/dev/null | cut -d= -f2- || true)"

mcbuleli_ensure_jvb_runtime_config "$DOMAIN" "$AUTH" "$JVB_PASS"
mcbuleli_write_jvb_hocon "$DOMAIN" "$AUTH" "$INTERNAL" "$JVB_PASS"

# Legacy sip-communicator (certains paquets JVB lisent encore ce fichier)
cat > "$SIP" <<EOF
org.jitsi.videobridge.xmpp.user.shard.HOSTNAME=${DOMAIN}
org.jitsi.videobridge.xmpp.user.shard.DOMAIN=${AUTH}
org.jitsi.videobridge.xmpp.user.shard.USERNAME=jvb
org.jitsi.videobridge.xmpp.user.shard.PASSWORD=${JVB_PASS}
org.jitsi.videobridge.xmpp.user.shard.MUC_JIDS=jvbbrewery@${INTERNAL}
org.jitsi.videobridge.xmpp.user.shard.MUC_NICKNAME=jvb-${DOMAIN}
org.jitsi.videobridge.xmpp.user.shard.DISABLE_CERTIFICATE_VERIFICATION=true
EOF

python3 - "$CFG" "$DOMAIN" "$AUTH" "$INTERNAL" <<'PY'
import re, sys
path, domain, auth, internal = sys.argv[1:5]
text = open(path).read()

def ensure_component(name, body):
    global text
    if f'Component "{name}"' in text:
        return
    text += f"\n{body}\n"
    print(f"ADDED Component {name}")

ensure_component(internal, f'''Component "{internal}" "muc"
    storage = "memory"
    muc_room_cache_size = 1000
    muc_room_locking = false
    muc_room_default_public_jids = true
    modules_enabled = {{
        "muc_meeting_id";
        "ping";
    }}''')

ensure_component(f"focus.{domain}", f'''Component "focus.{domain}" "client_proxy"
    target_address = "focus@{auth}"''')

open(path, "w").write(text)
print("OK Prosody components")
PY

prosodyctl deluser "jvb@${AUTH}" 2>/dev/null || true
prosodyctl register jvb "${AUTH}" "${JVB_PASS}"
if [[ -n "$FOCUS_PASS" ]]; then
  prosodyctl deluser "focus@${AUTH}" 2>/dev/null || true
  prosodyctl register focus "${AUTH}" "${FOCUS_PASS}"
fi

# Jicofo brewery JID
if [[ -f "$JICOFO" ]] && ! grep -q 'brewery-jid' "$JICOFO"; then
  cat >> "$JICOFO" <<EOF

# mcbuleli-brewery
jicofo {
  bridge {
    brewery-jid = "jvbbrewery@${INTERNAL}"
  }
}
EOF
fi

prosodyctl check config || true
systemctl restart prosody
sleep 3
systemctl restart jitsi-videobridge2 jicofo
sleep 20

echo "=== JVB (journalctl + fichier) ==="
journalctl -u jitsi-videobridge2 -n 50 --no-pager | grep -iE 'MucClient|brewery|xmpp|Joined|Authenticated|error|SEVERE' | tail -15
grep -iE 'MucClient|brewery|Joined' /var/log/jitsi/jvb.log 2>/dev/null | tail -10 || true

echo ""
echo "=== Jicofo bridge ==="
grep -iE 'bridge|brewery|Added|Removed|service-unavailable' /var/log/jitsi/jicofo.log | tail -15
