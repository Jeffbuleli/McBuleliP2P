#!/bin/bash
# Capture join MUC — tail prosody.log (live + conference), pas seulement watch:stanzas(conference).
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
echo "==> Sessions XMPP AVANT capture (ouvrez l'app McBuleli sur host+guest d'abord)"
C2S="$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null || true)"
echo "$C2S" | head -12
N="$(echo "$C2S" | grep -c registered || true)"
N="${N:-0}"
echo "  registered: ${N}"
if [[ "$N" -lt 1 ]]; then
  echo ""
  echo "WARN: 0 client connecté — la capture sera vide."
  echo "  1) Host + guest : ouvrir la salle via l'app McBuleli"
  echo "  2) Attendre que la page Jitsi charge (pas 401)"
  echo "  3) Relancer ce script"
  echo ""
fi

: > "$OUT"
echo "Capture ${SECS}s → $OUT (prosody.log: ${DOMAIN} + ${CONFERENCE})"
echo ""
echo ">>> Dans ${SECS}s : host + guest REJOIGNENT la salle (Ctrl+Shift+R si écran pré-join) <<<"
echo ""

# Lignes nouvelles seulement pendant la fenêtre
tail -n 0 -f "$LOG" 2>/dev/null | grep --line-buffered -iE \
  "${ROOM}|${TARGET}|${CONFERENCE}|${DOMAIN}|presence|muc|ping|not.?allowed|policy-violation|focus|token" \
  >> "$OUT" &
TPID=$!
trap 'kill "$TPID" 2>/dev/null || true' EXIT

for ((i = SECS; i >= 1; i--)); do
  printf "\r  %2ds — rejoignez maintenant sur les 2 appareils..." "$i"
  sleep 1
done
printf "\r  capture terminée.%-30s\n" ""

kill "$TPID" 2>/dev/null || true
wait "$TPID" 2>/dev/null || true

echo ""
echo "==> Lignes capturées (${ROOM} / MUC)"
if [[ -s "$OUT" ]]; then
  grep -iE "${ROOM}|${TARGET}|${CONFERENCE}|presence|muc|not.?allowed|error|focus" "$OUT" | tail -40
else
  echo "(aucune ligne — 0 client actif pendant la fenêtre OU Prosody ne log pas ces stanzas)"
fi

echo ""
echo "==> Ping / auth sur ${DOMAIN} (ping-only = XMPP OK, pas de join MUC)"
grep -iE "ping|authenticated|c2s" "$OUT" | grep -i "${DOMAIN}" | tail -10 || echo "(aucun ping/auth capturé)"

echo ""
echo "==> Jicofo (même fenêtre, grep log fichier)"
JICOFO="/var/log/jitsi/jicofo.log"
if [[ -f "$JICOFO" ]]; then
  tail -200 "$JICOFO" | grep -iE "${ROOM}|Allocated|Creating|Conference|error|SEVERE" | tail -8 || \
    echo "(aucune activité Jicofo pour ${ROOM})"
fi

echo ""
if grep -qiE "not.?allowed|policy-violation|forbidden" "$OUT"; then
  echo "VERDICT: JWT/token rejeté au join MUC"
elif grep -qiE "${TARGET}|${ROOM}.*${CONFERENCE}" "$OUT"; then
  echo "VERDICT: join MUC ${TARGET} détecté dans prosody.log"
elif grep -qi "ping" "$OUT" && ! grep -qiE "${ROOM}|${CONFERENCE}" "$OUT"; then
  echo "VERDICT: ping-only — XMPP connecté mais Jitsi n'initie PAS la conférence"
  echo "  → sudo bash ops/jitsi/fix-config-force-join.sh"
  echo "  → Ctrl+Shift+R + rejoindre via app McBuleli"
  echo "  → F12 console : conference / muc / token / getUserMedia"
elif [[ "$N" -lt 1 ]]; then
  echo "VERDICT: aucun client XMPP connecté pendant le test"
  echo "  → ouvrir host+guest dans l'app AVANT de relancer la capture"
else
  echo "VERDICT: clients connectés (${N} c2s) mais aucun trafic room pendant ${SECS}s"
  echo "  → écran pré-join : cliquer « Rejoindre » ou fix-config-force-join.sh"
  echo "  → relancer: sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}"
fi
