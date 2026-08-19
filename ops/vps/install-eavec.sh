#!/usr/bin/env bash
# Bootstrap e-AVEC on the McBuleli VPS (once).
# Usage (as root): bash ops/vps/install-eavec.sh
set -euo pipefail

REPO_URL="${EAVEC_REPO_URL:-https://github.com/Jeffbuleli/avec.git}"
INSTALL_DIR="${EAVEC_REPO:-/opt/avec}"
MCBULELI_ENV="${MCBULELI_ENV:-/opt/mcbuleli/ops/vps/.env}"

echo "==> Clone e-AVEC → $INSTALL_DIR"
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR/ops/vps"
chmod +x deploy.sh 2>/dev/null || true

if [[ ! -f .env && -f .env.example ]]; then
  cp .env.example .env
  echo "Created ops/vps/.env — fill JWT_SECRET (same as McBuleli)"
fi

if [[ -f "$MCBULELI_ENV" && -f .env ]]; then
  echo "==> Syncing Postgres + JWT from McBuleli .env"
  for key in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB JWT_SECRET CRON_SECRET \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY TURNSTILE_SECRET_KEY \
    PAWAPAY_API_TOKEN PAWAPAY_ENV PAWAPAY_CALLBACK_SECRET \
    KYC_ENABLED DIDIT_API_KEY DIDIT_WORKFLOW_ID DIDIT_WEBHOOK_SECRET \
    WEBAUTHN_RP_ID WEBAUTHN_ORIGIN; do
    val="$(grep -E "^${key}=" "$MCBULELI_ENV" | head -1 | cut -d= -f2- || true)"
    if [[ -n "$val" ]]; then
      if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${val}|" .env
      else
        echo "${key}=${val}" >> .env
      fi
    fi
  done
  # e-AVEC transactional email (independent Resend key + from address).
  for key in RESEND_E_AVEC AUTH_EMAIL_FROM AUTH_EMAIL_REPLY_TO; do
    val="$(grep -E "^${key}=" "$MCBULELI_ENV" | head -1 | cut -d= -f2- || true)"
    if [[ -n "$val" ]]; then
      if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${val}|" .env
      else
        echo "${key}=${val}" >> .env
      fi
    fi
  done
  if ! grep -q "^AUTH_EMAIL_FROM=" .env 2>/dev/null; then
    echo "AUTH_EMAIL_FROM=e-AVEC <noreply@e-avec.org>" >> .env
  fi
fi

echo ""
echo "Next:"
echo "  1. Verify $INSTALL_DIR/ops/vps/.env"
echo "  2. bash $INSTALL_DIR/ops/vps/deploy.sh"
echo "  3. certbot certonly --nginx -d e-avec.org -d www.e-avec.org (if needed)"
echo "  4. Cloudflare: point e-avec.org A → $(hostname -I | awk '{print $1}') — remove africa-insight redirect"
