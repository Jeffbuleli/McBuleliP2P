#!/bin/bash
# focus@auth absent + jicofo.log silencieux — diagnostic complet.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
JICOFO_CFG="/etc/jitsi/jicofo/config"
JICOFO_HOCON="/etc/jitsi/jicofo/jicofo.conf"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== diagnose-jicofo-focus-offline =========="

echo ""
echo "==> 1. Services"
for svc in prosody jicofo jitsi-videobridge2; do
  printf "  %-22s " "$svc"
  systemctl is-active "$svc" 2>/dev/null || echo "inactive"
done

echo ""
echo "==> 2. Prosody 5222"
ss -tlnp | grep 5222 || echo "FAIL: rien sur 5222"
nc -zv 127.0.0.1 5222 2>&1 || true

echo ""
echo "==> 3. Processus Jicofo"
pgrep -af 'org.jitsi.jicofo|jicofo\.jar|/usr/share/jicofo' 2>/dev/null || echo "FAIL: aucun processus Jicofo"

JPID="$(pgrep -f 'org.jitsi.jicofo|jicofo\.jar' 2>/dev/null | head -1 || true)"
if [[ -n "$JPID" ]]; then
  echo "  cmdline (extrait):"
  tr '\0' ' ' < "/proc/${JPID}/cmdline" 2>/dev/null | grep -oE '\-Dconfig\.file=[^ ]+' || echo "  FAIL: -Dconfig.file absent du processus"
fi

echo ""
echo "==> 4. JICOFO_OPTS + jicofo.conf"
grep '^JICOFO_OPTS=' "$JICOFO_CFG" 2>/dev/null | head -1 || echo "FAIL: JICOFO_OPTS absent"
grep -E 'hostname|domain|username|client-proxy|conference-muc-jid|use-tls' "$JICOFO_HOCON" 2>/dev/null | head -10

echo ""
echo "==> 5. c2s auth (focus + jvb)"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null || echo "(c2s show échoué)"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -iE 'focus|jvb' || echo "FAIL: ni focus ni jvb sur ${AUTH}"

echo ""
echo "==> 6. jicofo.log (20 dernières lignes, brut)"
if [[ -s /var/log/jitsi/jicofo.log ]]; then
  tail -20 /var/log/jitsi/jicofo.log
else
  echo "FAIL: /var/log/jitsi/jicofo.log vide ou absent"
fi

echo ""
echo "==> 7. journalctl jicofo (erreurs démarrage)"
journalctl -u jicofo -n 35 --no-pager 2>/dev/null | tail -25

echo ""
echo "==> 8. auth VirtualHost Prosody"
grep -A12 "VirtualHost \"${AUTH}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null | head -14

echo ""
echo "==> 9. focus component"
grep -A4 "Component \"focus.${DOMAIN}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null

echo ""
echo "INTERPRÉTATION"
if ! systemctl is-active --quiet jicofo 2>/dev/null; then
  echo "  → jicofo service INACTIF — journalctl ci-dessus"
elif ! pgrep -f 'org.jitsi.jicofo|jicofo\.jar' >/dev/null 2>&1; then
  echo "  → systemd dit actif mais pas de JVM — zombie / crash loop"
elif ! prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@'; then
  echo "  → Jicofo tourne mais PAS connecté focus@auth"
  echo "  → vérifier auth: c2s_require_encryption = false"
  echo "  → sudo bash ops/jitsi/fix-focus-iq-route.sh"
  echo "  → si échec: sudo bash ops/jitsi/fix-jicofo-localhost.sh"
else
  echo "  → focus@auth ONLINE — problème ailleurs (navigateur / MUC)"
fi
