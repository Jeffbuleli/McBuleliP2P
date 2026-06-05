#!/bin/bash
# Désactive temporairement la redirection live.mcbuleli.org → mcbuleli.org
# pour tester Jitsi en mode natif (pré-join, welcome page).
# Usage (root VPS): bash ops/jitsi/pause-nginx-live-gate.sh
# Réactiver:        bash ops/jitsi/apply-nginx-live-gate.sh
set -euo pipefail

PAUSED_MARKER="mcbuleli-nginx-gate-paused"
GATE_SNIPPET=/etc/nginx/snippets/mcbuleli-live-gate.conf
CONFIG=/etc/jitsi/meet/live.mcbuleli.org-config.js

echo "==> PAUSE gate nginx McBuleli (redirection désactivée)"

mkdir -p /root/nginx-backups
if [[ -f "$GATE_SNIPPET" ]]; then
  cp -a "$GATE_SNIPPET" "/root/nginx-backups/mcbuleli-live-gate.conf.bak.$(date +%Y%m%d%H%M%S)"
fi

cat > "$GATE_SNIPPET" <<EOF
# $PAUSED_MARKER — gate McBuleli en pause (pas de redirect vers mcbuleli.org)
# Comportement Jitsi par défaut du vhost. Réactiver: bash ops/jitsi/apply-nginx-live-gate.sh
EOF

echo "==> Snippet gate vidé (Jitsi natif)"

if [[ -f "$CONFIG" ]]; then
  cp -a "$CONFIG" "/root/nginx-backups/live.mcbuleli.org-config.js.bak.$(date +%Y%m%d%H%M%S)"
  if grep -q 'enableWelcomePage' "$CONFIG"; then
    sed -i 's/enableWelcomePage = false/enableWelcomePage = true/g; s/enableWelcomePage=false/enableWelcomePage=true/g' "$CONFIG"
  else
    echo "config.enableWelcomePage = true;" >> "$CONFIG"
  fi
  if ! grep -q 'mcbuleli-gate-paused-welcome' "$CONFIG"; then
    cat >> "$CONFIG" <<'EOF'

// mcbuleli-gate-paused-welcome — test sans gate nginx
config.enableWelcomePage = true;
config.prejoinPageEnabled = true;
EOF
  fi
  echo "==> enableWelcomePage=true (test Jitsi natif)"
fi

nginx -t
systemctl reload nginx

echo ""
echo "OK — Gate en PAUSE"
echo "  https://live.mcbuleli.org/              → welcome Jitsi (plus de redirect login)"
echo "  https://live.mcbuleli.org/test-live-mcbuleli → Jitsi direct (sans ?jwt= au niveau nginx)"
echo ""
echo "Prosody peut encore exiger un JWT valide pour rejoindre la conférence."
echo "Réactiver la gate: bash ops/jitsi/apply-nginx-live-gate.sh"
