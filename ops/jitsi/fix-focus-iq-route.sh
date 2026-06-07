#!/bin/bash
# service-unavailable sur conference IQ alors que focus@auth semble online.
# Cause: session focus fantôme dans client_proxy — l'IQ n'atteint jamais Jicofo (tail jicofo.log silencieux).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CONFERENCE="conference.${DOMAIN}"
FOCUS_COMP="focus.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
JICOFO_CFG="/etc/jitsi/jicofo/config"
JICOFO_HOCON="/etc/jitsi/jicofo/jicofo.conf"
JVB_CFG="/etc/jitsi/videobridge/config"
XMPP_HOST="127.0.0.1"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "FAIL: $CFG absent"; exit 1; }

echo "========== fix-focus-iq-route =========="
echo "Symptôme: console service-unavailable + tail jicofo.log silencieux pendant join"
echo "AVANT: fermer TOUS les onglets live.mcbuleli.org"
echo ""

FOCUS_PASS="$(grep '^JICOFO_AUTH_PASSWORD=' "$JICOFO_CFG" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')"
JVB_PASS="$(grep '^JVB_AUTH_PASSWORD=' "$JVB_CFG" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')"
[[ -n "$FOCUS_PASS" ]] || { echo "FAIL: JICOFO_AUTH_PASSWORD absent"; exit 1; }
[[ -n "$JVB_PASS" ]] || { echo "FAIL: JVB_AUTH_PASSWORD absent"; exit 1; }

echo "==> 1. Stop Jicofo/JVB + kill zombies"
systemctl stop jicofo jitsi-videobridge2 2>/dev/null || true
sleep 2
for pid in $(pgrep -f 'org.jitsi.jicofo|jicofo\.jar' 2>/dev/null || true); do
  echo "KILL jicofo pid=$pid"
  kill -9 "$pid" 2>/dev/null || true
done

echo ""
echo "==> 2. client_proxy target_address"
if ! grep -A3 "Component \"${FOCUS_COMP}\"" "$CFG" | grep -q 'target_address.*focus@'; then
  echo "PATCH: target_address manquant → fix-jitsi-brewery-complete"
  SKIP_RESTART=1 bash "$SCRIPT_DIR/fix-jitsi-brewery-complete.sh" || true
else
  grep -A3 "Component \"${FOCUS_COMP}\"" "$CFG" | grep target_address || true
fi

echo ""
echo "==> 3. jicofo.conf (client-proxy + muc-jid + brewery)"
cp -a "$JICOFO_HOCON" "${JICOFO_HOCON}.bak.iqroute.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
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
      client-proxy = "${FOCUS_COMP}"
      conference-muc-jid = "${CONFERENCE}"
    }
  }
  bridge {
    brewery-jid = "jvbbrewery@${INTERNAL}"
    xmpp-connection-name = "Client"
  }
}
EOF

# shellcheck source=lib-jicofo-config.sh
source "${SCRIPT_DIR}/lib-jicofo-config.sh"
mcbuleli_ensure_jicofo_runtime_config "$XMPP_HOST" "$AUTH" "$FOCUS_PASS"

echo ""
echo "==> 4. Resync mdp focus/jvb (sans regénérer)"
prosodyctl deluser "focus@${AUTH}" 2>/dev/null || true
prosodyctl deluser "jvb@${AUTH}" 2>/dev/null || true
prosodyctl register focus "$AUTH" "$FOCUS_PASS"
prosodyctl register jvb "$AUTH" "$JVB_PASS"

echo ""
echo "==> 5. JVM XML limits (ParseError déjà fixé, garder)"
SKIP_RESTART=1 bash "$SCRIPT_DIR/fix-jicofo-jvm-xml-limits.sh" 2>/dev/null || true

echo ""
echo "==> 6. JVB brewery config"
# shellcheck source=lib-jvb-config.sh
source "${SCRIPT_DIR}/lib-jvb-config.sh"
mcbuleli_ensure_jvb_runtime_config "$DOMAIN" "$AUTH" "$JVB_PASS"
mcbuleli_write_jvb_hocon "$DOMAIN" "$AUTH" "$INTERNAL" "$JVB_PASS"

echo ""
echo "==> 6b. auth VirtualHost + truststore TLS"
SKIP_RESTART=1 bash "$SCRIPT_DIR/fix-prosody-auth-vhost.sh" 2>/dev/null || true
SKIP_RESTART=1 bash "$SCRIPT_DIR/fix-jicofo-truststore.sh" 2>/dev/null || true

