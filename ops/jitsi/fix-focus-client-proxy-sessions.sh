#!/bin/bash
# focus@auth visible dans c2s MAIS conference IQ → service-unavailable + jicofo.log silencieux.
# Cause: mod_client_proxy garde sa propre liste sessions[] remplie par presence focus@auth → composant.
# c2s "online" ≠ client_proxy a une session routable.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
FOCUS_COMP="focus.${DOMAIN}"
PROSODY_LOG="/var/log/prosody/prosody.log"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix-focus-client-proxy-sessions =========="
echo "Symptôme: service-unavailable alors que prosodyctl c2s montre focus@${AUTH}"
echo "Cause: client_proxy sessions[] vide (presence focus→composant non enregistrée)"
echo "AVANT: fermer TOUS les onglets live.mcbuleli.org"
echo ""

grep -A3 "Component \"${FOCUS_COMP}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null | head -4 || {
  echo "FAIL: Component ${FOCUS_COMP} absent"
  exit 1
}

echo ""
echo "==> 1. Stop Jicofo + JVB (client_proxy doit re-subscribe avant reconnect)"
systemctl stop jicofo jitsi-videobridge2 2>/dev/null || true
sleep 2
for pid in $(pgrep -f 'org.jitsi.jicofo|jicofo\.jar' 2>/dev/null || true); do
  kill -9 "$pid" 2>/dev/null || true
done

LOG_START="$(wc -l < "$PROSODY_LOG" 2>/dev/null || echo 0)"

echo ""
echo "==> 2. Restart Prosody (recharge client_proxy + subscribe → focus@auth)"
CHECK="$(prosodyctl check config 2>&1 || true)"
if echo "$CHECK" | grep -qiE 'Duplicate option|Error: |Fatal'; then
  echo "$CHECK" | grep -iE 'Duplicate option|Error: |Fatal' || true
  echo "FAIL: config Prosody bloquante"
  exit 1
fi
systemctl restart prosody
sleep 10

echo ""
echo "==> 3. Start JVB puis Jicofo (presence focus doit arriver APRÈS subscribe composant)"
systemctl start jitsi-videobridge2
sleep 8
JICOFO_LOG_START="$(wc -l < /var/log/jitsi/jicofo.log 2>/dev/null || echo 0)"
systemctl start jicofo

wait_proxy_session() {
  local label="$1"
  for ((w = 1; w <= 8; w++)); do
    sleep 5
    if tail -n +"$((LOG_START + 1))" "$PROSODY_LOG" 2>/dev/null | \
      grep -qiE 'registered new target session|proxy on '"${FOCUS_COMP}"; then
      tail -n +"$((LOG_START + 1))" "$PROSODY_LOG" 2>/dev/null | \
        grep -iE 'registered new target session|proxy on '"${FOCUS_COMP}" | tail -3
      return 0
    fi
    if prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@' && \
       tail -n +"$((JICOFO_LOG_START + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | grep -q 'Registered'; then
      # c2s + Registered mais pas encore de log client_proxy — attendre
      echo "  ${label} focus c2s+Registered, attente client_proxy session... ${w}/8"
      continue
    fi
    echo "  ${label} attente focus@auth... ${w}/8"
  done
  return 1
}

echo ""
echo "==> 4. Attente client_proxy session"
if ! wait_proxy_session "1ère"; then
  echo "WARN: pas de 'registered new target session' — retry jicofo"
  systemctl restart jicofo
  sleep 15
  wait_proxy_session "2ème" || true
fi

echo ""
echo "==> 4b. roster subscribe (presence focus → client_proxy — cause #1 service-unavailable)"
bash "$SCRIPT_DIR/fix-focus-roster-subscribe.sh" || true

echo ""
echo "==> 5. Vérification"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || echo "FAIL: focus@${AUTH} absent"
tail -n +"$((JICOFO_LOG_START + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | \
  grep -iE 'Registered|SEVERE|XMLStream' | tail -6 || true

if tail -n +"$((LOG_START + 1))" "$PROSODY_LOG" 2>/dev/null | grep -qi 'no sessions to send'; then
  echo ""
  echo "WARN: client_proxy a loggé 'no sessions to send' — présence non enregistrée"
  echo "  sudo grep -iE 'client_proxy|no sessions|registered new target' $PROSODY_LOG | tail -20"
fi

if ! prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@'; then
  echo "FAIL: focus absent — diagnose-jicofo-focus-offline.sh"
  exit 1
fi

if ! tail -40 /var/log/jitsi/jicofo.log 2>/dev/null | grep -q 'Registered'; then
  echo "FAIL: Jicofo pas Registered (dernières 40 lignes)"
  exit 1
fi

echo ""
echo "OK — TEST dans les 60s:"
echo "  sudo bash ops/jitsi/gen-live-join-url.sh test-live-mcbuleli"
echo "  sudo bash ops/jitsi/capture-muc-join.sh test-live-mcbuleli"
echo "  Succès = IQ focus type='result' (plus service-unavailable) + Jicofo Allocated"
