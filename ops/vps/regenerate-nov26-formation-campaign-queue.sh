#!/usr/bin/env bash
# Rebuild PENDING queue for Formation nov26 campaign only (no other campaigns claiming leads).
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="${MCBULELI_COMPOSE_DIR:-$REPO/ops/vps}"

cd "$COMPOSE_DIR"

compose() {
  if [[ -f docker-compose.shared-host.yml ]]; then
    docker compose -f docker-compose.yml -f docker-compose.shared-host.yml "$@"
  else
    docker compose "$@"
  fi
}

WEB="$(compose ps -q web)"
if [[ -z "$WEB" ]]; then
  echo "ERROR: web container not running" >&2
  exit 1
fi

NET="$(docker inspect "$WEB" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
DBURL="$(compose exec -T web printenv DATABASE_URL | tr -d '\r')"

echo "==> $(date -u +%Y-%m-%dT%H:%M:%SZ) regenerate-nov26-formation-campaign-queue"

docker run --rm --network "$NET" \
  -v "$REPO:/app" \
  -v mcbuleli_email_node_modules:/app/node_modules \
  -w /app \
  -e "DATABASE_URL=$DBURL" \
  node:22-bookworm-slim \
  bash -lc "set -e
    if [ ! -f node_modules/tsx/package.json ]; then
      apt-get update -qq >/dev/null
      apt-get install -y -qq ca-certificates >/dev/null
      npm ci --ignore-scripts
    fi
    npx tsx scripts/regenerate-nov26-formation-campaign-queue.ts
  "

echo "==> done"
