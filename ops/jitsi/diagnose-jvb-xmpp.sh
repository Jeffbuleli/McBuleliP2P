#!/bin/bash
# Diagnostic JVB sans MucClient (logs = Jetty :8080 seulement).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
VCFG="/etc/jitsi/videobridge/config"
JVB_CONF="/etc/jitsi/videobridge/jvb.conf"

echo "=== jitsi-videobridge2 ==="
dpkg -l jitsi-videobridge2 2>/dev/null | tail -1 || true
systemctl is-active jitsi-videobridge2 2>/dev/null || true

echo ""
echo "=== /etc/jitsi/videobridge/config (critique) ==="
if [[ -f "$VCFG" ]]; then
  grep -E '^(JVB_|JAVA_SYS_PROPS|JVB_OPTS)' "$VCFG" || true
  if ! grep -q '\-Dconfig\.file=' "$VCFG" 2>/dev/null; then
    echo "PROBLÈME: pas de -Dconfig.file → jvb.conf ignoré"
  fi
  if grep -qE 'JVB_OPTS=.*--apis=' "$VCFG" 2>/dev/null; then
    echo "PROBLÈME: JVB_OPTS --apis=... peut désactiver xmpp-client (garder seulement rest)"
  fi
else
  echo "FICHIER ABSENT: $VCFG"
fi

echo ""
echo "=== jvb.conf ==="
[[ -f "$JVB_CONF" ]] && cat "$JVB_CONF" || echo "(absent)"

echo ""
echo "=== sip-communicator.properties ==="
grep -E 'xmpp|HOSTNAME|DOMAIN|MUC' /etc/jitsi/videobridge/sip-communicator.properties 2>/dev/null || echo "(rien)"

echo ""
echo "=== Prosody internal MUC ==="
grep -A6 "Component \"${INTERNAL}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null || echo "(composant absent?)"

echo ""
echo "=== Port 5222 (JVB → Prosody) ==="
ss -tlnp | grep 5222 || true
nc -zv 127.0.0.1 5222 2>&1 || true
nc -zv "${DOMAIN}" 5222 2>&1 || true

echo ""
echo "=== Processus Java (-Dconfig.file ?) ==="
jvb_pid="$(systemctl show -p MainPID --value jitsi-videobridge2 2>/dev/null || true)"
if [[ -n "$jvb_pid" && "$jvb_pid" != "0" ]] && [[ -r "/proc/${jvb_pid}/cmdline" ]]; then
  tr '\0' '\n' < "/proc/${jvb_pid}/cmdline" | grep -E 'config\.file|SC_HOME|videobridge' || echo "(props absentes du cmdline)"
else
  echo "(service pas actif)"
fi

echo ""
echo "=== JVB logs complets (démarrage récent) ==="
journalctl -u jitsi-videobridge2 -n 120 --no-pager 2>/dev/null | grep -iE 'MucClient|xmpp|brewery|config\.file|apis|error|SEVERE|Authenticated|Joined|shard' || echo "(aucune ligne xmpp — client XMPP non démarré)"

echo ""
echo "=== jvb.log fichier ==="
grep -iE 'MucClient|xmpp|brewery|shard|error connecting|Authenticated' /var/log/jitsi/jvb.log 2>/dev/null | tail -20 || echo "(aucune ligne muc)"

echo ""
echo "=== Jicofo brewery ==="
grep -iE 'bridge|brewery|Added|service-unavailable|item-not-found' /var/log/jitsi/jicofo.log 2>/dev/null | tail -12 || true
