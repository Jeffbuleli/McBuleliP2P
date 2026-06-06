#!/bin/bash
# JVB sans MucClient/brewery dans jvb.log → pas de conférence, bouton Joindre figé.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-jvb-config.sh
source "${SCRIPT_DIR}/lib-jvb-config.sh"

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CFG_PROSODY="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
JVB_CONF="/etc/jitsi/videobridge/jvb.conf"
VCFG="/etc/jitsi/videobridge/config"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

JVB_PASS="$(grep -E '^JVB_AUTH_PASSWORD=|^JVB_SECRET=' "$VCFG" 2>/dev/null | head -1 | cut -d= -f2- || true)"
[[ -n "$JVB_PASS" ]] || JVB_PASS="$(openssl rand -hex 16)"

cp -a "$JVB_CONF" "${JVB_CONF}.bak.brewery.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
mcbuleli_ensure_jvb_runtime_config "$DOMAIN" "$AUTH" "$JVB_PASS"
mcbuleli_write_jvb_hocon "$DOMAIN" "$AUTH" "$INTERNAL" "$JVB_PASS"

# Composant internal.auth (brewery MUC) dans Prosody
if [[ -f "$CFG_PROSODY" ]] && ! grep -q "Component \"${INTERNAL}\"" "$CFG_PROSODY"; then
  cat >> "$CFG_PROSODY" <<EOF

Component "${INTERNAL}" "muc"
    storage = "memory"
    muc_room_cache_size = 1000
    modules_enabled = {
        "ping";
    }
EOF
  echo "ADDED Component ${INTERNAL}"
fi

prosodyctl deluser "jvb@${AUTH}" 2>/dev/null || true
prosodyctl register jvb "${AUTH}" "${JVB_PASS}"

prosodyctl check config || true
systemctl restart prosody
sleep 3
systemctl restart jitsi-videobridge2 jicofo
sleep 15

echo "=== jvb.log (cherchez MucClient / brewery) ==="
grep -iE 'MucClient|brewery|xmpp|Authenticated|Joined|error|SEVERE' /var/log/jitsi/jvb.log 2>/dev/null | tail -20 \
  || journalctl -u jitsi-videobridge2 -n 30 --no-pager | grep -iE 'MucClient|brewery|xmpp|error'

echo ""
echo "=== jicofo.log (bridge) ==="
grep -iE 'bridge|brewery|Added' /var/log/jitsi/jicofo.log 2>/dev/null | tail -10
