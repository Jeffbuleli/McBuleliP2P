#!/usr/bin/env bash
# One-time: replace partial /opt/mcbuleli (ops-only) with full GitHub checkout.
# Run on prod host 153.75.235.176 — see docs/vps-production-host.md
#
#   bash ops/vps/bootstrap-git-on-shared-host.sh
#
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
BRANCH="${MCBULELI_DEPLOY_BRANCH:-main}"
REMOTE="${MCBULELI_GIT_REMOTE:-https://github.com/Jeffbuleli/McBuleliP2P.git}"

if [[ -d "$REPO/.git" ]]; then
  echo "==> $REPO already a git checkout — run deploy.sh instead"
  exit 0
fi

ENV_SRC=""
if [[ -f "$REPO/ops/vps/.env" ]]; then
  ENV_SRC="$REPO/ops/vps/.env"
elif [[ -f /root/mcbuleli-vps.env.bak ]]; then
  ENV_SRC="/root/mcbuleli-vps.env.bak"
fi

if [[ -n "$ENV_SRC" ]]; then
  cp -a "$ENV_SRC" "/root/mcbuleli-vps.env.bak"
  echo "==> Saved .env → /root/mcbuleli-vps.env.bak"
fi

if [[ -d "$REPO" ]]; then
  echo "==> Removing partial $REPO (ops-only tree)"
  rm -rf "$REPO"
fi

echo "==> Cloning $REMOTE ($BRANCH) → $REPO"
git clone --depth 1 -b "$BRANCH" "$REMOTE" "$REPO"

if [[ -f /root/mcbuleli-vps.env.bak ]]; then
  cp -a /root/mcbuleli-vps.env.bak "$REPO/ops/vps/.env"
  chmod 600 "$REPO/ops/vps/.env"
  echo "==> Restored ops/vps/.env"
fi

chmod +x "$REPO/ops/vps/"*.sh 2>/dev/null || true
echo "==> Next: bash $REPO/ops/vps/deploy.sh"
