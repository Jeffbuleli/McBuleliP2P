#!/bin/bash
# JVB dans brewery mais pas de audio/vidéo → IP publique ICE + UDP 10000 + websockets.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
VCFG="/etc/jitsi/videobridge/config"
JVB_HOCON="/etc/jitsi/videobridge/jvb.conf"
SIP="/etc/jitsi/videobridge/sip-communicator.properties"
JICOFO="/etc/jitsi/jicofo/jicofo.conf"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

JVB_PASS="$(grep -E '^JVB_AUTH_PASSWORD=|^JVB_SECRET=' "$VCFG" 2>/dev/null | head -1 | cut -d= -f2-)"
PUBLIC_IP="${JVB_PUBLIC_IP:-$(curl -4fsSL --max-time 4 ifconfig.me 2>/dev/null || true)}"
LOCAL_IP="$(ip -4 route get "${PUBLIC_IP:-1.1.1.1}" 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' || true)"
[[ -n "$LOCAL_IP" ]] || LOCAL_IP="$(hostname -I | awk '{print $1}')"
[[ -n "$PUBLIC_IP" ]] || PUBLIC_IP="$LOCAL_IP"

echo "==> IP publique=${PUBLIC_IP} locale=${LOCAL_IP}"

cat > "$JVB_HOCON" <<EOF
videobridge {
  stats {
    enabled = true
    transports = [ { type = "muc" } ]
  }
  apis {
    rest { enabled = true }
  }
  websockets {
    enabled = true
    domain = "${DOMAIN}:443"
    tls = true
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

if [[ -f "$SIP" ]]; then
  for key in \
    "org.jitsi.videobridge.nat.NAT_HARVESTER_LOCAL_ADDRESS=${LOCAL_IP}" \
    "org.jitsi.videobridge.nat.NAT_HARVESTER_PUBLIC_ADDRESS=${PUBLIC_IP}" \
    "org.jitsi.videobridge.nat.DISABLE_AWS_HARVESTER=true"; do
    k="${key%%=*}"
    if grep -q "^${k}=" "$SIP" 2>/dev/null; then
      sed -i "s|^${k}=.*|${key}|" "$SIP"
    else
      echo "${key}" >> "$SIP"
    fi
  done
fi

if [[ -f "$JICOFO" ]] && ! grep -q 'brewery-jid' "$JICOFO"; then
  cat >> "$JICOFO" <<EOF

jicofo {
  bridge {
    brewery-jid = "jvbbrewery@${INTERNAL}"
  }
}
EOF
fi

command -v ufw >/dev/null && ufw allow 10000/udp comment 'Jitsi JVB RTP' 2>/dev/null || true
chown -R jvb:jitsi /etc/jitsi/videobridge

systemctl restart jitsi-videobridge2
sleep 5
systemctl restart jicofo
sleep 12

echo "==> UDP 10000"
ss -ulnp | grep 10000 || echo "WARN: rien sur UDP 10000"

echo "==> Jicofo bridge"
grep -iE 'Added bridge|bridge.*added|brewery' /var/log/jitsi/jicofo.log | tail -8 || true

echo "==> JVB brewery"
grep -iE 'Joined MUC|Colibri|endpoint' /var/log/jitsi/jvb.log | tail -8 || true

echo "OK — retestez test-live-mcbuleli (2 appareils). Pendant le join:"
echo "  grep -iE 'conference|colibri|Allocated|test-live' /var/log/jitsi/jicofo.log | tail -20"
