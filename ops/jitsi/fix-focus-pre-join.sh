#!/bin/bash
# focus@auth semble online mais conference IQ → service-unavailable + tail jicofo silencieux.
# Cause: session focus fantôme dans client_proxy. À lancer IMMÉDIATEMENT avant le test join.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix-focus-pre-join =========="
echo "Symptôme: c2s + focus OK + service-unavailable + jicofo.log silencieux"
echo ""
echo "AVANT: fermer TOUS les onglets live.mcbuleli.org (0 c2s attendu)"
echo "      Test = 1 SEUL onglet Chrome privé (gen-live-join-url), pas 2 onglets"
echo ""

echo "==> 0. Dedupe Prosody cfg (Duplicate option → client_proxy cassé)"
SKIP_RESTART=1 bash "$SCRIPT_DIR/fix-prosody-dedupe-cfg.sh" || {
  echo "FAIL: dedupe cfg — coller: prosodyctl check config"
  exit 1
}

echo ""
echo "==> 1. Kill zombies Jicofo"
systemctl stop jicofo jitsi-videobridge2 2>/dev/null || true
sleep 2
for pid in $(pgrep -f 'org.jitsi.jicofo|jicofo\.jar' 2>/dev/null || true); do
  kill -9 "$pid" 2>/dev/null || true
done

echo ""
echo "==> 2. focus component target_address"
SKIP_RESTART=1 bash "$SCRIPT_DIR/fix-focus-component.sh"

echo ""
echo "==> 3. jicofo.conf + mdp + restart Prosody/Jicofo"
bash "$SCRIPT_DIR/fix-jicofo-localhost.sh"

echo ""
echo "==> 4. JVB brewery"
systemctl restart jitsi-videobridge2
sleep 10

echo ""
echo "==> 5. Vérification"
FOCUS_N=$(prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -c "focus@${AUTH}" 2>/dev/null || true)
FOCUS_N=${FOCUS_N:-0}
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep "focus@${AUTH}" || echo "FAIL: focus absent"
echo "  sessions focus@${AUTH}: ${FOCUS_N} (attendu: 1)"
grep -iE 'Registered|Added new videobridge' /var/log/jitsi/jicofo.log 2>/dev/null | tail -4 || true

if [[ "$FOCUS_N" -lt 1 ]]; then
  echo "FAIL — sudo bash ops/jitsi/diagnose-jicofo-focus-offline.sh"
  exit 1
fi
if [[ "$FOCUS_N" -gt 1 ]]; then
  echo "WARN: plusieurs focus — sudo systemctl restart prosody && sleep 6 && sudo systemctl restart jicofo"
fi

C2S_N=$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -c registered 2>/dev/null || true)
C2S_N=${C2S_N:-0}
echo "c2s ${DOMAIN}: ${C2S_N} (attendu 0 avant join)"

echo ""
echo "OK — TEST dans les 60s:"
echo "  Terminal A: sudo tail -f /var/log/jitsi/jicofo.log | grep -iE 'conference|Allocated|Creating|SEVERE'"
echo "  Terminal B: sudo bash ops/jitsi/gen-live-join-url.sh test-live-mcbuleli"
echo "  1 SEUL onglet Chrome PRIVÉ top-level — Cmd+Shift+R"
echo "  Succès = Allocated dans Terminal A (pas service-unavailable en console)"
