#!/usr/bin/env sh
# Trigger one bot cron pass (same as Render Cron Job should call every ~5 min).
# Usage: CRON_SECRET=... APP_URL=https://mcbuleli.org ./scripts/trigger-bots-tick.sh

set -e
APP_URL="${APP_URL:-https://mcbuleli.org}"
if [ -z "$CRON_SECRET" ]; then
  echo "Set CRON_SECRET (min 12 chars, same as Render env)." >&2
  exit 1
fi
curl -sS -X POST "${APP_URL%/}/api/internal/bots/tick" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  | cat
echo
