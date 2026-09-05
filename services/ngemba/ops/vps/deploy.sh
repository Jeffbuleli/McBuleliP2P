#!/usr/bin/env bash
# Deploy NGEMBA on Cyber Alert VPS.
#
# Usage on the VPS:
#   bash /opt/ngemba/ops/vps/deploy.sh
set -euo pipefail

REPO_DIR="${NGEMBA_REPO:-/opt/ngemba}"
COMPOSE_DIR="$REPO_DIR/ops/vps"

cd "$COMPOSE_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: missing $COMPOSE_DIR/.env - copy .env.example and fill values" >&2
  exit 1
fi

echo "==> Building ngemba-web"
docker compose build web

echo "==> Starting ngemba-web"
docker compose up -d web

# Align nginx upload limit with AUDIO_MAX_BYTES (10 Mo + multipart).
if [[ -f "$REPO_DIR/ops/vps/nginx-ngemba.conf" ]] && [[ -d /etc/nginx/sites-available ]]; then
  echo "==> Refresh nginx body size (12m)"
  cp "$REPO_DIR/ops/vps/nginx-ngemba.conf" /etc/nginx/sites-available/ngemba
  if nginx -t 2>/dev/null; then
    systemctl reload nginx || true
  fi
fi

echo "==> Status"
docker compose ps
echo "OK - http://127.0.0.1:3012/api/health"
