#!/usr/bin/env bash
# Install Remix IDE privé on McBuleli VPS (localhost:8080 + Nginx template).
# Run as root on VPS: bash ops/vps/install-remix.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REMIX_DIR="${REPO_ROOT}/ops/vps/remix"
NGINX_SRC="${REPO_ROOT}/ops/vps/nginx-remix.conf"
HTPASSWD_FILE="/etc/nginx/.htpasswd-remix"
SITE_AVAILABLE="/etc/nginx/sites-available/remix.mcbuleli.org"
SITE_ENABLED="/etc/nginx/sites-enabled/remix.mcbuleli.org"

echo "==> McBuleli Remix VPS install"
echo "    Repo: ${REPO_ROOT}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker required. Install Docker first (ops/vps/install.sh)."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin required."
  exit 1
fi

echo "==> Start Remix container (127.0.0.1:8080)"
cd "${REMIX_DIR}"
docker compose pull
docker compose up -d

echo "==> Wait for Remix HTTP..."
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:8080/" 2>/dev/null; then
    echo "    Remix up on localhost:8080"
    break
  fi
  sleep 1
  if [[ "$i" -eq 30 ]]; then
    echo "Remix did not respond on :8080 — check: docker logs mcbuleli-remix"
    exit 1
  fi
done

if [[ ! -f "${HTPASSWD_FILE}" ]]; then
  echo "==> Create Basic Auth user for remix.mcbuleli.org"
  if ! command -v htpasswd >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq apache2-utils >/dev/null
  fi
  read -r -p "Remix username [ops]: " REMIX_USER
  REMIX_USER="${REMIX_USER:-ops}"
  htpasswd -c "${HTPASSWD_FILE}" "${REMIX_USER}"
  chmod 640 "${HTPASSWD_FILE}"
  chown root:www-data "${HTPASSWD_FILE}" 2>/dev/null || true
else
  echo "==> Auth file exists: ${HTPASSWD_FILE}"
fi

if [[ -d /etc/nginx/sites-available ]]; then
  echo "==> Install Nginx site template"
  cp "${NGINX_SRC}" "${SITE_AVAILABLE}"
  ln -sfn "${SITE_AVAILABLE}" "${SITE_ENABLED}"
  nginx -t
  systemctl reload nginx
  echo "    Nginx reloaded."
  echo ""
  echo "DNS: add A record remix.mcbuleli.org → this VPS IP"
  echo "TLS: certbot certonly --nginx -d remix.mcbuleli.org"
  echo "     (or include remix in existing SAN cert, then update ssl_certificate paths)"
else
  echo "Nginx sites-available not found — copy ${NGINX_SRC} manually."
fi

echo ""
echo "Done."
echo "  Local smoke: curl -I http://127.0.0.1:8080/"
echo "  Public URL (after DNS+TLS): https://remix.mcbuleli.org"
echo "  MetaMask: open Remix in browser with MetaMask → Deploy → Injected Provider"
echo "  Doc: docs/mcb-remix-vps.md"
