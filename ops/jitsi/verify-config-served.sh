#!/bin/bash
# Valeurs effectives servies par nginx (dernières occurrences = ce que Jitsi applique en dernier).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
URL="https://${DOMAIN}/config.js"

echo "========== verify-config-served ${DOMAIN} =========="
BODY="$(curl -sf "$URL")" || { echo "FAIL: curl $URL"; exit 1; }

echo ""
echo "==> Marqueurs baseline / force-join"
echo "$BODY" | grep -oE 'mcbuleli-[a-z-]+' | sort -u || echo "(aucun marqueur)"

echo ""
echo "==> hosts (dernières lignes)"
echo "$BODY" | grep -E 'hosts\.(domain|muc|anonymousdomain)' | tail -6

echo ""
echo "==> prejoin / welcome (toutes occurrences — la dernière gagne en JS)"
echo "$BODY" | grep -iE 'prejoinPageEnabled|prejoinConfig|enableWelcomePage' | tail -10

echo ""
echo "==> Dernières 15 lignes config.js"
echo "$BODY" | tail -15

echo ""
PREJOIN_LAST="$(echo "$BODY" | grep -iE 'prejoinPageEnabled|prejoinConfig\.enabled' | tail -1)"
WELCOME_LAST="$(echo "$BODY" | grep -iE 'enableWelcomePage' | tail -1)"
MUC_LAST="$(echo "$BODY" | grep 'hosts.muc' | tail -1)"

echo "==> VERDICT"
if echo "$PREJOIN_LAST" | grep -qiE 'true|enabled:\s*true'; then
  echo "  FAIL prejoin encore actif: $PREJOIN_LAST"
  echo "  → sudo bash ops/jitsi/fix-config-force-join.sh"
elif echo "$WELCOME_LAST" | grep -qi 'true'; then
  echo "  WARN welcome encore true: $WELCOME_LAST"
else
  echo "  OK prejoin/welcome désactivés côté config.js servi"
fi
echo "  muc effectif: ${MUC_LAST:-MANQUANT}"
