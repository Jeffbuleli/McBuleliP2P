#!/bin/bash
# Jicofo/JVB Connection refused 127.0.0.1:5222 — Prosody n'écoute pas sur localhost.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
PROSODY_CFG="/etc/prosody/prosody.cfg.lua"
VHOST="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
JICOFO_LEGACY="/etc/jitsi/jicofo/config"
JVB_CONF="/etc/jitsi/videobridge/jvb.conf"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "==> Avant — qui écoute 5222 ?"
ss -tlnp | grep 5222 || echo "(rien sur 5222 — Prosody down ou autre port)"

# Prosody doit accepter c2s sur toutes les interfaces locales
if [[ -f "$PROSODY_CFG" ]]; then
  cp -a "$PROSODY_CFG" "${PROSODY_CFG}.bak.c2s.$(date +%Y%m%d%H%M%S)"
  if grep -q '^interfaces\s*=' "$PROSODY_CFG"; then
    sed -i 's/^interfaces\s*=.*/interfaces = { "127.0.0.1", "::1" }/' "$PROSODY_CFG"
  else
    grep -q 'mcbuleli-c2s-interfaces' "$PROSODY_CFG" || cat >> "$PROSODY_CFG" <<'EOF'

-- mcbuleli-c2s-interfaces — Jicofo/JVB sur même machine
interfaces = { "127.0.0.1", "::1" }
c2s_ports = { 5222 }
s2s_ports = { 5269 }
EOF
  fi
fi

prosodyctl check config || true
systemctl restart prosody
sleep 5

echo "==> Après restart Prosody"
ss -tlnp | grep 5222 || { journalctl -u prosody -n 20 --no-pager; exit 1; }

# Hostname XMPP = là où Prosody écoute vraiment
XMPP_HOST="127.0.0.1"
if ! nc -z 127.0.0.1 5222 2>/dev/null; then
  PUB="$(curl -4fsSL --max-time 3 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
  if nc -z "$PUB" 5222 2>/dev/null; then
    XMPP_HOST="$PUB"
    echo "WARN: 127.0.0.1:5222 KO — utilisation $XMPP_HOST"
  fi
fi

if [[ -f "$JICOFO_LEGACY" ]]; then
  sed -i "s|^JICOFO_HOST=.*|JICOFO_HOST=${XMPP_HOST}|" "$JICOFO_LEGACY"
fi
if [[ -f "$JVB_CONF" ]]; then
  sed -i "s|HOSTNAME=127.0.0.1|HOSTNAME=${XMPP_HOST}|g; s|HOSTNAME=live.mcbuleli.org|HOSTNAME=${XMPP_HOST}|g" "$JVB_CONF"
fi
if [[ -f /etc/jitsi/videobridge/sip-communicator.properties ]]; then
  sed -i "s|HOSTNAME=127.0.0.1|HOSTNAME=${XMPP_HOST}|g" /etc/jitsi/videobridge/sip-communicator.properties
fi

systemctl restart jitsi-videobridge2
sleep 5
systemctl restart jicofo
sleep 12

echo "==> Jicofo"
grep -iE 'Authenticated|Connection refused|Added new videobridge|Failed to connect' /var/log/jitsi/jicofo.log | tail -10

echo "==> JVB"
grep -iE 'Joined MUC|Connection refused|Authenticated' /var/log/jitsi/jvb.log | tail -6

echo "OK — XMPP_HOST=${XMPP_HOST}"
