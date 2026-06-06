#!/bin/bash
# Standalone — pas de lib-jvb-config.sh requis. Copier sur VPS si git pull ne l'a pas.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
VCFG="/etc/jitsi/videobridge/config"
JVB_HOCON="/etc/jitsi/videobridge/jvb.conf"
SIP="/etc/jitsi/videobridge/sip-communicator.properties"
CFG_PROSODY="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

JVB_PASS="$(grep -E '^JVB_AUTH_PASSWORD=|^JVB_SECRET=' "$VCFG" 2>/dev/null | head -1 | cut -d= -f2- || true)"
[[ -n "$JVB_PASS" ]] || JVB_PASS="$(openssl rand -hex 16)"

ts="$(date +%Y%m%d%H%M%S)"
[[ -f "$VCFG" ]] && cp -a "$VCFG" "${VCFG}.bak.${ts}"

# Mettre à jour clés sans écraser tout le fichier
for kv in "JVB_HOSTNAME=${DOMAIN}" "JVB_AUTH_DOMAIN=${AUTH}" "JVB_AUTH_PASSWORD=${JVB_PASS}" "JVB_PORT=10000"; do
  key="${kv%%=*}"; val="${kv#*=}"
  if grep -q "^${key}=" "$VCFG" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$VCFG"
  else
    echo "${key}=${val}" >> "$VCFG"
  fi
done
grep -q '^JVB_SECRET=' "$VCFG" 2>/dev/null && sed -i "s|^JVB_SECRET=.*|JVB_SECRET=${JVB_PASS}|" "$VCFG"

sed -i '/^JAVA_SYS_PROPS=/d' "$VCFG"
sed -i '/^JVB_OPTS=.*--apis=/d' "$VCFG"
cat >> "$VCFG" <<EOF

# mcbuleli-force-xmpp ${ts}
JAVA_SYS_PROPS="-Dconfig.file=${JVB_HOCON} -Dnet.java.sip.communicator.SC_HOME_DIR_LOCATION=/etc/jitsi -Dnet.java.sip.communicator.SC_HOME_DIR_NAME=videobridge -Dnet.java.sip.communicator.SC_LOG_DIR_LOCATION=/var/log/jitsi -Djava.util.logging.config.file=/etc/jitsi/videobridge/logging.properties"
EOF

cat > "$JVB_HOCON" <<EOF
videobridge {
  stats {
    enabled = true
    transports = [ { type = "muc" } ]
  }
  apis {
    rest { enabled = true }
  }
  apis.xmpp-client.configs {
    shard {
      HOSTNAME=${DOMAIN}
      DOMAIN="${AUTH}"
      USERNAME=jvb
      PASSWORD="${JVB_PASS}"
      MUC_JIDS="jvbbrewery@${INTERNAL}"
      MUC_NICKNAME=jvb-${DOMAIN}
      DISABLE_CERTIFICATE_VERIFICATION=true
    }
  }
}
ice4j {
  harvest {
    mapping {
      stun { addresses = ["meet-jit-si-turnrelay.jitsi.net:443"] }
    }
  }
}
EOF

cat > "$SIP" <<EOF
org.jitsi.videobridge.xmpp.user.shard.HOSTNAME=${DOMAIN}
org.jitsi.videobridge.xmpp.user.shard.DOMAIN=${AUTH}
org.jitsi.videobridge.xmpp.user.shard.USERNAME=jvb
org.jitsi.videobridge.xmpp.user.shard.PASSWORD=${JVB_PASS}
org.jitsi.videobridge.xmpp.user.shard.MUC_JIDS=jvbbrewery@${INTERNAL}
org.jitsi.videobridge.xmpp.user.shard.MUC_NICKNAME=jvb-${DOMAIN}
org.jitsi.videobridge.xmpp.user.shard.DISABLE_CERTIFICATE_VERIFICATION=true
EOF

if [[ -f "$CFG_PROSODY" ]] && ! grep -q "Component \"${INTERNAL}\"" "$CFG_PROSODY"; then
  cat >> "$CFG_PROSODY" <<EOF

Component "${INTERNAL}" "muc"
    storage = "memory"
    muc_room_cache_size = 1000
    modules_enabled = { "ping"; }
EOF
fi

prosodyctl deluser "jvb@${AUTH}" 2>/dev/null || true
prosodyctl register jvb "${AUTH}" "${JVB_PASS}"
chown -R jvb:jitsi /etc/jitsi/videobridge
chmod 750 /etc/jitsi/videobridge
chmod 640 "$VCFG" "$JVB_HOCON" "$SIP" 2>/dev/null || true

echo "==> config"
grep -E '^(JVB_|JAVA_SYS_PROPS)' "$VCFG"
echo "==> jvb.conf shard:"
grep -A8 'shard' "$JVB_HOCON"

systemctl restart prosody && sleep 2
systemctl restart jitsi-videobridge2 && sleep 18

jvb_pid="$(systemctl show -p MainPID --value jitsi-videobridge2)"
echo "==> Java cmdline:"
tr '\0' ' ' < "/proc/${jvb_pid}/cmdline"; echo
tr '\0' ' ' < "/proc/${jvb_pid}/cmdline" | grep -q '\-Dconfig\.file=' && echo "OK config.file" || echo "ECHEC config.file"

echo "==> logs:"
tail -35 /var/log/jitsi/jvb.log
grep -qiE 'MucClient|xmpp\.user\.shard|Joined' /var/log/jitsi/jvb.log && echo "OK MucClient" || echo "ECHEC MucClient"
