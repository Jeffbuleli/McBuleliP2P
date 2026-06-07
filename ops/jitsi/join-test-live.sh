#!/bin/bash
# Test join guidé: restart Jicofo → capture 30s → URL test → check MUC.
# Usage: sudo bash ops/jitsi/join-test-live.sh [room]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOM="${1:-test-live-mcbuleli}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== join-test-live ${ROOM} =========="
echo ""
echo "ÉTAPE A — restart Jicofo (fermez les onglets live AVANT)"
bash "$SCRIPT_DIR/fix-conference-no-room.sh" "$ROOM"

echo ""
echo "ÉTAPE B — URL test host (copier dans Chrome fenêtre privée)"
bash "$SCRIPT_DIR/gen-live-join-url.sh" "$ROOM"

echo ""
echo "ÉTAPE C — capture 30s (lancer MAINTENANT, puis ouvrir l'URL dans les 30s)"
echo "  Host: ouvrir URL → onglet AU PREMIER PLAN"
echo "  Guest: 2e fenêtre privée, même room via app ou 2e URL gen-live-join-url"
echo ""
read -r -p "Appuyez Entrée quand les 2 navigateurs sont prêts à rejoindre..." _

bash "$SCRIPT_DIR/capture-muc-join.sh" "$ROOM"

echo ""
echo "ÉTAPE D — résultat MUC"
bash "$SCRIPT_DIR/check-muc-live.sh" "$ROOM"

echo ""
echo "Si ping-only: Cmd+Option+J sur live.mcbuleli.org → copier lignes rouges"
