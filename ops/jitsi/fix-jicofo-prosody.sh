#!/bin/bash
# Jicofo « Failed to connect / not-authenticated » — resync focus (+ jvb) avec Prosody.
# Usage (root VPS): bash ops/jitsi/fix-jicofo-prosody.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH_DOMAIN="auth.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
JICOFO_LEGACY="/etc/jitsi/jicofo/config"
JICOFO_HOCON="/etc/jitsi/jicofo/jicofo.conf"
JVB_CFG="/etc/jitsi/videobridge/config"
JVB_SIP="/etc/jitsi/videobridge/sip-communicator.properties"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root"
  exit 1
fi

echo "==> 1. Nouveau mot de passe (aligne TOUS les fichiers Jicofo/JVB)"
FOCUS_PASS="$(openssl rand -hex 16)"
JVB_PASS="$(openssl rand -hex 16)"

if [[ -f "$JICOFO_LEGACY" ]]; then
  sed -i "s|^JICOFO_HOST=.*|JICOFO_HOST=127.0.0.1|" "$JICOFO_LEGACY" 2>/dev/null || true
  sed -i "s|^JICOFO_AUTH_DOMAIN=.*|JICOFO_AUTH_DOMAIN=${AUTH_DOMAIN}|" "$JICOFO_LEGACY" 2>/dev/null || true
  grep -q '^JICOFO_AUTH_USER=' "$JICOFO_LEGACY" || echo "JICOFO_AUTH_USER=focus" >> "$JICOFO_LEGACY"
  sed -i "s|^JICOFO_AUTH_USER=.*|JICOFO_AUTH_USER=focus|" "$JICOFO_LEGACY" 2>/dev/null || true
  if grep -q '^JICOFO_AUTH_PASSWORD=' "$JICOFO_LEGACY"; then
    sed -i "s|^JICOFO_AUTH_PASSWORD=.*|JICOFO_AUTH_PASSWORD=${FOCUS_PASS}|" "$JICOFO_LEGACY"
  else
    echo "JICOFO_AUTH_PASSWORD=${FOCUS_PASS}" >> "$JICOFO_LEGACY"
  fi
fi

if [[ -f "$JVB_CFG" ]]; then
  sed -i "s|^JVB_HOSTNAME=.*|JVB_HOSTNAME=${DOMAIN}|" "$JVB_CFG" 2>/dev/null || echo "JVB_HOSTNAME=${DOMAIN}" >> "$JVB_CFG"
  sed -i "s|^JVB_AUTH_DOMAIN=.*|JVB_AUTH_DOMAIN=${AUTH_DOMAIN}|" "$JVB_CFG" 2>/dev/null || echo "JVB_AUTH_DOMAIN=${AUTH_DOMAIN}" >> "$JVB_CFG"
  if grep -q '^JVB_AUTH_PASSWORD=' "$JVB_CFG"; then
    sed -i "s|^JVB_AUTH_PASSWORD=.*|JVB_AUTH_PASSWORD=${JVB_PASS}|" "$JVB_CFG"
  else
    echo "JVB_AUTH_PASSWORD=${JVB_PASS}" >> "$JVB_CFG"
  fi
fi

echo "   focus@${AUTH_DOMAIN}"
echo "   jvb@${AUTH_DOMAIN}"

echo "==> 2. Comptes Prosody focus + jvb (recréation)"
prosodyctl deluser "focus@${AUTH_DOMAIN}" 2>/dev/null || true
prosodyctl deluser "jvb@${AUTH_DOMAIN}" 2>/dev/null || true
prosodyctl register focus "$AUTH_DOMAIN" "$FOCUS_PASS"
prosodyctl register jvb "$AUTH_DOMAIN" "$JVB_PASS"
find /var/lib/prosody -name 'focus.dat' 2>/dev/null || true

echo "==> 3. admins Prosody (focus + jvb)"
PROSODY_MAIN="/etc/prosody/prosody.cfg.lua"
for f in "$PROSODY_MAIN" "$CFG"; do
  [[ -f "$f" ]] || continue
  if grep -q 'admins\s*=' "$f"; then
    if ! grep -q "focus@${AUTH_DOMAIN}" "$f"; then
      sed -i "s|admins\s*=\s*{|admins = { \"focus@${AUTH_DOMAIN}\", \"jvb@${AUTH_DOMAIN}\", |" "$f"
    fi
  fi
done

echo "==> 4. auth VirtualHost"
grep -A3 "VirtualHost \"${AUTH_DOMAIN}\"" "$CFG" || echo "WARN: ${AUTH_DOMAIN} absent"

echo "==> 5. Jicofo — auth JWT désactivée côté jicofo (handbook)"
if [[ -f "$JICOFO_HOCON" ]]; then
  sed -i 's/authentication-enabled=true/authentication-enabled=false/g' "$JICOFO_HOCON" || true
fi

echo "==> 6. Truststore cert Prosody (si présent)"
CERT="/var/lib/prosody/${AUTH_DOMAIN}.crt"
TRUST="/etc/jitsi/jicofo/truststore.jks"
if [[ -f "$CERT" && -f "$TRUST" ]]; then
  keytool -importcert -noprompt -alias "prosody-${AUTH_DOMAIN}" \
    -file "$CERT" -keystore "$TRUST" -storepass changeit 2>/dev/null || true
fi

echo "==> 7. jicofo.conf complet (conference-muc-jid + client-proxy + brewery)"
bash "$SCRIPT_DIR/fix-jicofo-localhost.sh"

echo ""
echo "==> 8. Composant focus Prosody + JVB brewery"
bash "$SCRIPT_DIR/fix-jitsi-brewery-complete.sh"

echo ""
echo "==> 9. Statut Jicofo"
if journalctl -u jicofo -n 15 --no-pager | grep -qi 'Failed to connect'; then
  echo "WARN: Jicofo échoue encore — collez:"
  echo "  journalctl -u jicofo -n 40 --no-pager"
  echo "  grep -E 'conference-muc-jid|client-proxy|brewery-jid' $JICOFO_HOCON 2>/dev/null"
else
  echo "OK — Jicofo connecté"
  grep -iE 'Registered|conference-muc-jid|Added new videobridge' /var/log/jitsi/jicofo.log 2>/dev/null | tail -6 || true
fi
