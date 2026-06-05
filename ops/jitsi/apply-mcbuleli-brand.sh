#!/bin/bash
# Branding complet McBuleli sur live.mcbuleli.org (logo rond, favicon, textes, CSS).
# Usage : bash ops/jitsi/apply-mcbuleli-brand.sh
set -euo pipefail

JITSI_ROOT=/usr/share/jitsi-meet
JITSI_IMAGES="$JITSI_ROOT/images"
JITSI_CSS="$JITSI_ROOT/css"
JITSI_LANG="$JITSI_ROOT/lang"
CONFIG=/etc/jitsi/meet/live.mcbuleli.org-config.js
LOGO_URL="${MCBULELI_LOGO_URL:-https://mcbuleli.org/brand/logo-256.png}"
MARKER="mcbuleli-full-brand-v2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="McBuleli Meet"

echo "==> Logo & watermark rond"
if [[ -f "$JITSI_IMAGES/watermark.svg" && ! -f "$JITSI_IMAGES/watermark.svg.bak" ]]; then
  cp -a "$JITSI_IMAGES/watermark.svg" "$JITSI_IMAGES/watermark.svg.bak"
fi
curl -fsSL "$LOGO_URL" -o "$JITSI_IMAGES/mcbuleli-logo.png"

echo "==> Logo rond (PNG)"
ROUND_OK=0
if python3 "$SCRIPT_DIR/make-round-logo.py" "$JITSI_IMAGES/mcbuleli-logo.png" "$JITSI_IMAGES/mcbuleli-round.png" 72; then
  ROUND_OK=1
elif command -v convert >/dev/null 2>&1; then
  convert "$JITSI_IMAGES/mcbuleli-logo.png" -resize 72x72^ -gravity center -extent 72x72 \
    \( +clone -threshold -1 -negate -fill white -draw "circle 36,36 36,0" \) \
    -alpha off -compose copy_opacity -composite "$JITSI_IMAGES/mcbuleli-round.png"
  ROUND_OK=1
fi
if [[ "$ROUND_OK" -eq 0 ]]; then
  cp "$JITSI_IMAGES/mcbuleli-logo.png" "$JITSI_IMAGES/mcbuleli-round.png"
  echo "    (pillow/convert absents — logo carré; installez: apt install -y python3-pil.imaging)"
fi

cp "$JITSI_IMAGES/mcbuleli-round.png" "$JITSI_IMAGES/mcbuleli-favicon.png"
if [[ -f "$SCRIPT_DIR/mcbuleli-favicon.png" ]]; then
  python3 "$SCRIPT_DIR/make-round-logo.py" "$SCRIPT_DIR/mcbuleli-favicon.png" "$JITSI_IMAGES/mcbuleli-favicon.png" 64 2>/dev/null || \
    cp "$SCRIPT_DIR/mcbuleli-favicon.png" "$JITSI_IMAGES/mcbuleli-favicon.png"
fi

cp "$SCRIPT_DIR/mcbuleli-watermark.svg" "$JITSI_IMAGES/watermark.svg"
cp "$SCRIPT_DIR/mcbuleli-custom.css" "$JITSI_CSS/mcbuleli-custom.css"
# Certaines versions Jitsi lisent aussi watermark.png
cp "$JITSI_IMAGES/mcbuleli-round.png" "$JITSI_IMAGES/watermark.png" 2>/dev/null || true

echo "==> Favicon navigateur (onglet)"
for html in "$JITSI_ROOT/index.html" "$JITSI_ROOT/static.html" "$JITSI_ROOT/title.html"; do
  [[ -f "$html" ]] || continue
  if ! grep -q 'mcbuleli-favicon' "$html"; then
    sed -i 's|favicon.ico|mcbuleli-favicon.png|g; s|images/favicon|images/mcbuleli-favicon|g' "$html" 2>/dev/null || true
    sed -i "s|Jitsi Meet|$APP_NAME|g; s|jitsi meet|$APP_NAME|gi" "$html" 2>/dev/null || true
  fi
