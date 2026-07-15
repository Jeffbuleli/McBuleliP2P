#!/usr/bin/env bash
# Print the GitHub Actions secrets to configure (values from VPS cron.env).
# Run ON THE VPS as root:
#   bash /opt/mcbuleli/ops/vps/print-gha-cron-secrets.sh
#
# Then paste into: GitHub → Settings → Secrets and variables → Actions
set -euo pipefail
ENV="${CRON_ENV:-/opt/mcbuleli/ops/vps/cron.env}"
if [[ ! -f "$ENV" ]]; then
  echo "missing $ENV" >&2
  exit 1
fi
# shellcheck disable=SC1090
set -a
# shellcheck source=/dev/null
source "$ENV"
set +a
echo "Add these repository secrets (Actions):"
echo
echo "Name: CRON_SECRET"
echo "Value: ${CRON_SECRET:?CRON_SECRET empty in cron.env}"
echo
echo "Name: MCBULELI_API_URL"
echo "Value: ${MCBULELI_API_URL:-https://mcbuleli.org}"
echo
echo "Then: Actions → Cron scheduled → Run workflow → all-15m"
