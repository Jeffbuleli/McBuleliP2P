#!/bin/bash
# Jicofo: SSL/TLS required by server but disabled in client
set -euo pipefail

JICOFO="/etc/jitsi/jicofo/jicofo.conf"
[[ -f "$JICOFO" ]] || { echo "Missing $JICOFO"; exit 1; }

cp -a "$JICOFO" "${JICOFO}.bak.tls.$(date +%Y%m%d%H%M%S)"
sed -i 's/use-tls = false/use-tls = true/g; s/use-tls=false/use-tls=true/g' "$JICOFO"
if ! grep -q 'disable-certificate-verification' "$JICOFO"; then
  sed -i '/hostname = /a\      disable-certificate-verification = true' "$JICOFO"
fi

systemctl restart jicofo
sleep 12
grep -iE 'SSL/TLS required|Authenticated|Failed to connect|Added new videobridge' /var/log/jitsi/jicofo.log | tail -10
echo "OK — use-tls=true + disable-certificate-verification"