done
# Lien favicon explicite si absent
if [[ -f "$JITSI_ROOT/index.html" ]] && ! grep -q 'mcbuleli-favicon.png' "$JITSI_ROOT/index.html"; then
  sed -i 's|</head>|<link rel="icon" type="image/png" href="/images/mcbuleli-favicon.png" />\n</head>|' "$JITSI_ROOT/index.html"
fi

echo "==> Traductions (notifications, titres)"
if command -v python3 >/dev/null; then
  python3 "$SCRIPT_DIR/patch-jitsi-lang.py" "$JITSI_LANG"
else
  echo "python3 absent — sed minimal sur thankYou"
  sed -i 's/Thank you for using Jitsi Meet/Thank you for using McBuleli Academy Live/g' "$JITSI_LANG/main.json" 2>/dev/null || true
  sed -i "s/Merci d'avoir utilisé {{appName}}/Merci d'avoir utilisé McBuleli Academy Live/g" "$JITSI_LANG/main-fr.json" 2>/dev/null || true
fi

echo "==> Config JS"
if [[ ! -f "$CONFIG" ]]; then
  echo "Config introuvable: $CONFIG" >&2
  exit 1
fi
# Toujours désactiver la welcome page (même si le marker existe déjà)
if grep -q 'enableWelcomePage' "$CONFIG"; then
  sed -i 's/enableWelcomePage = true/enableWelcomePage = false/g; s/enableWelcomePage=true/enableWelcomePage=false/g' "$CONFIG"
else
  echo "config.enableWelcomePage = false;" >> "$CONFIG"
fi

if ! grep -q "$MARKER" "$CONFIG"; then
  cat >> "$CONFIG" <<EOF

// $MARKER
config.defaultLanguage = 'fr';
config.defaultLogoUrl = '$LOGO_URL';
config.enableWelcomePage = false;
config.disableDeepLinking = true;
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.APP_NAME = '$APP_NAME';
config.interfaceConfig.NATIVE_APP_NAME = '$APP_NAME';
config.interfaceConfig.PROVIDER_NAME = 'McBuleli';
config.interfaceConfig.DEFAULT_LOGO_URL = '$LOGO_URL';
config.interfaceConfig.SHOW_JITSI_WATERMARK = false;
config.interfaceConfig.SHOW_WATERMARK_FOR_GUESTS = false;
config.interfaceConfig.SHOW_BRAND_WATERMARK = false;
config.interfaceConfig.SHOW_POWERED_BY = false;
config.interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE = false;
config.interfaceConfig.MOBILE_APP_PROMO = false;
config.interfaceConfig.JITSI_WATERMARK_LINK = '';
config.customParticipantLabelCssUrl = '/css/mcbuleli-custom.css';
EOF
fi

# Charger CSS sur toutes les pages
if [[ -f "$JITSI_ROOT/index.html" ]] && ! grep -q 'mcbuleli-custom.css' "$JITSI_ROOT/index.html"; then
  sed -i 's|</head>|<link rel="stylesheet" href="/css/mcbuleli-custom.css" />\n</head>|' "$JITSI_ROOT/index.html"
fi

echo "==> Masquer toast « Thank you / Merci » en fin de live"
if ! grep -q 'mcbuleli-disable-thankyou' "$CONFIG"; then
  cat >> "$CONFIG" <<'EOF'

// mcbuleli-disable-thankyou
config.feedbackPercentage = 0;
config.disabledNotifications = config.disabledNotifications || [];
if (config.disabledNotifications.indexOf('thankYou') === -1) {
    config.disabledNotifications.push('thankYou');
}
EOF
fi

cp "$SCRIPT_DIR/mcbuleli-hide-thankyou.js" "$JITSI_ROOT/mcbuleli-hide-thankyou.js"
if [[ -f "$JITSI_ROOT/index.html" ]] && ! grep -q 'mcbuleli-hide-thankyou.js' "$JITSI_ROOT/index.html"; then
  sed -i 's|</body>|<script src="/mcbuleli-hide-thankyou.js"></script>\n</body>|' "$JITSI_ROOT/index.html"
fi

echo "==> Redémarrage"
systemctl restart prosody jicofo jitsi-videobridge2
systemctl reload nginx

echo "OK — Test : https://live.mcbuleli.org/test (Ctrl+Shift+R). Favicon + toast McBuleli."
