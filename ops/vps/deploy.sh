#!/usr/bin/env bash
# Deploy McBuleli web from GitHub → VPS (git only — never rsync from a laptop).
#
# Usage on the VPS:
#   bash /opt/mcbuleli/ops/vps/deploy.sh
#   bash /opt/mcbuleli/ops/vps/deploy.sh --ref abc1234
#   bash /opt/mcbuleli/ops/vps/deploy.sh --skip-build   # restart only (hackathon day)
#
# Team: local → PR → merge main → this script (or GitHub Action Deploy VPS).
set -euo pipefail

REPO_DIR="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="$REPO_DIR/ops/vps"
BRANCH="${MCBULELI_DEPLOY_BRANCH:-main}"
LOCK_FILE="/var/run/mcbuleli-deploy.lock"
REF=""
SKIP_BUILD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref)
      REF="${2:?usage: deploy.sh [--ref <sha|tag>] [--skip-build]}"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    *)
      echo "ERROR: unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "ERROR: another deploy is running (lock $LOCK_FILE)" >&2
  exit 1
fi

kill_stale_builds() {
  if pgrep -f "docker compose build" >/dev/null 2>&1; then
    echo "WARN: killing stale docker compose build"
    pkill -f "docker compose build" || true
    pkill -f "docker-compose compose build" || true
    sleep 3
  fi
  if pgrep -f "node /app/node_modules/.bin/next build" >/dev/null 2>&1; then
    echo "WARN: killing stale next build"
    pkill -f "node /app/node_modules/.bin/next build" || true
    sleep 2
  fi
}

cd "$REPO_DIR"
if [[ ! -d .git ]]; then
  echo "ERROR: $REPO_DIR is not a git checkout. Clone from GitHub first." >&2
  exit 1
fi

echo "==> Fetching origin"
git fetch --prune origin

if [[ -n "$REF" ]]; then
  echo "==> Detach at $REF"
  git checkout --detach "$REF"
else
  echo "==> Reset $BRANCH to origin/$BRANCH"
  git checkout -B "$BRANCH" "origin/$BRANCH"
fi

echo "==> HEAD $(git rev-parse --short HEAD) — $(git log -1 --oneline)"
cd "$COMPOSE_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: missing $COMPOSE_DIR/.env (secrets stay on the server only)." >&2
  exit 1
fi

chmod +x "$REPO_DIR/ops/vps/"*.sh 2>/dev/null || true

kill_stale_builds
if [[ -f /proc/meminfo ]]; then
  avail_kb="$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)"
  echo "==> MemAvailable ${avail_kb} KiB"
  if [[ "$avail_kb" -lt 350000 && "$SKIP_BUILD" -eq 0 ]]; then
    echo "WARN: low RAM — use deploy.sh --skip-build or recover-web.sh first" >&2
  fi
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "==> Building web image"
  docker compose build web
else
  echo "==> Skipping build (--skip-build)"
fi

echo "==> Restarting web"
docker compose stop web 2>/dev/null || true
sleep 2
docker compose rm -f web 2>/dev/null || true
docker rm -f mcbuleli-web-1 2>/dev/null || true
sleep 1
docker compose up -d web
sleep 3
curl -fsS -o /dev/null -w "health_http=%{http_code}\n" "http://127.0.0.1:3000/login" || {
  echo "WARN: web not responding on :3000 yet — check: docker compose logs -f web" >&2
}
echo "DEPLOY_OK $(git -C "$REPO_DIR" rev-parse --short HEAD)"
