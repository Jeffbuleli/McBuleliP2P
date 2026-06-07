#!/bin/bash
# focus@auth semble online mais conference IQ → service-unavailable + tail jicofo silencieux.
# Cause: session focus fantôme dans client_proxy. À lancer IMMÉDIATEMENT avant le test join.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
JICOFO_CFG="/etc/jitsi/jicofo/config"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix-focus-pre-join =========="
echo "Symptôme: 1 c2s + focus OK + service-unavailable + jicofo.log silencieux"
echo ""
echo "AVANT: fermer TOUS les onglets live.mcbuleli.org (y compris app McBuleli / iframe)"
echo "      Erreur CORS mcbuleli.org/login = vous êtes dans un iframe → test INVALIDE"
echo ""

FOCUS_PASS="$(grep '^JICOFO_AUTH_PASSWORD=' "$JICOFO_CFG" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')"
[[ -n "$FOCUS_PASS" ]] || { echo "FAIL: JICOFO_AUTH_PASSWORD absent"; exit 1; }

echo "==> 1. Stop Jicofo + kill zombies"
systemctl stop jicofo 2>/dev/null || true
sleep 2
for pid in $(pgrep -f 'org.jitsi.jicofo|jicofo\.jar' 2>/dev/null || true); do
  kill -9 "$pid" 2>/dev/null || true
done

echo "==> 2. Restart Prosody (purge toutes sessions auth — focus fantômes)"
prosodyctl deluser "focus@${AUTH}" 2>/dev/null || true
prosodyctl register focus "$AUTH" "$FOCUS_PASS"
systemctl restart prosody
sleep 8

echo "==> 3. Start Jicofo (session focus fraîche)"
LOG_LINES="$(wc -l < /var/log/jitsi/jicofo.log 2>/dev/null || echo 0)"
systemctl start jicofo

for ((w = 1; w <= 8; w++)); do
  sleep 4
  if prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@'; then
    if tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | grep -q 'Registered'; then
      break
    fi
  fi
  echo "  attente focus frais... ${w}/8"
done

echo ""
echo "==> 4. État (doit être focus ONLINE + Registered récent)"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -iE 'focus|jvb' || echo "FAIL: focus absent"
tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | \
  grep -iE 'Registered|Added new videobridge|SEVERE|not-authorized' | tail -6 || true

if ! prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@'; then
  echo "FAIL — sudo bash ops/jitsi/diagnose-jicofo-focus-offline.sh"
  exit 1
fi

C2S_N=$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -c registered 2>/dev/null || true)
C2S_N=${C2S_N:-0}
echo "c2s ${DOMAIN}: ${C2S_N} (attendu 0 avant join)"

echo ""
echo "OK — TEST (dans les 60s, sans rouvrir l'app McBuleli):"
echo "  Terminal A: sudo tail -f /var/log/jitsi/jicofo.log | grep -iE 'conference|Allocated|Creating|SEVERE'"
echo "  Terminal B: sudo bash ops/jitsi/gen-live-join-url.sh test-live-mcbuleli"
echo "  Chrome PRIVÉ → coller URL en onglet TOP-LEVEL (barre d'adresse = live.mcbuleli.org)"
echo "  PAS d'iframe, PAS /app/live — sinon CORS + service-unavailable"
echo "  Cmd+Shift+R — succès = Allocated dans Terminal A"
