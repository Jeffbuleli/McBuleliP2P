#!/bin/bash
# Jicofo « host-unknown auth.localhost » → corriger domaines XMPP.
# Usage (root VPS): bash ops/jitsi/fix-jicofo-auth-domain.sh
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH_DOMAIN="auth.${DOMAIN}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root"
  exit 1
fi

echo "==> Domaine cible: ${AUTH_DOMAIN}"

fix_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  cp -a "$f" "${f}.bak.domain.$(date +%Y%m%d%H%M%S)"
  sed -i \
    -e "s|auth\.localhost|${AUTH_DOMAIN}|g" \
    -e "s|localhost|${DOMAIN}|g" \
    -e "s|${DOMAIN}\\.${DOMAIN}|${DOMAIN}|g" \
    "$f"
  echo "  patched: $f"
}

for f in \
  /etc/jitsi/jicofo/config \
  /etc/jitsi/jicofo/jicofo.conf \
  /etc/jitsi/videobridge/config \
  /etc/jitsi/videobridge/jvb.conf \
  /etc/jitsi/videobridge/sip-communicator.properties; do
  fix_file "$f"
done

# jicofo.conf HOCON — forcer client xmpp domain
JICOFO_HOCON="/etc/jitsi/jicofo/jicofo.conf"
if [[ -f "$JICOFO_HOCON" ]]; then
  if grep -q 'xmpp:' "$JICOFO_HOCON"; then
    sed -i "s|domain = \"auth\\.[^\"]*\"|domain = \"${AUTH_DOMAIN}\"|g" "$JICOFO_HOCON"
    sed -i "s|hostname = \"[^\"]*\"|hostname = \"${DOMAIN}\"|g" "$JICOFO_HOCON"
  fi
fi

# Legacy config vars
JICOFO_LEGACY="/etc/jitsi/jicofo/config"
if [[ -f "$JICOFO_LEGACY" ]]; then
  for var in JICOFO_HOST JICOFO_AUTH_DOMAIN JICOFO_AUTH_USER; do
    grep -q "^${var}=" "$JICOFO_LEGACY" || true
  done
  sed -i "s|^JICOFO_HOST=.*|JICOFO_HOST=${DOMAIN}|" "$JICOFO_LEGACY" 2>/dev/null || \
    echo "JICOFO_HOST=${DOMAIN}" >> "$JICOFO_LEGACY"
  sed -i "s|^JICOFO_AUTH_DOMAIN=.*|JICOFO_AUTH_DOMAIN=${AUTH_DOMAIN}|" "$JICOFO_LEGACY" 2>/dev/null || \
    echo "JICOFO_AUTH_DOMAIN=${AUTH_DOMAIN}" >> "$JICOFO_LEGACY"
  grep -q '^JICOFO_AUTH_USER=' "$JICOFO_LEGACY" || echo "JICOFO_AUTH_USER=focus" >> "$JICOFO_LEGACY"
fi

JVB_CFG="/etc/jitsi/videobridge/config"
if [[ -f "$JVB_CFG" ]]; then
  sed -i "s|^JVB_HOSTNAME=.*|JVB_HOSTNAME=${DOMAIN}|" "$JVB_CFG" 2>/dev/null || \
    echo "JVB_HOSTNAME=${DOMAIN}" >> "$JVB_CFG"
  sed -i "s|^JVB_AUTH_DOMAIN=.*|JVB_AUTH_DOMAIN=${AUTH_DOMAIN}|" "$JVB_CFG" 2>/dev/null || \
    echo "JVB_AUTH_DOMAIN=${AUTH_DOMAIN}" >> "$JVB_CFG"
fi

echo ""
echo "==> Vérification (ne doit PLUS contenir auth.localhost)"
grep -rE 'auth\.localhost|localhost' /etc/jitsi/jicofo/ /etc/jitsi/videobridge/ 2>/dev/null \
  | grep -v '.bak.' || echo "  OK — aucun auth.localhost"

echo ""
echo "==> Domaines configurés"
grep -hE 'JICOFO_HOST|JICOFO_AUTH_DOMAIN|JVB_HOSTNAME|JVB_AUTH_DOMAIN|domain\s*=' \
  /etc/jitsi/jicofo/config /etc/jitsi/jicofo/jicofo.conf /etc/jitsi/videobridge/config 2>/dev/null \
  | grep -v '^#' | head -20

# Resync focus/jvb passwords if script present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/fix-jicofo-prosody.sh" ]]; then
  bash "$SCRIPT_DIR/fix-jicofo-prosody.sh"
else
  systemctl stop jicofo
  pkill -9 -f jicofo 2>/dev/null || true
  systemctl restart prosody jicofo jitsi-videobridge2
  sleep 10
  echo ""
  tail -15 /var/log/jitsi/jicofo.log
fi
