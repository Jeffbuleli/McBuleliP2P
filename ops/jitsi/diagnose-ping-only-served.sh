#!/bin/bash
# Ping-only: vérifie config.js SERVI (dernières lignes gagnantes) + hash URL test.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
ROOM="${1:-test-live-mcbuleli}"
URL="https://${DOMAIN}/config.js"

echo "========== diagnose-ping-only-served ${ROOM} =========="

BODY="$(curl -sf "$URL")" || { echo "FAIL: cannot fetch $URL"; exit 1; }

check_last() {
  local label="$1"
  local pattern="$2"
  local last
  last="$(echo "$BODY" | grep -iE "$pattern" | tail -1 || true)"
  if [[ -z "$last" ]]; then
    echo "  ? $label: (absent)"
  else
    echo "  → $label: ${last:0:120}"
  fi
}

echo ""
echo "==> Dernières valeurs effectives (config.js servi)"
check_last "prejoinPageEnabled" 'prejoinPageEnabled'
check_last "prejoinConfig" 'prejoinConfig'
check_last "enableWelcomePage" 'enableWelcomePage'
check_last "enableUserRolesBasedOnToken" 'enableUserRolesBasedOnToken'
check_last "requireDisplayName" 'requireDisplayName'
check_last "hosts.muc" 'hosts\.muc'
check_last "anonymousdomain" 'anonymousdomain'

echo ""
echo "==> Marqueurs mcbuleli (sprawl = conflit)"
echo "$BODY" | grep -oE 'mcbuleli-[a-z0-9-]+' | sort -u | tail -15 || echo "(aucun)"

FAIL=0
echo ""
echo "==> VERDICT serveur"
if echo "$BODY" | grep -iE 'prejoinPageEnabled|prejoinConfig' | tail -3 | grep -qiE 'true|enabled:\s*true'; then
  echo "  FAIL prejoin actif → fix-config-force-join.sh"
  FAIL=1
else
  echo "  OK prejoin désactivé (servi)"
fi
if echo "$BODY" | grep 'requireDisplayName' | tail -1 | grep -qi 'true'; then
  echo "  FAIL requireDisplayName=true → bloque join sans nom → fix-config-force-join.sh"
  FAIL=1
else
  echo "  OK requireDisplayName false/absent"
fi
if echo "$BODY" | grep 'enableUserRolesBasedOnToken' | tail -1 | grep -qi 'true'; then
  echo "  WARN enableUserRolesBasedOnToken=true → peut bloquer guest"
  FAIL=1
else
  echo "  OK enableUserRolesBasedOnToken false"
fi

echo ""
if [[ "$FAIL" -eq 1 ]]; then
  echo "CORRIGER:"
  echo "  sudo bash ops/jitsi/fix-config-force-join.sh"
  echo "  sudo bash ops/jitsi/verify-config-served.sh"
  exit 1
fi

echo "Serveur OK pour auto-join — ping-only = navigateur:"
echo "  1) Fermer tous onglets live.mcbuleli.org"
echo "  2) sudo bash ops/jitsi/gen-live-join-url.sh ${ROOM}"
echo "  3) Chrome privé → coller URL → Cmd+Option+J (lignes rouges)"
echo "  4) sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}  (pendant join)"
bash "$(dirname "$0")/verify-join-hash-parse.sh" "$ROOM" 2>/dev/null || true
