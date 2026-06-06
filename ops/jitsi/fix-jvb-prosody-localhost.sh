#!/bin/bash
# JVB → Prosody Connection refused (live.mcbuleli.org → 127.0.0.1:5222)
# + ColibriWebSocket wss://:443 (domaine vide).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
VCFG="/etc/jitsi/videobridge/config"
JVB_HOCON="/etc/jitsi/videobridge/jvb.conf"
SIP="/etc/jitsi/videobridge/sip-communicator.properties"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

JVB_PASS="$(grep -E '^JVB_AUTH_PASSWORD=|^JVB_SECRET=' "$VCFG" 2>/dev/null | head -1 | cut -d= -f2-)"
PUBLIC_IP="${JVB_PUBLIC_IP:-$(curl -4fsSL --max-time 4 ifconfig.me 2>/dev/null || true)}"
LOCAL_IP="$(ip -4 route get "${PUBLIC_IP:-1.1.1.1}" 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' || true)"
[[ -n "$LOCAL_IP" ]] || LOCAL_IP="$(hostname -I | awk '{print $1}')"
[[ -n "$PUBLIC_IP" ]] || PUBLIC_IP="$LOCAL_IP"

# XMPP : HOSTNAME = où Prosody écoute (même machine → 127.0.0.1, pas le vhost public)
XMPP_HOST="127.0.0.1"
if ! nc -z "$XMPP_HOST" 5222 2>/dev/null; then
  echo "WARN: Prosody pas sur ${XMPP_HOST}:5222 — vérifiez systemctl status prosody"
  ss -tlnp | grep 5222 || true
fi

cat > "$JVB_HOCON" <<EOF
videobridge {
  stats {
    enabled = true
    transports = [
      { type = "muc" }
    ]
  }
  apis {
    rest {
      enabled = true
    }
  }
  websockets {
    enabled = false
  }
  apis.xmpp-client.configs {
    shard {
      HOSTNAME=${XMPP_HOST}
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
      static-mappings = [
        {
          local-address = "${LOCAL_IP}"
          public-address = "${PUBLIC_IP}"
        }
      ]
      stun {
        addresses = ["meet-jit-si-turnrelay.jitsi.net:443"]
      }
    }
  }
}
EOF

cat > "$SIP" <<EOF
org.jitsi.videobridge.xmpp.user.shard.HOSTNAME=${XMPP_HOST}
org.jitsi.videobridge.xmpp.user.shard.DOMAIN=${AUTH}
org.jitsi.videobridge.xmpp.user.shard.USERNAME=jvb
org.jitsi.videobridge.xmpp.user.shard.PASSWORD=${JVB_PASS}
org.jitsi.videobridge.xmpp.user.shard.MUC_JIDS=jvbbrewery@${INTERNAL}
org.jitsi.videobridge.xmpp.user.shard.MUC_NICKNAME=jvb-${DOMAIN}
org.jitsi.videobridge.xmpp.user.shard.DISABLE_CERTIFICATE_VERIFICATION=true
org.jitsi.videobridge.nat.NAT_HARVESTER_LOCAL_ADDRESS=${LOCAL_IP}
org.jitsi.videobridge.nat.NAT_HARVESTER_PUBLIC_ADDRESS=${PUBLIC_IP}
org.jitsi.videobridge.nat.DISABLE_AWS_HARVESTER=true
EOF

chown -R jvb:jitsi /etc/jitsi/videobridge
command -v ufw >/dev/null && ufw allow 10000/udp 2>/dev/null || true

echo "==> Validation HOCON jvb.conf"
if command -v hocon >/dev/null 2>&1; then
  hocon -f "$JVB_HOCON" get videobridge.stats.enabled
  hocon -f "$JVB_HOCON" get "videobridge.apis.xmpp-client.configs.shard.HOSTNAME"
  echo "OK: syntaxe HOCON valide"
else
  echo "(installez jitsi-videobridge2 pour hocon CLI, ou vérifiez manuellement)"
fi

systemctl restart prosody
sleep 3
systemctl restart jitsi-videobridge2
sleep 5
systemctl restart jicofo
sleep 12

echo "=== Prosody 5222 ==="
ss -tlnp | grep 5222 || echo "ECHEC: Prosody n'écoute pas 5222"

echo "=== JVB XMPP ==="
grep -iE 'Joined MUC|Connection refused|error connecting|Authenticated' /var/log/jitsi/jvb.log | tail -10

echo "=== Jicofo bridge ==="
grep -iE 'Added bridge|bridge' /var/log/jitsi/jicofo.log | tail -8 || true

echo "=== UDP 10000 ==="
ss -ulnp | grep 10000 || echo "WARN: UDP 10000"
