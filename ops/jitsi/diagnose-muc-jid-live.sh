#!/bin/bash
# Pendant que host ET guest sont connectés (UI ouverte, même si 1 participant chacun).
# Répond: même MUC JID ou pas ? Jicofo alloue la conférence ?
#
# Usage: sudo bash ops/jitsi/diagnose-muc-jid-live.sh test-live-mcbuleli
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFERENCE="conference.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
MUC_JID="${ROOM}@${CONFERENCE}"
PROSODY_LOG="${PROSODY_LOG:-/var/log/prosody/prosody.log}"
JICOFO_LOG="${JICOFO_LOG:-/var/log/jitsi/jicofo.log}"
JVB_LOG="${JVB_LOG:-/var/log/jitsi/jvb.log}"
WINDOW_MIN="${WINDOW_MIN:-15}"

echo "=============================================="
echo " MUC live — room=${ROOM}"
echo " Attendu: TOUS les joins sur ${MUC_JID}"
echo " Fenêtre: ${WINDOW_MIN} dernières minutes"
echo "=============================================="

since_ts() {
  date -d "${WINDOW_MIN} minutes ago" '+%b %d %H:%M' 2>/dev/null || \
  date -v-"${WINDOW_MIN}"M '+%b %d %H:%M' 2>/dev/null || echo ""
}

SINCE="$(since_ts)"

filter_recent() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  if [[ -n "$SINCE" ]]; then
    awk -v since="$SINCE" '
      {
        if ($0 ~ /^[A-Z][a-z]{2} [0-9]+ /) { line=$0 }
        if (line >= since || index($0, since) > 0) print
      }
    ' "$f" 2>/dev/null || tail -500 "$f"
  else
    tail -500 "$f"
  fi
}

echo ""
echo "==> 1. Auth XMPP (live vs guest) — récent"
filter_recent "$PROSODY_LOG" | grep -iE "Authenticated as .*@(${DOMAIN}|guest\.)" | tail -10 || echo "(aucune)"

echo ""
echo "==> 2. Joins MUC — JID exactes (CRITIQUE)"
# Patterns Prosody mod_muc / présence
filter_recent "$PROSODY_LOG" | grep -iE \
  "${ROOM}@${CONFERENCE}|${ROOM}@conference\.|joined.*${ROOM}|muc.*${ROOM}|occupant.*${ROOM}" \
  | tail -25 || echo "(aucune ligne MUC — clients peut-être pas entrés dans la salle)"

echo ""
echo "==> 2b. Toutes les MUC @conference.${DOMAIN} distinctes (récent)"
filter_recent "$PROSODY_LOG" | grep -oE '[a-zA-Z0-9._-]+@conference\.'"${DOMAIN}" \
  | sort -u | tail -20 || echo "(aucune)"

MUC_COUNT="$(filter_recent "$PROSODY_LOG" | grep -oE '[a-zA-Z0-9._-]+@conference\.'"${DOMAIN}" | sort -u | wc -l | tr -d ' ')"
if [[ "$MUC_COUNT" -gt 1 ]]; then
  echo ""
  echo "  *** ALERTE: ${MUC_COUNT} MUC différentes — split room confirmé côté XMPP ***"
elif [[ "$MUC_COUNT" -eq 1 ]]; then
  echo ""
  echo "  OK: une seule MUC conference.* récente"
else
  echo ""
  echo "  WARN: aucune MUC détectée — grep logs ou clients pas dans la conférence"
fi

echo ""
echo "==> 3. Jicofo — conférence ${ROOM}"
filter_recent "$JICOFO_LOG" | grep -iE \
  "${ROOM}|${MUC_JID}|Creating conference|Allocated|conference-request|focus" \
  | tail -20 || echo "(aucune — Jicofo ne gère pas la salle = pas de bridge commun)"

echo ""
echo "==> 4. JVB — brewery + endpoints"
filter_recent "$JVB_LOG" | grep -iE 'brewery|Joined|colibri|endpoint|Conference' | tail -12 || echo "(aucune)"

echo ""
echo "==> 5. Focus component Prosody"
PROSODY_CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$PROSODY_CFG" ]] || PROSODY_CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
grep -A4 "Component \"focus.${DOMAIN}\"" "$PROSODY_CFG" 2>/dev/null | head -6 || \
  echo "FAIL: focus.${DOMAIN} absent → bash ops/jitsi/fix-jitsi-brewery-complete.sh"

echo ""
echo "==> 6. Jicofo conference-muc-jid"
grep -E 'conference-muc-jid|client-proxy|xmpp-domain' /etc/jitsi/jicofo/jicofo.conf 2>/dev/null | head -5 || \
  echo "FAIL → bash ops/jitsi/fix-jicofo-localhost.sh"

echo ""
echo "==> 7. config.js servi + hash attendu app"
curl -s "https://${DOMAIN}/config.js" 2>/dev/null | grep -iE 'hosts\.muc|anonymousdomain|enableLobby|p2p' | head -8 || true
echo "  App hash (même pour host/guest sauf vidéo): config.hosts.muc=conference.${DOMAIN}"

echo ""
echo "=============================================="
echo " INTERPRÉTATION"
echo "=============================================="
cat <<EOF
A) Auth @live.mcbuleli.org pour les 2 + UNE seule MUC ${MUC_JID}
   mais Jicofo vide → focus/JVB (bash fix-jicofo-localhost.sh + fix-jitsi-brewery-complete.sh)

B) Auth OK mais 2+ MUC @conference.* différentes → split subdomain/room
   → vérifier URL exacte dans barre navigateur (path + hash config.hosts.muc)

C) Auth OK, aucune ligne MUC → pas entré en conférence (prejoin, token room, déco)
   → garder les 2 onglets ouverts 60s puis relancer ce script

D) Auth @guest. encore présent → fix-live-unified-baseline.sh pas appliqué
EOF
