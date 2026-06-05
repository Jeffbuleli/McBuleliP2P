#!/bin/bash
# Corrige config.js cassé par apply-jitsi-jwt.sh (ligne insérée DANS var config = { }).
# Symptôme : écran noir sur toutes les salles — node --check config.js → SyntaxError.
# Usage (root VPS): bash ops/jitsi/fix-jitsi-config-syntax.sh
set -euo pipefail

CONFIG="${JITSI_MEET_CONFIG:-/etc/jitsi/meet/live.mcbuleli.org-config.js}"

if [[ ! -f "$CONFIG" ]]; then
  echo "Config introuvable: $CONFIG" >&2
  exit 1
fi

cp -a "$CONFIG" "/root/nginx-backups/$(basename "$CONFIG").syntax-fix.$(date +%Y%m%d%H%M%S)"

# Retirer toute ligne enableUserRolesBasedOnToken mal placée (avant le }; du var config)
sed -i '/^config\.enableUserRolesBasedOnToken = true;$/d' "$CONFIG"

# Ré-appliquer APRÈS la fermeture de l'objet config (fin de fichier = sûr)
if ! grep -q 'enableUserRolesBasedOnToken' "$CONFIG"; then
  cat >> "$CONFIG" <<'EOF'

// mcbuleli-jwt-roles — après var config = { }; (ne pas insérer dans l'objet)
config.enableUserRolesBasedOnToken = true;
EOF
fi

if command -v node >/dev/null 2>&1; then
  node --check "$CONFIG"
  echo "==> config.js syntaxe OK"
else
  echo "==> node absent — vérifiez manuellement: node --check $CONFIG"
fi

systemctl reload nginx
echo "OK — Rechargez https://live.mcbuleli.org/test-live-mcbuleli (Ctrl+Shift+R)"
