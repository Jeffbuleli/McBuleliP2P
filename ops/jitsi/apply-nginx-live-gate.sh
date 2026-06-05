#!/bin/bash
# Redirige live.mcbuleli.org → mcbuleli.org (login) sauf assets Jitsi + URLs avec ?jwt=
# Usage (root VPS): bash apply-nginx-live-gate.sh
# Version 2 — sauvegardes dans /root/nginx-backups uniquement
set -euo pipefail

SCRIPT_VERSION=2
MARKER="mcbuleli-nginx-gate-v1"
GATE_SNIPPET=/etc/nginx/snippets/mcbuleli-live-gate.conf
MCBULELI_LOGIN="${MCBULELI_LOGIN_URL:-https://mcbuleli.org/login}"

echo "==> apply-nginx-live-gate.sh v${SCRIPT_VERSION}"

# TOUJOURS en premier : nginx charge tout sites-enabled (y compris *.bak)
mkdir -p /root/nginx-backups
shopt -s nullglob
for stale in /etc/nginx/sites-enabled/*.bak*; do
  echo "==> Retire backup de sites-enabled: $stale"
  mv -f "$stale" "/root/nginx-backups/$(basename "$stale")"
done
shopt -u nullglob

find_nginx_vhost() {
  for f in /etc/nginx/sites-enabled/live.mcbuleli.org.conf \
           /etc/nginx/sites-enabled/live.mcbuleli.org \
           /etc/nginx/sites-available/live.mcbuleli.org.conf; do
    [[ -f "$f" ]] && echo "$f" && return 0
  done
  return 1
}

NGINX_VHOST="$(find_nginx_vhost)" || {
  echo "Fichier vhost introuvable. Cherchez:" >&2
  ls -la /etc/nginx/sites-enabled/ >&2
  exit 1
}

echo "==> Vhost: $NGINX_VHOST"
cp -a "$NGINX_VHOST" "/root/nginx-backups/$(basename "$NGINX_VHOST").bak.$(date +%Y%m%d%H%M%S)"

echo "==> Snippet gate (salles + racine uniquement — pas /libs ni /css)"
cat > "$GATE_SNIPPET" <<EOF
# $MARKER — ne pas supprimer
# Racine → login McBuleli (plus de welcome Jitsi)
location = / {
    return 302 ${MCBULELI_LOGIN}?next=/app/academy;
}

# Nom de salle (/lancement-8-juin) sans jwt → login McBuleli (next encodé) ; avec jwt → SPA Jitsi
location ~ ^/([A-Za-z0-9][A-Za-z0-9_-]*)\$ {
    if (\$arg_jwt = "") {
        return 302 ${MCBULELI_LOGIN}?next=%2Fapp%2Flive%2Fenter%3Froom%3D\$1;
    }
    try_files \$uri /index.html;
}
EOF

if grep -q "$MARKER" "$NGINX_VHOST"; then
  echo "==> Gate déjà présent dans $NGINX_VHOST"
else
  # Insérer include après la première ligne server_name du bloc 443
  if grep -q 'include.*mcbuleli-live-gate' "$NGINX_VHOST"; then
    echo "==> include déjà référencé"
  else
    sed -i "/server_name.*live.mcbuleli.org/a\\
    include snippets/mcbuleli-live-gate.conf;" "$NGINX_VHOST"
    echo "==> include snippets/mcbuleli-live-gate.conf ajouté"
  fi
fi

echo "==> Forcer enableWelcomePage=false (Jitsi config)"
CONFIG=/etc/jitsi/meet/live.mcbuleli.org-config.js
if [[ -f "$CONFIG" ]]; then
  if grep -q 'enableWelcomePage' "$CONFIG"; then
    sed -i "s/enableWelcomePage = true/enableWelcomePage = false/g" "$CONFIG"
    sed -i "s/enableWelcomePage=true/enableWelcomePage=false/g" "$CONFIG"
  else
    echo "config.enableWelcomePage = false;" >> "$CONFIG"
  fi
fi

echo "==> Test nginx"
nginx -t

echo "==> Reload"
systemctl reload nginx

echo ""
echo "OK — Tests attendus:"
echo "  curl -sI https://live.mcbuleli.org/ | head -3          → 302 mcbuleli.org"
echo "  curl -sI https://live.mcbuleli.org/une-salle | head -3 → 302 mcbuleli.org"
echo "  Ouvrir un live depuis l'app McBuleli (URL avec ?jwt=)  → salle OK"
