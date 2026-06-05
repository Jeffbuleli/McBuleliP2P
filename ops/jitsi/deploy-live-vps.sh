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
bash "$WORKDIR/ops/jitsi/apply-nginx-live-gate.sh"
bash "$WORKDIR/ops/jitsi/apply-mcbuleli-brand.sh"

echo ""
echo "==> Vérifications"
curl -sI "https://live.mcbuleli.org/" | head -3
curl -sI "https://live.mcbuleli.org/images/mcbuleli-meet-logo.png" | head -3
echo ""
echo "OK — Rejoignez le live depuis l'app McBuleli (pas d'URL directe sans JWT)."
