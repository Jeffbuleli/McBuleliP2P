#!/usr/bin/env bash
# Build PENDING queue for Formation nov26 lead campaign (hackathon leads DB).
#
#   bash ops/vps/prepare-nov26-formation-lead-campaign.sh
#   bash ops/vps/prepare-nov26-formation-lead-campaign.sh --approve
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="${MCBULELI_COMPOSE_DIR:-$REPO/ops/vps}"
APPROVE=""
if [[ "${1:-}" == "--approve" ]]; then
  APPROVE="--approve"
fi

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
APPURL="$(compose exec -T web printenv NEXT_PUBLIC_APP_URL | tr -d '\r')"

echo "==> $(date -u +%Y-%m-%dT%H:%M:%SZ) prepare nov26 formation lead campaign ${APPROVE}"

docker run --rm --network "$NET" \
  -v "$REPO:/app" \
  -v mcbuleli_email_node_modules:/app/node_modules \
  -w /app \
  -e "DATABASE_URL=$DBURL" \
  -e "NEXT_PUBLIC_APP_URL=$APPURL" \
  node:22-bookworm-slim \
  bash -lc "set -e
    if [ ! -f node_modules/tsx/package.json ]; then
      apt-get update -qq >/dev/null
      apt-get install -y -qq ca-certificates >/dev/null
      npm ci --ignore-scripts
    fi
    npx tsx scripts/prepare-nov26-formation-lead-campaign.ts ${APPROVE}
  "

echo "==> done — daily send: bash ops/vps/send-lead-campaign-daily-batch.sh --send --limit=80 --domainMode=gmail_icloud_first"
