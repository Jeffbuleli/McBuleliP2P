#!/bin/bash
# Capture join MUC — watch:stanzas (live + conference) + prosody.log auth.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
TARGET="${ROOM}@${CONFERENCE}"
SECS="${CAPTURE_SECS:-30}"
OUT="/tmp/mcb-muc-stanzas-${ROOM}.log"
LOG="/var/log/prosody/prosody.log"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$LOG" ]] || { echo "FAIL: $LOG absent"; exit 1; }

CODE="$(curl -sI -o /dev/null -w '%{http_code}' "https://${DOMAIN}/xmpp-websocket" 2>/dev/null || echo 000)"
echo "xmpp-websocket HTTP ${CODE}"
[[ "$CODE" == "502" || "$CODE" == "000" ]] && { echo "nginx cassé → fix-nginx-xmpp-dedupe.sh"; exit 1; }

echo ""
echo "==> config.js (prejoin effectif — doit être false)"
PREJOIN_SERVED="$(curl -s "https://${DOMAIN}/config.js" 2>/dev/null | grep -iE 'prejoinPageEnabled|prejoinConfig' | tail -2 || true)"
echo "${PREJOIN_SERVED:-"(indisponible)"}"
echo "$PREJOIN_SERVED" | grep -qiE 'true|enabled:\s*true' && \
  echo "  WARN prejoin encore true → sudo bash ops/jitsi/fix-config-force-join.sh avant capture"

echo ""
echo "==> Sessions XMPP AVANT capture (host+guest via app McBuleli, onglet au premier plan)"
C2S="$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null || true)"
echo "$C2S" | head -12
N="$(echo "$C2S" | grep -c registered || true)"
N="${N:-0}"
echo "  registered: ${N}"
if [[ "$N" -lt 1 ]]; then
  echo ""
  echo "WARN: 0 client — ouvrez la salle sur les 2 appareils puis relancez."
  echo ""
fi

: > "$OUT"
echo "Capture ${SECS}s → $OUT"
echo "  (watch:stanzas ${DOMAIN} + tail auth prosody.log)"
echo ""
echo ">>> ${SECS}s : Ctrl+Shift+R sur les 2 navigateurs, onglet ACTIF (pas hibernating) <<<"
echo ""

# Auth / erreurs dans prosody.log (les stanzas XMPP ne sont en général PAS loggées en info)
tail -n 0 -f "$LOG" 2>/dev/null | grep --line-buffered -Fi \
  -e "${ROOM}" -e "${CONFERENCE}" -e "authenticated" -e "not allowed" -e "policy-violation" -e "token" \
  >> "$OUT" &
LOGPID=$!

WATCHPID=""
if command -v expect >/dev/null 2>&1; then
  expect <<EXPECT >> "$OUT" 2>&1 &
set timeout [expr {${SECS} + 15}]
log_user 1
spawn prosodyctl shell
expect "prosody>"
send "watch:stanzas('${DOMAIN}')\r"
sleep ${SECS}
send "\x03"
expect {
    "prosody>" {}
    timeout {}
}
send "bye\r"
expect eof
EXPECT
  WATCHPID=$!
fi

trap 'kill "$LOGPID" "$WATCHPID" 2>/dev/null || true' EXIT

for ((i = SECS; i >= 1; i--)); do
  printf "\r  %2ds — rejoignez / rafraîchissez maintenant..." "$i"
  sleep 1
done
printf "\r  capture terminée.%-32s\n" ""

kill "$LOGPID" 2>/dev/null || true
[[ -n "$WATCHPID" ]] && kill "$WATCHPID" 2>/dev/null || true
wait "$LOGPID" 2>/dev/null || true
[[ -n "$WATCHPID" ]] && wait "$WATCHPID" 2>/dev/null || true

echo ""
echo "==> Stanzas XMPP (watch ${DOMAIN})"
if grep -qiE "presence|ping|iq|message|${ROOM}|${CONFERENCE}" "$OUT" 2>/dev/null; then
  grep -iE "presence|ping|iq|message|${ROOM}|${CONFERENCE}|muc|not.?allowed|error" "$OUT" | tail -40
