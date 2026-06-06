#!/bin/bash
# JVB « host-unknown: This server does not serve auth » → DOMAIN = auth.live.mcbuleli.org
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"

VCFG="/etc/jitsi/videobridge/config"
JVB_HOCON="/etc/jitsi/videobridge/jvb.conf"
SIP="/etc/jitsi/videobridge/sip-communicator.properties"

[[ "$(id -u)" -eq 0 ]] || { echo "root required"; exit 1; }

JVB_PASS=""
[[ -f "$VCFG" ]] && source "$VCFG" 2>/dev/null || true
JVB_PASS="${JVB_AUTH_PASSWORD:-$(openssl rand -hex 16)}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-jvb-config.sh
source "${SCRIPT_DIR}/lib-jvb-config.sh"
mcbuleli_ensure_jvb_runtime_config "$DOMAIN" "$AUTH" "$JVB_PASS"

# HOCON jvb.conf — corriger DOMAIN = "auth" ou auth.localhost
if [[ -f "$JVB_HOCON" ]]; then
  cp -a "$JVB_HOCON" "${JVB_HOCON}.bak.$(date +%Y%m%d%H%M%S)"
  sed -i \
    -e "s|auth\.localhost|${AUTH}|g" \
    -e "s|localhost|${DOMAIN}|g" \
    -e "s|DOMAIN = \"auth\"|DOMAIN = \"${AUTH}\"|g" \
    -e "s|DOMAIN=\"auth\"|DOMAIN = \"${AUTH}\"|g" \
    -e "s|HOSTNAME = \"auth[^\"]*\"|HOSTNAME = \"${DOMAIN}\"|g" \
    -e "s|PASSWORD = \"[^\"]*\"|PASSWORD = \"${JVB_PASS}\"|g" \
    -e "s|USERNAME = \"[^\"]*\"|USERNAME = \"jvb\"|g" \
    "$JVB_HOCON"
  if ! grep -q "DOMAIN = \"${AUTH}\"" "$JVB_HOCON"; then
    cat >> "$JVB_HOCON" <<EOF

# mcbuleli-jvb-xmpp
videobridge {
  apis {
    xmpp-client {
      configs {
        shard {
          HOSTNAME = "${DOMAIN}"
          DOMAIN = "${AUTH}"
          USERNAME = "jvb"
          PASSWORD = "${JVB_PASS}"
          MUC_JIDS = "jvbbrewery@${INTERNAL}"
          MUC_NICKNAME = "jvb-${DOMAIN}"
        }
      }
    }
  }
}
EOF
  fi
fi

if [[ -f "$SIP" ]]; then
  sed -i "s|auth\.localhost|${AUTH}|g; s|@auth\\.[^;]*|@${AUTH}|g" "$SIP" || true
fi

prosodyctl deluser "jvb@${AUTH}" 2>/dev/null || true
prosodyctl register jvb "${AUTH}" "${JVB_PASS}"

systemctl restart prosody
sleep 2
systemctl restart jitsi-videobridge2

echo "=== JVB config ==="
grep -hE 'JVB_|DOMAIN|HOSTNAME|PASSWORD|USERNAME' "$VCFG" "$JVB_HOCON" 2>/dev/null | grep -v '^#' | head -20
echo ""
sleep 8
echo "=== jvb.log ==="
tail -20 /var/log/jitsi/jvb.log | grep -iE 'connect|auth|error|authenticated|host-unknown|INFO|WARNING' || tail -10 /var/log/jitsi/jvb.log
