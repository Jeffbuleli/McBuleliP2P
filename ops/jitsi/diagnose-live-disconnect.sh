#!/bin/bash
# « Vous avez été déconnecté » — XMPP / bosh / websocket / Prosody.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
NGINX="$(ls /etc/nginx/sites-enabled/*${DOMAIN}* 2>/dev/null | head -1)"

echo "==> 1. Services"
systemctl is-active prosody jicofo jitsi-videobridge2 nginx 2>/dev/null | paste - - - - || true

echo ""
echo "==> 2. Prosody config"
prosodyctl check config 2>&1 | tail -8 || true

echo ""
echo "==> 3. Ports Prosody"
ss -tlnp | grep -E '5222|5280|5269' || echo "WARN: Prosody ports absents"

echo ""
echo "==> 4. config.js servi (bosh / websocket / jigasi)"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'bosh|websocket|hiddenDomain|jigasi|subdomain' | head -12

echo ""
echo "==> 5. Endpoints HTTP (doivent répondre 200 ou 405, pas 502)"
for path in /http-bind /xmpp-websocket; do
  code="$(curl -sI -o /dev/null -w '%{http_code}' "https://${DOMAIN}${path}" 2>/dev/null || echo 000)"
  echo "  ${path} → HTTP ${code}"
done

echo ""
echo "==> 6. Nginx proxy XMPP"
if [[ -n "$NGINX" ]]; then
  grep -nE 'http-bind|xmpp-websocket|5280' "$NGINX" | head -10 || echo "WARN: pas de proxy /http-bind dans $NGINX"
else
  echo "WARN: vhost nginx introuvable"
fi

echo ""
echo "==> 7. Prosody VirtualHost modules (bosh + websocket)"
grep -A50 "VirtualHost \"${DOMAIN}\"" "$CFG" 2>/dev/null | grep -E 'modules_enabled|bosh|websocket|muc_lobby|jigasi' | head -15 || true

echo ""
echo "==> 8. Hôtes parasites encore actifs ?"
grep -rl 'jigasi\.meet\.jitsi' /etc/prosody/ 2>/dev/null | head -5 || echo "(aucun fichier)"
grep -iE 'jigasi\.meet|Lobby component loaded' /var/log/prosody/prosody.log 2>/dev/null | tail -5 || true

echo ""
echo "==> 9. Erreurs Prosody récentes (stream / disconnect / ssl)"
grep -iE 'error|disconnect|closed|ssl|stream|failed' /var/log/prosody/prosody.log 2>/dev/null | tail -15 || true

echo ""
echo "==> 10. Syntaxe config.js"
node --check "/etc/jitsi/meet/${DOMAIN}-config.js" 2>&1 | head -3 || true

echo ""
echo "Interprétation:"
echo "  - /http-bind ou /xmpp-websocket → 502 = nginx/Prosody cassé"
echo "  - jigasi.meet.jitsi dans config ou logs = mauvais domaine XMPP"
echo "  - prosodyctl check pas Done = config Lua cassée (purge lobby/jigasi)"
