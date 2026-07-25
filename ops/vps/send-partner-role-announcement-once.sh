#!/usr/bin/env bash
# One-shot / scheduled prod send of partner role announcement emails.
# Usage:
#   bash ops/vps/send-partner-role-announcement-once.sh
#   bash ops/vps/send-partner-role-announcement-once.sh --exclude=silikin
#   bash ops/vps/send-partner-role-announcement-once.sh --force
#
# Requires Docker Compose stack (web + db) on the VPS. Uses the same
# network + Resend env as the web container; binds /opt/mcbuleli for scripts.
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="${MCBULELI_COMPOSE_DIR:-$REPO/ops/vps}"
LOG_DIR="${LOG_DIR:-/var/log/mcbuleli}"
STAMP="${PARTNER_ROLE_SEND_STAMP:-$LOG_DIR/partner-role-announcement-2026-07-27.done}"
EXCLUDE="${PARTNER_ROLE_EXCLUDE:-silikin}"
FORCE=0

for a in "$@"; do
  if [[ "$a" == --exclude=* ]]; then
    EXCLUDE="${a#--exclude=}"
  elif [[ "$a" == --force ]]; then
    FORCE=1
  fi
done

mkdir -p "$LOG_DIR"
cd "$COMPOSE_DIR"

if [[ -f "$STAMP" && "$FORCE" != "1" ]]; then
  echo "SKIP: already sent ($(cat "$STAMP")). Use --force to resend."
  exit 0
fi

WEB="$(docker compose ps -q web)"
if [[ -z "$WEB" ]]; then
  echo "ERROR: web container not running" >&2
  exit 1
fi

NET="$(docker inspect "$WEB" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
DBURL="$(docker compose exec -T web printenv DATABASE_URL | tr -d '\r')"
RESEND="$(docker compose exec -T web printenv RESEND_API_KEY | tr -d '\r')"
ALLOW="$(docker compose exec -T web printenv RESEND_ALLOW_SEND | tr -d '\r')"
APPURL="$(docker compose exec -T web printenv NEXT_PUBLIC_APP_URL | tr -d '\r')"

if [[ -z "$RESEND" || "$ALLOW" != "true" ]]; then
  echo "ERROR: Resend not configured (RESEND_API_KEY / RESEND_ALLOW_SEND=true)" >&2
  exit 1
fi

echo "==> $(date -u +%Y-%m-%dT%H:%M:%SZ) partner-role announcement send (exclude=$EXCLUDE)"
echo "    NET=$NET APP=$APPURL"

docker run --rm --network "$NET" \
  -v "$REPO:/app" \
  -v mcbuleli_email_node_modules:/app/node_modules \
  -w /app \
  -e "DATABASE_URL=$DBURL" \
  -e "RESEND_API_KEY=$RESEND" \
  -e "RESEND_ALLOW_SEND=$ALLOW" \
  -e "NEXT_PUBLIC_APP_URL=$APPURL" \
  node:22-bookworm-slim \
  bash -lc "set -e
    if [ ! -f node_modules/tsx/package.json ]; then
      apt-get update -qq >/dev/null
      apt-get install -y -qq ca-certificates >/dev/null
      npm ci --ignore-scripts
    fi
    npx tsx scripts/send-partner-role-announcement-email.ts --all --send --exclude=${EXCLUDE}
  "

date -u +%Y-%m-%dT%H:%M:%SZ > "$STAMP"
echo "==> done $(cat "$STAMP") → $STAMP"
