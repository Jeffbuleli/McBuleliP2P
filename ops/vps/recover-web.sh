#!/usr/bin/env bash
# Fast recovery when Cloudflare shows 522 — restart nginx + web without rebuild.
#
# Usage on the VPS (after SSH works):
#   bash /opt/mcbuleli/ops/vps/recover-web.sh
set -euo pipefail

REPO_DIR="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="$REPO_DIR/ops/vps"
LOCK_FILE="/var/run/mcbuleli-deploy.lock"

echo "==> Free RAM: stop stale deploy/build jobs"
pkill -f "${REPO_DIR}/ops/vps/deploy.sh" 2>/dev/null || true
pkill -f "docker compose build" 2>/dev/null || true
pkill -f "docker-compose compose build" 2>/dev/null || true
pkill -f "node /app/node_modules/.bin/next build" 2>/dev/null || true
rm -f "$LOCK_FILE" 2>/dev/null || true
sleep 3

if [[ -f /proc/meminfo ]]; then
  awk '/MemAvailable:/ {printf "MemAvailable=%s MiB\n", int($2/1024)}' /proc/meminfo
fi

echo "==> Restart nginx"
systemctl restart nginx 2>/dev/null || true

cd "$COMPOSE_DIR"
if [[ ! -f .env ]]; then
  echo "ERROR: missing $COMPOSE_DIR/.env" >&2
  exit 1
fi

echo "==> Restart web container (no rebuild)"
docker compose stop web 2>/dev/null || true
sleep 2
docker compose rm -f web 2>/dev/null || true
docker rm -f mcbuleli-web-1 2>/dev/null || true
sleep 1
docker compose up -d web
sleep 5

curl -fsS -o /dev/null -w "health_http=%{http_code}\n" "http://127.0.0.1:3000/login" || {
  echo "WARN: web not up — try full deploy when RAM allows" >&2
  exit 1
}
echo "RECOVER_OK $(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"
