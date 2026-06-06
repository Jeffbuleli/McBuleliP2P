#!/bin/bash
# Rétablit proxy nginx /http-bind + /xmpp-websocket → Prosody :5280
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
SNIP="/etc/nginx/snippets/mcbuleli-xmpp-proxy.conf"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

find_nginx_vhost() {
  for f in /etc/nginx/sites-enabled/${DOMAIN}.conf \
           /etc/nginx/sites-enabled/${DOMAIN} \
           /etc/nginx/sites-available/${DOMAIN}.conf; do
    [[ -f "$f" ]] && echo "$f" && return 0
  done
  return 1
}

VHOST="$(find_nginx_vhost)" || { echo "Vhost nginx introuvable"; exit 1; }
cp -a "$VHOST" "/root/nginx-backups/$(basename "$VHOST").xmpp.$(date +%Y%m%d%H%M%S)"

cat > "$SNIP" <<EOF
# mcbuleli-xmpp-proxy — bosh + websocket vers Prosody
location = /http-bind {
    proxy_set_header X-Forwarded-For \$remote_addr;
    proxy_set_header Host ${DOMAIN};
    proxy_pass http://127.0.0.1:5280/http-bind;
}

location = /xmpp-websocket {
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_set_header Host ${DOMAIN};
    proxy_pass http://127.0.0.1:5280/xmpp-websocket;
    tcp_nodelay on;
}
EOF

if ! grep -q 'connection_upgrade' /etc/nginx/nginx.conf 2>/dev/null; then
  if ! grep -q 'map \$http_upgrade' /etc/nginx/nginx.conf 2>/dev/null; then
    sed -i '/http {/a\
    map $http_upgrade $connection_upgrade {\
        default upgrade;\
        '\'''\'' close;\
    }' /etc/nginx/nginx.conf
    echo "ADDED map connection_upgrade dans nginx.conf"
  fi
fi

sed -i '/include snippets\/mcbuleli-xmpp-proxy.conf;/d' "$VHOST"
# Après chaque server_name live.mcbuleli.org
sed -i '/server_name.*live\.mcbuleli\.org/a\    include snippets/mcbuleli-xmpp-proxy.conf;' "$VHOST"

nginx -t
systemctl reload nginx

echo "OK — $(grep -c mcbuleli-xmpp-proxy "$VHOST") include(s) dans $VHOST"
curl -sI "https://${DOMAIN}/http-bind" | head -2
curl -sI "https://${DOMAIN}/xmpp-websocket" | head -2
