#!/bin/bash
# Redirige live.mcbuleli.org → mcbuleli.org (login) sauf assets Jitsi + URLs avec ?jwt=
# Usage (root VPS): bash apply-nginx-live-gate.sh
# Pause (test Jitsi natif): bash pause-nginx-live-gate.sh
#   ou MCBULELI_LIVE_GATE_ENABLED=false bash apply-nginx-live-gate.sh
# Version 2 — sauvegardes dans /root/nginx-backups uniquement
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GATE_ENABLED="${MCBULELI_LIVE_GATE_ENABLED:-true}"
if [[ "$GATE_ENABLED" == "false" || "$GATE_ENABLED" == "0" ]]; then
  exec bash "$SCRIPT_DIR/pause-nginx-live-gate.sh"
fi

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

GATE_INCLUDES="$(grep -c 'include snippets/mcbuleli-live-gate.conf;' "$NGINX_VHOST" 2>/dev/null || echo 0)"
if [[ "$GATE_INCLUDES" -gt 1 ]]; then
  echo "==> Déduplication include gate ($GATE_INCLUDES → 1)"
  sed -i '/include snippets\/mcbuleli-live-gate.conf;/d' "$NGINX_VHOST"
  GATE_INCLUDES=0
fi
if [[ "$GATE_INCLUDES" -eq 0 ]]; then
  sed -i "0,/server_name.*live.mcbuleli.org/{
    /server_name.*live.mcbuleli.org/a\\
    include snippets/mcbuleli-live-gate.conf;
  }" "$NGINX_VHOST"
  echo "==> include snippets/mcbuleli-live-gate.conf ajouté (une fois)"
else
  echo "==> include gate déjà présent"
fi

echo "==> Réactiver gate — désactiver welcome page + retirer overrides pause"
CONFIG=/etc/jitsi/meet/live.mcbuleli.org-config.js
if [[ -f "$CONFIG" ]]; then
  if grep -q 'enableWelcomePage' "$CONFIG"; then
    sed -i "s/enableWelcomePage = true/enableWelcomePage = false/g" "$CONFIG"
    sed -i "s/enableWelcomePage=true/enableWelcomePage=false/g" "$CONFIG"
  else
    echo "config.enableWelcomePage = false;" >> "$CONFIG"
  fi
  if ! grep -q 'mcbuleli-gate-active' "$CONFIG"; then
    cat >> "$CONFIG" <<'EOF'

// mcbuleli-gate-active — redirection McBuleli réactivée (plus de mode pause)
config.enableWelcomePage = false;
EOF
  fi
fi

echo "==> Test nginx"
nginx -t

echo "==> Reload"
systemctl reload nginx

echo "==> Snippet gate (aperçu)"
head -8 "$GATE_SNIPPET"

verify_gate() {
  local url="$1"
  local label="$2"
  local code
  code="$(curl -sI -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")"
  echo "    $label → HTTP $code"
  [[ "$code" == "302" ]]
}

echo ""
echo "==> Vérification gate (doit être 302 sans jwt)"
GATE_OK=1
verify_gate "https://live.mcbuleli.org/" "racine /" || GATE_OK=0
verify_gate "https://live.mcbuleli.org/test-live-mcbuleli" "salle sans jwt" || GATE_OK=0
ROOM_WITH_JWT="$(curl -sI -o /dev/null -w '%{http_code}' 'https://live.mcbuleli.org/test-live-mcbuleli?jwt=test' 2>/dev/null || echo 000)"
echo "    salle avec jwt → HTTP $ROOM_WITH_JWT (attendu 200)"

if [[ "$GATE_OK" -ne 1 ]]; then
  echo "" >&2
  echo "ERREUR: la gate ne répond pas en 302." >&2
  echo "  1) Vérifiez: grep mcbuleli-live-gate $NGINX_VHOST" >&2
  echo "  2) Snippet:   cat $GATE_SNIPPET" >&2
  echo "  3) Puis:      nginx -t && systemctl reload nginx" >&2
  exit 1
fi

echo ""
echo "OK — Gate active. Live depuis l'app McBuleli (URL avec ?jwt=) → pré-join OK."
