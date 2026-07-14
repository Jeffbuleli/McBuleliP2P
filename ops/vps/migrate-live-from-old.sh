#!/usr/bin/env bash
# Migrate Jitsi live.mcbuleli.org from the old VPS (162.35.160.30)
# onto the primary VPS (162.35.181.98).
#
# Run ON THE NEW SERVER as root, after SSH keys can reach the old host.
#
#   export OLD_LIVE_HOST=162.35.160.30
#   export OLD_LIVE_SSH=root@162.35.160.30
#   bash ops/vps/migrate-live-from-old.sh
#
# DNS for live.mcbuleli.org must still point to the OLD IP until step "CUTOVER".
set -euo pipefail

OLD_LIVE_SSH="${OLD_LIVE_SSH:-root@162.35.160.30}"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
SECRET_FILE="/root/.mcbuleli-jitsi-secret"

echo "==> Primary host: $(hostname -I 2>/dev/null || hostname)"
echo "==> Pulling secrets & configs from $OLD_LIVE_SSH"

# 1) JWT / Prosody app secret (must match Render/Web JITSI_JWT_SECRET)
if [[ ! -f "$SECRET_FILE" ]]; then
  ssh "$OLD_LIVE_SSH" "cat /root/.mcbuleli-jitsi-secret 2>/dev/null || true" >"$SECRET_FILE.tmp" || true
  if [[ -s "$SECRET_FILE.tmp" ]]; then
    mv "$SECRET_FILE.tmp" "$SECRET_FILE"
    chmod 600 "$SECRET_FILE"
    echo "    copied $SECRET_FILE"
  else
    rm -f "$SECRET_FILE.tmp"
    echo "WARN: no /root/.mcbuleli-jitsi-secret on old host — copy JITSI_JWT_SECRET manually"
  fi
fi

# 2) Install jitsi-meet if missing
if [[ ! -d /etc/jitsi/meet ]]; then
  echo "==> Install Jitsi Meet for $DOMAIN (interactive debconf may be needed once)"
  echo "    See https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart"
  echo "    Then re-run this script."
  exit 2
fi

# 3) Sync critical config files from old (backup local first)
STAMP="$(date -u +%Y%m%d_%H%M%S)"
BAK="/root/jitsi-pre-migrate-$STAMP"
mkdir -p "$BAK"
cp -a /etc/jitsi "$BAK/" 2>/dev/null || true
cp -a /etc/prosody "$BAK/" 2>/dev/null || true

echo "==> rsync Prosody + Jitsi meet config from old"
rsync -aZ "$OLD_LIVE_SSH:/etc/prosody/conf.d/${DOMAIN}.cfg.lua" /etc/prosody/conf.d/ || true
rsync -aZ "$OLD_LIVE_SSH:/etc/prosody/conf.avail/${DOMAIN}.cfg.lua" /etc/prosody/conf.avail/ || true
rsync -aZ "$OLD_LIVE_SSH:/etc/jitsi/meet/${DOMAIN}-config.js" /etc/jitsi/meet/ || true
rsync -aZ "$OLD_LIVE_SSH:/etc/jitsi/jicofo/" /etc/jitsi/jicofo/ || true
rsync -aZ "$OLD_LIVE_SSH:/usr/share/jitsi-meet/images/mcbuleli"* /usr/share/jitsi-meet/images/ 2>/dev/null || true
rsync -aZ "$OLD_LIVE_SSH:/usr/share/jitsi-meet/css/mcbuleli"* /usr/share/jitsi-meet/css/ 2>/dev/null || true
rsync -aZ "$OLD_LIVE_SSH:/usr/share/jitsi-meet/libs/mcbuleli"* /usr/share/jitsi-meet/libs/ 2>/dev/null || true

# 4) Repo ops + re-apply McBuleli brand / JWT-only baseline
if [[ -d "$REPO/.git" ]]; then
  git -C "$REPO" pull --ff-only || true
else
  git clone --depth 1 "${MCBULELI_REPO_URL:-https://github.com/Jeffbuleli/McBuleliP2P.git}" "$REPO"
fi

export JITSI_DOMAIN="$DOMAIN"
if [[ -f "$SECRET_FILE" ]]; then
  export JITSI_JWT_SECRET="$(tr -d '[:space:]' <"$SECRET_FILE")"
fi

bash "$REPO/ops/jitsi/deploy-live-vps.sh"

echo ""
echo "==> Before DNS cutover — test via Host header / temporary A record:"
echo "    curl -fsSI -H 'Host: $DOMAIN' http://127.0.0.1/ | head"
echo ""
echo "==> CUTOVER when ready:"
echo "    1. Cloudflare DNS: live A → 162.35.181.98 (TTL low)"
echo "    2. certbot --nginx -d $DOMAIN   # if cert missing on new box"
echo "    3. Keep $OLD_LIVE_SSH running 24–48h"
echo "    4. Verify 2-user MUC: sudo bash $REPO/ops/jitsi/audit-muc-fragmentation.sh test-live-mcbuleli"
echo "    5. Decommission 162.35.160.30"
