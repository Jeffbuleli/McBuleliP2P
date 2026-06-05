#!/bin/bash
# Déploiement complet live.mcbuleli.org — gate nginx + branding McBuleli Meet
# Usage (root VPS): bash deploy-live-vps.sh
set -euo pipefail

REPO_URL="${MCBULELI_REPO_URL:-https://github.com/Jeffbuleli/McBuleliP2P.git}"
WORKDIR="${MCBULELI_OPS_DIR:-/root/McBuleliP2P}"

echo "==> McBuleli Live VPS deploy"
if [[ ! -d "$WORKDIR/.git" ]]; then
  git clone --depth 1 "$REPO_URL" "$WORKDIR"
else
  git -C "$WORKDIR" fetch --depth 1 origin main
  git -C "$WORKDIR" checkout main
  git -C "$WORKDIR" reset --hard origin/main
fi

echo "==> Version: $(git -C "$WORKDIR" rev-parse --short HEAD)"
if [[ "${MCBULELI_LIVE_GATE_ENABLED:-true}" == "false" || "${MCBULELI_LIVE_GATE_ENABLED}" == "0" ]]; then
  echo "==> Gate PAUSED (MCBULELI_LIVE_GATE_ENABLED=false)"
  bash "$WORKDIR/ops/jitsi/pause-nginx-live-gate.sh"
else
  bash "$WORKDIR/ops/jitsi/apply-nginx-live-gate.sh"
fi
bash "$WORKDIR/ops/jitsi/fix-jitsi-config-syntax.sh"
bash "$WORKDIR/ops/jitsi/apply-mcbuleli-brand.sh"

echo ""
echo "==> Vérifications"
curl -sI "https://live.mcbuleli.org/" | head -3
curl -sI "https://live.mcbuleli.org/test-live-mcbuleli" | head -3
curl -sI "https://live.mcbuleli.org/images/mcbuleli-meet-watermark.png" | head -3
echo ""
echo "OK — / et /salle sans jwt → 302 login | avec jwt (app) → pré-join + watermark coin vidéo."
