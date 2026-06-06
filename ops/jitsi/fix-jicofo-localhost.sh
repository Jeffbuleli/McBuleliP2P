#!/bin/bash
# Jicofo → Prosody : hostname live.mcbuleli.org → 127.0.0.1 Connection refused
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
XMPP_HOST="127.0.0.1"
JICOFO_HOCON="/etc/jitsi/jicofo/jicofo.conf"
JICOFO_LEGACY="/etc/jitsi/jicofo/config"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

FOCUS_PASS="$(grep '^JICOFO_AUTH_PASSWORD=' "$JICOFO_LEGACY" 2>/dev/null | cut -d= -f2- || true)"
[[ -n "$FOCUS_PASS" ]] || FOCUS_PASS="$(grep -E 'password\s*=' "$JICOFO_HOCON" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)".*/\1/' || true)"
if [[ -z "$FOCUS_PASS" ]]; then
  echo "ERREUR: JICOFO_AUTH_PASSWORD introuvable dans $JICOFO_LEGACY" >&2
  exit 1
fi

[[ -f "$JICOFO_LEGACY" ]] && cp -a "$JICOFO_LEGACY" "${JICOFO_LEGACY}.bak.$(date +%Y%m%d%H%M%S)"
[[ -f "$JICOFO_HOCON" ]] && cp -a "$JICOFO_HOCON" "${JICOFO_HOCON}.bak.$(date +%Y%m%d%H%M%S)"

# Legacy env (systemd EnvironmentFile)
for kv in "JICOFO_HOST=${XMPP_HOST}" "JICOFO_AUTH_DOMAIN=${AUTH}" "JICOFO_AUTH_USER=focus" "JICOFO_AUTH_PASSWORD=${FOCUS_PASS}"; do
  key="${kv%%=*}"; val="${kv#*=}"
  if grep -q "^${key}=" "$JICOFO_LEGACY" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$JICOFO_LEGACY"
  else
    echo "${key}=${val}" >> "$JICOFO_LEGACY"
  fi
done

cat > "$JICOFO_HOCON" <<EOF
jicofo {
  xmpp {
    client {
      enabled = true
      hostname = "${XMPP_HOST}"
      port = 5222
      domain = "${AUTH}"
      xmpp-domain = "${DOMAIN}"
      username = "focus"
      password = "${FOCUS_PASS}"
      use-tls = true
      disable-certificate-verification = true
      client-proxy = "focus.${DOMAIN}"
      conference-muc-jid = "conference.${DOMAIN}"
    }
  }
  bridge {
    brewery-jid = "jvbbrewery@${INTERNAL}"
    xmpp-connection-name = "Client"
  }
}
EOF

# Legacy sip communicator (metaconfig fallback)
SIP="/etc/jitsi/jicofo/sip-communicator.properties"
mkdir -p "$(dirname "$SIP")"
grep -q 'org.jitsi.jicofo.XMPP_DOMAIN' "$SIP" 2>/dev/null && \
  sed -i "s|org.jitsi.jicofo.XMPP_DOMAIN=.*|org.jitsi.jicofo.XMPP_DOMAIN=${DOMAIN}|" "$SIP" || \
  echo "org.jitsi.jicofo.XMPP_DOMAIN=${DOMAIN}" >> "$SIP"

prosodyctl deluser "focus@${AUTH}" 2>/dev/null || true
prosodyctl register focus "${AUTH}" "${FOCUS_PASS}"

echo "==> Prosody 5222"
ss -tlnp | grep 5222 || { echo "ECHEC: Prosody n'écoute pas 5222"; systemctl status prosody --no-pager; exit 1; }

systemctl restart prosody
sleep 3
systemctl restart jicofo
sleep 12

echo "==> Jicofo XMPP"
grep -iE 'Authenticated|Connected|Failed|Connection refused|live\.mcbuleli\.org:5222' /var/log/jitsi/jicofo.log | tail -12

echo "==> Jicofo bridge"
grep -iE 'Bridge\[jid|Added bridge|health-check' /var/log/jitsi/jicofo.log | tail -6

echo "OK — retestez test-live-mcbuleli (host + participant)"