else
  echo "(aucune stanza — onglet en arrière-plan / SM hibernating / pas de trafic)"
fi

echo ""
echo "==> Auth / erreurs prosody.log"
grep -iE "authenticated|not.?allowed|policy|token|${ROOM}|${CONFERENCE}" "$OUT" | tail -15 || echo "(aucune)"

echo ""
echo "==> Jicofo"
JICOFO="/var/log/jitsi/jicofo.log"
if [[ -f "$JICOFO" ]]; then
  tail -300 "$JICOFO" | grep -iE "${ROOM}|Allocated|Creating|Conference|error|SEVERE" | tail -8 || \
    echo "(aucune activité Jicofo pour ${ROOM})"
fi

echo ""
echo "==> Room existe ?"
prosodyctl shell muc room "${TARGET}" 2>&1 | tail -3 || true

echo ""
HAS_SVC_UNAVAIL=0
grep -qiE 'service-unavailable' "$OUT" && HAS_SVC_UNAVAIL=1
HAS_MUC_JOIN=0
# Presence vers la MUC — pas l'IQ conference vers focus (contient aussi room=...@conference)
if grep -qiE "presence[^>]*to=['\"]${TARGET}|presence[^>]*to=['\"]${ROOM}@" "$OUT"; then
  HAS_MUC_JOIN=1
fi
HAS_PING=0
grep -qi "urn:xmpp:ping" "$OUT" && HAS_PING=1

if grep -qiE "not.?allowed|policy-violation|forbidden" "$OUT"; then
  echo "VERDICT: JWT/token rejeté au join MUC"
elif [[ "$HAS_SVC_UNAVAIL" -eq 1 ]]; then
  echo "VERDICT: conference IQ → focus.${DOMAIN} = service-unavailable (Jicofo n'a pas reçu l'IQ)"
  echo "  → sudo bash ops/jitsi/fix-focus-iq-route.sh"
  echo "  → FERMER tous onglets + gen-live-join-url + retest dans 60s"
elif [[ "$HAS_MUC_JOIN" -eq 1 ]]; then
  echo "VERDICT: join MUC ${TARGET} détecté (presence)"
elif grep -qiE 'focus\.|conference request' "$OUT"; then
  echo "VERDICT: conference IQ vers focus → service-unavailable (Jicofo déconnecté du client_proxy)"
  echo "  → sudo bash ops/jitsi/fix-focus-service-unavailable.sh"
elif grep -qiE 'focus\.|conference\.request|urn:ietf:params:xml:ns:xmpp-conference' "$OUT"; then
  echo "VERDICT: IQ conference vers focus détectée mais pas de join MUC"
  echo "  → sudo bash ops/jitsi/fix-focus-service-unavailable.sh"
  echo "  → sudo bash ops/jitsi/diagnose-focus-online-no-room.sh ${ROOM}"
elif [[ "$HAS_PING" -eq 1 && "$HAS_MUC_JOIN" -eq 0 ]]; then
  echo "VERDICT: ping-only confirmé — auth + ping + disco OK, ZÉRO presence vers ${CONFERENCE}"
  echo "  → Jitsi JS bloqué AVANT conference.join() (pré-join, hash SyntaxError, GUM, erreur JS)"
  echo "  → sudo bash ops/jitsi/fix-ping-only.sh ${ROOM}"
  echo "  → Test isolé: gen-live-join-url.sh → fenêtre privée (pas via app)"
  echo "  → Mac Chrome Cmd+Option+J sur live.mcbuleli.org → copier lignes rouges"
  echo "  → Cmd+Shift+R, onglet premier plan (pas hibernating / pas ^C pendant capture)"
elif [[ "$N" -ge 1 ]]; then
  echo "VERDICT: ${N} client(s) connecté(s) mais pas de join MUC pendant ${SECS}s"
  echo "  → relancer capture pendant Cmd+Shift+R sur les 2 appareils"
else
  echo "VERDICT: aucun client XMPP — ouvrir host+guest puis relancer"
fi
