#!/bin/bash
# BOSH + websocket nginx → Prosody :5280 (snippet unique, pas de doublon).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
SNIP="/etc/nginx/snippets/mcbuleli-xmpp-proxy.conf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

if ! grep -q 'map \$http_upgrade' /etc/nginx/nginx.conf 2>/dev/null; then
  sed -i '/http {/a\
    map $http_upgrade $connection_upgrade {\
        default upgrade;\
        '\'''\'' close;\
    }' /etc/nginx/nginx.conf
fi

cat > "$SNIP" <<EOF
# mcbuleli-xmpp-proxy — unique source /http-bind + /xmpp-websocket
location = /http-bind {
    proxy_set_header Host ${DOMAIN};
    proxy_set_header X-Forwarded-For \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_pass http://127.0.0.1:5280/http-bind;
    proxy_buffering off;
    proxy_read_timeout 900s;
    proxy_send_timeout 900s;
}

location = /xmpp-websocket {
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_set_header Host ${DOMAIN};
    proxy_set_header X-Forwarded-For \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_pass http://127.0.0.1:5280/xmpp-websocket;
    proxy_buffering off;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
    tcp_nodelay on;
}
EOF

bash "$SCRIPT_DIR/fix-nginx-xmpp-dedupe.sh"
