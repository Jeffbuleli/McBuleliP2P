#!/usr/bin/env bash
# Bootstrap McBuleli app + crons on primary VPS 162.35.181.98
# (app + DB + crons; live/Jitsi via migrate-live-from-old.sh).
# Does NOT move DNS — see ops/vps/SERVER.md + docs/vps-migration.md.
#
# Usage (as root):
#   bash ops/vps/install.sh
set -euo pipefail

REPO_URL="${MCBULELI_REPO_URL:-https://github.com/Jeffbuleli/McBuleliP2P.git}"
INSTALL_DIR="${MCBULELI_REPO:-/opt/mcbuleli}"
APP_USER="${MCBULELI_USER:-mcbuleli}"
EXPECTED_IP="${MCBULELI_PRIMARY_IP:-162.35.181.98}"

echo "==> Target primary IP: $EXPECTED_IP (this host: $(hostname -I 2>/dev/null | awk '{print $1}'))"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y docker.io docker-compose-v2 git curl ca-certificates nodejs npm \
  postgresql-client rsync python3-venv python3-pip

id -u "$APP_USER" &>/dev/null || useradd --system --create-home --shell /bin/bash "$APP_USER"
usermod -aG docker "$APP_USER" || true
mkdir -p /var/log/mcbuleli /var/backups/mcbuleli
chown -R "$APP_USER:$APP_USER" /var/log/mcbuleli /var/backups/mcbuleli

if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  echo "==> Cloning $REPO_URL → $INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  echo "==> Repo exists at $INSTALL_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR"

cd "$INSTALL_DIR/ops/vps"
chmod +x backup-db.sh backup-from-render.sh restore-db.sh install.sh migrate-live-from-old.sh 2>/dev/null || true

for f in .env cron.env ai-relay.env; do
  ex="${f}.example"
  [[ -f "$ex" && ! -f "$f" ]] && cp "$ex" "$f" && echo "Created $f — FILL SECRETS"
done

echo "==> AI relay venv"
su - "$APP_USER" -c "
  cd $INSTALL_DIR/services/mcbuleli-ai-trading
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
"

echo "==> systemd ai-relay"
cp "$INSTALL_DIR/ops/vps/mcbuleli-ai-relay.service" /etc/systemd/system/
systemctl daemon-reload
# Do not enable until ai-relay.env is filled:
# systemctl enable --now mcbuleli-ai-relay

echo "==> crontab (as $APP_USER) — enable after cron.env is filled:"
echo "    crontab -u $APP_USER $INSTALL_DIR/ops/vps/crontab"

echo ""
echo "Next:"
echo "  1. Fill $INSTALL_DIR/ops/vps/.env  (from Render Web env)"
echo "  2. Dump Render DB with backup-from-render.sh"
echo "  3. docker compose -f $INSTALL_DIR/ops/vps/docker-compose.yml up -d db"
echo "  4. $INSTALL_DIR/ops/vps/restore-db.sh /path/to.dump"
echo "  5. docker compose up -d web + copy nginx-mcbuleli.conf + certbot"
echo "  6. Fill cron.env + install crontab; enable ai-relay"
echo "  7. Migrate live from 162.35.160.30:"
echo "       bash $INSTALL_DIR/ops/vps/migrate-live-from-old.sh"
echo "  8. DNS cutover — ops/vps/SERVER.md"
echo "  See docs/vps-migration.md"
