#!/bin/bash
# Remplace le watermark Jitsi par le logo McBuleli (transparent, coin).
# Usage sur le VPS : bash apply-mcbuleli-watermark.sh
set -euo pipefail

JITSI_IMAGES=/usr/share/jitsi-meet/images
JITSI_CSS=/usr/share/jitsi-meet/css
CONFIG=/etc/jitsi/meet/live.mcbuleli.org-config.js
LOGO_URL="${MCBULELI_LOGO_URL:-https://mcbuleli.org/brand/logo-256.png}"
MARKER="mcbuleli-logo-watermark-v1"

echo "==> Backup watermark Jitsi"
if [[ -f "$JITSI_IMAGES/watermark.svg" && ! -f "$JITSI_IMAGES/watermark.svg.bak" ]]; then
  cp -a "$JITSI_IMAGES/watermark.svg" "$JITSI_IMAGES/watermark.svg.bak"
fi

echo "==> Téléchargement logo McBuleli"
curl -fsSL "$LOGO_URL" -o "$JITSI_IMAGES/mcbuleli-logo.png"

echo "==> Installation watermark.svg McBuleli"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/mcbuleli-watermark.svg" ]]; then
  cp "$SCRIPT_DIR/mcbuleli-watermark.svg" "$JITSI_IMAGES/watermark.svg"
else
  cat > "$JITSI_IMAGES/watermark.svg" <<'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="72" height="32" viewBox="0 0 72 32">
  <image xlink:href="/images/mcbuleli-logo.png" x="0" y="2" width="28" height="28" opacity="0.38"/>
</svg>
SVGEOF
fi

echo "==> CSS custom McBuleli"
mkdir -p "$JITSI_CSS"
if [[ -f "$SCRIPT_DIR/mcbuleli-custom.css" ]]; then
  cp "$SCRIPT_DIR/mcbuleli-custom.css" "$JITSI_CSS/mcbuleli-custom.css"
else
  echo ".watermark{opacity:.38!important;max-width:88px!important;top:10px!important;left:10px!important}" \
    > "$JITSI_CSS/mcbuleli-custom.css"
fi

echo "==> Config live.mcbuleli.org"
if [[ ! -f "$CONFIG" ]]; then
  echo "Fichier introuvable: $CONFIG" >&2
  exit 1
fi

if ! grep -q "$MARKER" "$CONFIG"; then
  cat >> "$CONFIG" <<EOF

// $MARKER
config.defaultLogoUrl = '$LOGO_URL';
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.DEFAULT_LOGO_URL = '$LOGO_URL';
config.interfaceConfig.SHOW_JITSI_WATERMARK = false;
config.interfaceConfig.SHOW_WATERMARK_FOR_GUESTS = false;
config.interfaceConfig.SHOW_BRAND_WATERMARK = false;
config.interfaceConfig.JITSI_WATERMARK_LINK = '';
config.customParticipantLabelCssUrl = '/css/mcbuleli-custom.css';
EOF
fi

echo "==> Redémarrage services Jitsi"
systemctl restart prosody jicofo jitsi-videobridge2
systemctl reload nginx

echo "OK — Ouvrez https://live.mcbuleli.org/une-salle-test (Ctrl+Shift+R pour vider le cache)"