if ! nc -z 127.0.0.1 5222 2>/dev/null; then
  echo "WARN: 127.0.0.1:5222 KO → fix-prosody-c2s-listen"
  bash "$SCRIPT_DIR/fix-prosody-c2s-listen.sh" || true
fi

echo ""
echo "==> 7. JICOFO_OPTS (doit contenir -Dconfig.file)"
mcbuleli_normalize_jicofo_opts
grep '^JICOFO_OPTS=' "$JICOFO_CFG" | head -1

echo ""
echo "==> 8. Restart unique Prosody → JVB → Jicofo (purge client_proxy stale)"
CHECK="$(prosodyctl check config 2>&1 || true)"
echo "$CHECK" | tail -15
if echo "$CHECK" | grep -qiE 'Duplicate option|Error: |Fatal'; then
  echo "FAIL: prosody config bloquante (voir ci-dessus)"
  exit 1
fi
systemctl restart prosody
sleep 8
systemctl restart jitsi-videobridge2
sleep 8
LOG_LINES="$(wc -l < /var/log/jitsi/jicofo.log 2>/dev/null || echo 0)"
systemctl restart jicofo

wait_focus_online() {
  local label="$1" w
  for ((w = 1; w <= 6; w++)); do
    sleep 5
    if prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@'; then
      return 0
    fi
    if tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | grep -q 'Registered'; then
      return 0
    fi
    echo "  ${label} attente focus@auth... ${w}/6"
  done
  return 1
}

wait_focus_online "1ère" || {
  echo "WARN: focus absent — retry systemctl start jicofo"
  systemctl start jicofo 2>/dev/null || true
  wait_focus_online "2ème" || true
}

echo ""
echo "==> 9. Vérification (jicofo actif ?)"
if ! systemctl is-active jicofo 2>/dev/null; then
  echo "FAIL: jicofo inactive après restart"
  systemctl status jicofo --no-pager -l 2>/dev/null | head -15 || true
  journalctl -u jicofo -n 25 --no-pager 2>/dev/null | tail -20
  exit 1
fi
if ! mcbuleli_jicofo_process_has_config_file; then
  echo "FAIL: processus Jicofo sans -Dconfig.file=jicofo.conf"
  pgrep -af 'jicofo|org.jitsi.jicofo' | head -3 || true
  exit 1
fi
echo "OK: -Dconfig.file présent dans le processus Java"

FOCUS_LINES="$(prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || true)"
if [[ -z "$FOCUS_LINES" ]]; then
  echo "FAIL: focus@${AUTH} absent"
  echo "NOTE: 'exit code 143' = arrêt SIGTERM normal au restart — il faut Registered APRÈS"
  echo ""
  echo "--- jicofo.log depuis restart ---"
  tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | tail -20 || tail -20 /var/log/jitsi/jicofo.log 2>/dev/null
  journalctl -u jicofo -n 20 --no-pager 2>/dev/null | tail -12 || true
  echo ""
  echo "→ sudo bash ops/jitsi/diagnose-jicofo-focus-offline.sh"
  echo "→ sudo bash ops/jitsi/fix-jicofo-localhost.sh"
  exit 1
fi
echo "$FOCUS_LINES"
FOCUS_N=$(echo "$FOCUS_LINES" | grep -c . || true)
[[ "$FOCUS_N" -eq 1 ]] && echo "OK: 1 session focus" || echo "WARN: ${FOCUS_N} sessions focus"

echo ""
tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | \
  grep -iE 'Registered|Added new videobridge|SEVERE|not-authorized|XMLStream' | tail -10 || true

if ! tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | grep -q 'Registered'; then
  echo "FAIL: Jicofo pas Registered après restart"
  echo "→ sudo bash ops/jitsi/diagnose-jicofo-focus-offline.sh"
  exit 1
fi

if ! tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | grep -qi 'videobridge'; then
  echo "WARN: pas de bridge — vérifier JVB"
  journalctl -u jitsi-videobridge2 -n 20 --no-pager | grep -iE 'MucClient|brewery|error' | tail -8 || true
fi

echo ""
echo "OK — TEST (ordre strict):"
echo "  1) Fermer tous onglets live.mcbuleli.org"
echo "  2) Terminal: sudo tail -f /var/log/jitsi/jicofo.log | grep -iE 'conference|Allocated|Creating'"
echo "  3) sudo bash ops/jitsi/gen-live-join-url.sh test-live-mcbuleli"
echo "  4) Chrome PRIVÉ top-level → Cmd+Shift+R"
echo "  Succès = Allocated dans terminal 2 pendant le join"
