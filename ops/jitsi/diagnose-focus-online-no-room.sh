#!/bin/bash
# focus@auth connecté mais room MUC absente / comptes séparés (TH seul).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
TARGET="${ROOM}@${CONFERENCE}"

echo "========== diagnose focus-online no-room (${TARGET}) =========="

echo ""
echo "==> 1. Sessions focus@auth (attendu: 1 seule)"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || echo "(aucune)"
FOCUS_N=$(prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -ci focus 2>/dev/null || true)
FOCUS_N=${FOCUS_N:-0}
echo "  focus sessions: ${FOCUS_N}"
[[ "$FOCUS_N" -gt 1 ]] && echo "  WARN: plusieurs focus@auth → client_proxy peut router vers session morte"

echo ""
echo "==> 2. Jicofo Registered (doit être RÉCENT — relancer join après restart)"
grep -iE 'Registered|XmlPullParser|SEVERE|Failed to connect' /var/log/jitsi/jicofo.log 2>/dev/null | tail -6 || echo "(vide)"

echo ""
echo "==> 3. Jicofo a-t-il alloué ${ROOM} ?"
if grep -qiE "${ROOM}|Allocated.*${CONFERENCE}|Creating conference" /var/log/jitsi/jicofo.log 2>/dev/null; then
  grep -iE "${ROOM}|Allocated|Creating conference" /var/log/jitsi/jicofo.log 2>/dev/null | tail -8
else
  echo "  FAIL: aucune ligne Allocated/Creating pour ${ROOM}"
  echo "  → navigateur envoie IQ mais Jicofo ne crée pas la conf (ou pas encore refresh)"
fi

echo ""
echo "==> 4. service-unavailable récent (prosody.log)"
grep -iE 'service-unavailable|focus\.|conference request' /var/log/prosody/prosody.log 2>/dev/null | tail -8 || echo "(aucun)"

echo ""
echo "==> 5. JVB brewery"
grep -iE 'Added new videobridge|Removed|bridge.*stress' /var/log/jitsi/jicofo.log 2>/dev/null | tail -4 || \
  echo "WARN: pas de bridge — bash ops/jitsi/fix-jitsi-brewery-complete.sh"

echo ""
echo "==> 6. MUC join / token (prosody)"
grep -iE "${TARGET}|${ROOM}.*${CONFERENCE}|not.?allowed|token" /var/log/prosody/prosody.log 2>/dev/null | tail -10 || \
  echo "(aucun join MUC loggé)"

echo ""
echo "==> 7. Room maintenant"
prosodyctl shell muc room "${TARGET}" 2>&1 | tail -2 || true

echo ""
echo "PROCÉDURE (les 2 comptes séparés = conférence jamais allouée)"
echo "  1) sudo bash ops/jitsi/fix-conference-no-room.sh"
echo "  2) Host: Cmd+Shift+R → attendre 5s"
echo "  3) Guest: Cmd+Shift+R → rejoindre"
echo "  4) Pendant join: sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}"
