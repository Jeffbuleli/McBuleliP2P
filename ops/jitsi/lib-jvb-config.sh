#!/bin/bash
# Helpers partagés — ne pas écraser /etc/jitsi/videobridge/config (JAVA_SYS_PROPS, -Dconfig.file).
set -euo pipefail

JVB_VCFG="${JVB_VCFG:-/etc/jitsi/videobridge/config}"
JVB_HOCON="${JVB_HOCON:-/etc/jitsi/videobridge/jvb.conf}"

mcbuleli_ensure_jvb_runtime_config() {
  local domain="$1" auth="$2" jvb_pass="$3"
  local ts backup

  ts="$(date +%Y%m%d%H%M%S)"
  if [[ -f "$JVB_VCFG" ]]; then
    cp -a "$JVB_VCFG" "${JVB_VCFG}.bak.${ts}"
  else
    touch "$JVB_VCFG"
  fi

  # Mettre à jour les clés sans supprimer JAVA_SYS_PROPS / JVB_OPTS
  for kv in "JVB_HOSTNAME=${domain}" "JVB_AUTH_DOMAIN=${auth}" "JVB_AUTH_PASSWORD=${jvb_pass}" "JVB_PORT=10000"; do
    local key="${kv%%=*}" val="${kv#*=}"
    if grep -q "^${key}=" "$JVB_VCFG" 2>/dev/null; then
      sed -i "s|^${key}=.*|${key}=${val}|" "$JVB_VCFG"
    else
      echo "${key}=${val}" >> "$JVB_VCFG"
    fi
  done

  # Legacy debconf
  if grep -q '^JVB_SECRET=' "$JVB_VCFG" 2>/dev/null; then
    sed -i "s|^JVB_SECRET=.*|JVB_SECRET=${jvb_pass}|" "$JVB_VCFG"
  fi

  local java_props
  java_props="-Dconfig.file=${JVB_HOCON} -Dnet.java.sip.communicator.SC_HOME_DIR_LOCATION=/etc/jitsi -Dnet.java.sip.communicator.SC_HOME_DIR_NAME=videobridge -Dnet.java.sip.communicator.SC_LOG_DIR_LOCATION=/var/log/jitsi -Djava.util.logging.config.file=/etc/jitsi/videobridge/logging.properties"

  if grep -q '^JAVA_SYS_PROPS=' "$JVB_VCFG"; then
    if ! grep '^JAVA_SYS_PROPS=' "$JVB_VCFG" | grep -q '\-Dconfig\.file='; then
      sed -i '/^JAVA_SYS_PROPS=/d' "$JVB_VCFG"
      echo "JAVA_SYS_PROPS=\"${java_props}\"" >> "$JVB_VCFG"
    fi
  else
    cat >> "$JVB_VCFG" <<EOF

# adds java system props that are passed to jvb
JAVA_SYS_PROPS="${java_props}"
EOF
  fi

  # --apis=rest seul → XMPP jamais démarré (cause fréquente : logs = Jetty uniquement)
  if grep -qE 'JVB_OPTS=.*--apis=' "$JVB_VCFG"; then
    sed -i '/^JVB_OPTS=.*--apis=/d' "$JVB_VCFG"
    echo "# mcbuleli: removed JVB_OPTS --apis (use jvb.conf apis.rest / xmpp-client)" >> "$JVB_VCFG"
  fi
}

mcbuleli_write_jvb_hocon() {
  local domain="$1" auth="$2" internal="$3" jvb_pass="$4"
  # HOSTNAME = socket Prosody (co-localisé → 127.0.0.1, pas le vhost public)
  local xmpp_host="${JVB_XMPP_HOST:-127.0.0.1}"
  local public_ip="${JVB_PUBLIC_IP:-}"
  local local_ip="${JVB_LOCAL_IP:-}"
  if [[ -z "$public_ip" ]]; then
    public_ip="$(curl -4fsSL --max-time 3 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
  fi
  if [[ -z "$local_ip" ]]; then
    local_ip="$(ip -4 route get "${public_ip}" 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' || hostname -I | awk '{print $1}')"
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
      HOSTNAME=${xmpp_host}
      DOMAIN="${auth}"
      USERNAME=jvb
      PASSWORD="${jvb_pass}"
      MUC_JIDS="jvbbrewery@${internal}"
      MUC_NICKNAME=jvb-${domain}
      DISABLE_CERTIFICATE_VERIFICATION=true
    }
  }
}
ice4j {
  harvest {
    mapping {
      static-mappings = [
        {
          local-address = "${local_ip}"
          public-address = "${public_ip}"
        }
      ]
      stun {
        addresses = ["meet-jit-si-turnrelay.jitsi.net:443"]
      }
    }
  }
}
EOF
}
