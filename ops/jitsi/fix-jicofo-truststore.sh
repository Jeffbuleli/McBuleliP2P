#!/bin/bash
# Jicofo TLS: truststore Prosody + admins focus (sans régénérer les mots de passe).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
PROSODY_MAIN="/etc/prosody/prosody.cfg.lua"
JICOFO="/etc/jitsi/jicofo/jicofo.conf"
CERT="/var/lib/prosody/${AUTH}.crt"
TRUST="/etc/jitsi/jicofo/truststore.jks"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

# focus admin Prosody
for f in "$PROSODY_MAIN" "$CFG"; do
  [[ -f "$f" ]] || continue
  if grep -q 'admins\s*=' "$f" && ! grep -q "focus@${AUTH}" "$f"; then
    sed -i "s|admins\s*=\s*{|admins = { \"focus@${AUTH}\", \"jvb@${AUTH}\", |" "$f"
  fi
done

# TLS client Jicofo
if [[ -f "$JICOFO" ]]; then
  sed -i 's/use-tls = false/use-tls = true/g' "$JICOFO"
  grep -q 'disable-certificate-verification' "$JICOFO" || \
    sed -i '/hostname = /a\      disable-certificate-verification = true' "$JICOFO"
fi

# Certificat Prosody → truststore Java
if [[ -f "$CERT" ]]; then
  mkdir -p "$(dirname "$TRUST")"
  [[ -f "$TRUST" ]] || keytool -genkey -keystore "$TRUST" -storepass changeit \
    -keypass changeit -alias dummy -dname "CN=dummy" -keyalg RSA 2>/dev/null || true
  keytool -delete -alias "prosody-${AUTH}" -keystore "$TRUST" -storepass changeit 2>/dev/null || true
  keytool -importcert -noprompt -alias "prosody-${AUTH}" \
    -file "$CERT" -keystore "$TRUST" -storepass changeit
  chown jicofo:jitsi "$TRUST" 2>/dev/null || chown jicofo:jicofo "$TRUST" 2>/dev/null || true
  echo "OK: cert importé dans $TRUST"
else
  echo "WARN: $CERT absent — prosodyctl cert generate ${AUTH} ?"
fi

systemctl restart prosody && sleep 3
: > /var/log/jitsi/jicofo.log 2>/dev/null || true
systemctl restart jicofo && sleep 15

echo "==> Jicofo (log frais)"
grep -iE 'SSL/TLS|Authenticated|Registered|Failed|Exception|videobridge|discover' /var/log/jitsi/jicofo.log | tail -15
