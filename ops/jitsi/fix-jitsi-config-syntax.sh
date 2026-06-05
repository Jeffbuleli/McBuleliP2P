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
  echo "==> config.js syntaxe OK (node)"
elif command -v python3 >/dev/null 2>&1; then
  python3 - "$CONFIG" <<'PY'
import pathlib, re, sys
text = pathlib.Path(sys.argv[1]).read_text()
# Ligne enableUserRolesBasedOnToken juste avant }; = config cassé
if re.search(r"config\.enableUserRolesBasedOnToken = true;\n\};", text):
    print("ERREUR: enableUserRolesBasedOnToken encore DANS var config = { }", file=sys.stderr)
    sys.exit(1)
if "config.enableUserRolesBasedOnToken = true;" not in text:
    print("ERREUR: enableUserRolesBasedOnToken absent", file=sys.stderr)
    sys.exit(1)
print("==> config.js structure OK (python3)")
PY
else
  if grep -q 'mcbuleli-jwt-roles' "$CONFIG"; then
    echo "==> marqueur mcbuleli-jwt-roles présent (vérif manuelle)"
  else
    echo "==> installez nodejs ou python3 pour valider: apt install -y nodejs"
  fi
fi

systemctl reload nginx
echo "OK — Rechargez https://live.mcbuleli.org/test-live-mcbuleli (Ctrl+Shift+R)"
