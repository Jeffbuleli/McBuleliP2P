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
GATE_ENABLED="${MCBULELI_LIVE_GATE_ENABLED:-true}"
if [[ "$GATE_ENABLED" == "false" || "$GATE_ENABLED" == "0" ]]; then
  echo "==> Gate PAUSED (MCBULELI_LIVE_GATE_ENABLED=false)"
  bash "$WORKDIR/ops/jitsi/pause-nginx-live-gate.sh"
else
  bash "$WORKDIR/ops/jitsi/apply-nginx-live-gate.sh"
fi
bash "$WORKDIR/ops/jitsi/fix-jitsi-config-syntax.sh"
if [[ -f /root/.mcbuleli-jitsi-secret ]]; then
  export JITSI_JWT_SECRET="$(tr -d '[:space:]' < /root/.mcbuleli-jitsi-secret)"
  echo "==> Master fix: single MUC + JWT-only (no guest split)"
  bash "$WORKDIR/ops/jitsi/fix-live-master.sh" test-live-mcbuleli || {
    echo "WARN: fix-live-master partial — run manually: sudo bash ops/jitsi/fix-live-master.sh"
  }
else
  echo "==> JWT Prosody: créez /root/.mcbuleli-jitsi-secret puis:"
  echo "    sudo bash ops/jitsi/fix-live-master.sh"
fi
bash "$WORKDIR/ops/jitsi/apply-mcbuleli-brand.sh"
# Re-apply force-join after branding (brand may touch prejoin)
bash "$WORKDIR/ops/jitsi/fix-config-force-join.sh" 2>/dev/null || true

echo ""
echo "==> Vérifications"
curl -sI "https://live.mcbuleli.org/" | head -3
curl -sI "https://live.mcbuleli.org/test-live-mcbuleli" | head -3
curl -sI "https://live.mcbuleli.org/images/mcbuleli-meet-watermark.png" | head -3
echo ""
echo "OK — / et /salle sans jwt → 302 login | avec jwt (app) → pré-join + watermark coin vidéo."
