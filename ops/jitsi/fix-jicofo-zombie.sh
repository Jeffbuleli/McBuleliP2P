#!/bin/bash
# Jicofo: processus Java orphelin après restart systemd
# Symptôme journalctl: "Unit process XXXXX (java) remains running after unit stopped"
# → pas de conférence / journalctl -u jicofo -f silencieux pendant les joins
set -euo pipefail

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "==> 1. Processus Java Jicofo actuels"
pgrep -af 'jicofo|org.jitsi.jicofo' 2>/dev/null || echo "(aucun)"

echo ""
echo "==> 2. Stop service + tuer orphelins"
systemctl stop jicofo 2>/dev/null || true
sleep 2

# Tous les java liés à jicofo (pas le videobridge)
for pid in $(pgrep -f 'org.jitsi.jicofo|/usr/share/jicofo/jicofo.sh|jicofo\.jar' 2>/dev/null || true); do
  echo "KILL jicofo pid=$pid"
  kill -9 "$pid" 2>/dev/null || true
done
# Anciens PIDs signalés par systemd (java générique sous jicofo cgroup)
for pid in $(pgrep -f 'java.*jicofo' 2>/dev/null || true); do
  echo "KILL java/jicofo pid=$pid"
  kill -9 "$pid" 2>/dev/null || true
done

sleep 1
REMAIN="$(pgrep -cf 'org.jitsi.jicofo|jicofo\.jar' 2>/dev/null || echo 0)"
if [[ "$REMAIN" -gt 0 ]]; then
  echo "WARN: processus jicofo restants:"
  pgrep -af 'jicofo' || true
else
  echo "OK: aucun processus jicofo résiduel"
fi

echo ""
echo "==> 3. Start jicofo"
systemctl start jicofo
sleep 10

echo ""
echo "==> 4. État"
systemctl is-active jicofo
pgrep -af 'org.jitsi.jicofo|jicofo' 2>/dev/null | head -5 || echo "ECHEC: jicofo ne tourne pas"

echo ""
echo "==> 5. Logs récents (fichier + journal)"
tail -20 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE 'Registered|Authenticated|Connected|SEVERE|error|bridge' || \
  tail -10 /var/log/jitsi/jicofo.log 2>/dev/null || true

echo ""
echo "OK — retestez join host+guest, puis:"
echo "  tail -f /var/log/jitsi/jicofo.log"
echo "  (journalctl -u jicofo ne montre souvent PAS les conférences — utiliser jicofo.log)"
