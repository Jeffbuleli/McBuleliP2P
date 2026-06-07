#!/bin/bash
# Ping-only: auth+ping+disco OK, zéro presence MUC — fix serveur puis test URL directe.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
ROOM="${1:-test-live-mcbuleli}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix ping-only (${ROOM}) =========="

echo ""
echo "==> 1. config.js effectif"
bash "$SCRIPT_DIR/verify-config-served.sh" || true

echo ""
echo "==> 2. Force join (prejoin/welcome/roles off)"
bash "$SCRIPT_DIR/fix-config-force-join.sh"

echo ""
echo "==> 3. Hash parse (évite SyntaxError client)"
bash "$SCRIPT_DIR/verify-join-hash-parse.sh" "$ROOM" || true

echo ""
echo "==> 4. Jicofo JVM XML limits (disco#info)"
bash "$SCRIPT_DIR/fix-jicofo-jvm-xml-limits.sh" 2>/dev/null || systemctl restart jicofo

echo ""
echo "==> 5. URL test DIRECTE (sans app McBuleli)"
bash "$SCRIPT_DIR/gen-live-join-url.sh" "$ROOM"

echo ""
echo "========== PROCÉDURE TEST =========="
echo "  A) Fenêtre privée Chrome, extensions OFF"
echo "  B) Coller l'URL ci-dessus (host moderator)"
echo "  C) Terminal 2: sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}"
echo "     → lancer capture PUIS ouvrir l'URL dans les 30s"
echo "  D) Onglet live.mcbuleli.org AU PREMIER PLAN (pas arrière-plan)"
echo "  E) Cmd+Option+J — si lignes rouges, copier ici"
echo ""
echo "  Si URL directe = join OK mais app McBuleli = ping-only"
echo "    → redeploy Render (hash fix d378d9e) + host via /app/live/enter"
echo ""
echo "  Si URL directe = ping-only aussi"
echo "    → coller console Chrome + sortie capture-muc-join"
