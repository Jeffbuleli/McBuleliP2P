#!/bin/bash
# Branding complet McBuleli sur live.mcbuleli.org (logo rond, favicon, textes, CSS).
# Usage : bash ops/jitsi/apply-mcbuleli-brand.sh
set -euo pipefail

JITSI_ROOT=/usr/share/jitsi-meet
JITSI_IMAGES="$JITSI_ROOT/images"
JITSI_CSS="$JITSI_ROOT/css"
JITSI_LANG="$JITSI_ROOT/lang"
CONFIG=/etc/jitsi/meet/live.mcbuleli.org-config.js
LOGO_URL="${MCBULELI_LOGO_URL:-/images/mcbuleli-meet-logo.png}"
MARKER="mcbuleli-full-brand-v4"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="McBuleli"
MEET_LOGO_SRC="$SCRIPT_DIR/../../public/brand/mcbuleli-meet-logo.png"
if [[ ! -f "$MEET_LOGO_SRC" && -f "$SCRIPT_DIR/../../public/brand/logo-256.png" ]]; then
  MEET_LOGO_SRC="$SCRIPT_DIR/../../public/brand/logo-256.png"
fi
if [[ ! -f "$MEET_LOGO_SRC" ]]; then
  MEET_LOGO_SRC="$SCRIPT_DIR/mcbuleli-meet-logo.png"
fi

echo "==> Logo McBuleli (watermark transparent coin vidéo)"
if [[ -f "$JITSI_IMAGES/watermark.svg" && ! -f "$JITSI_IMAGES/watermark.svg.bak" ]]; then
  cp -a "$JITSI_IMAGES/watermark.svg" "$JITSI_IMAGES/watermark.svg.bak"
fi
if [[ -f "$MEET_LOGO_SRC" ]]; then
  cp -a "$MEET_LOGO_SRC" "$JITSI_IMAGES/mcbuleli-meet-logo.png"
  cp -a "$MEET_LOGO_SRC" "$JITSI_IMAGES/mcbuleli-logo.png"
else
  curl -fsSL "${MCBULELI_LOGO_REMOTE:-https://mcbuleli.org/brand/mcbuleli-meet-logo.png}" \
    -o "$JITSI_IMAGES/mcbuleli-meet-logo.png"
  cp -a "$JITSI_IMAGES/mcbuleli-meet-logo.png" "$JITSI_IMAGES/mcbuleli-logo.png"
fi

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
python3 "$SCRIPT_DIR/make-round-logo.py" "$JITSI_IMAGES/mcbuleli-meet-logo.png" "$JITSI_IMAGES/mcbuleli-favicon.png" 64 2>/dev/null || \
  cp "$JITSI_IMAGES/mcbuleli-round.png" "$JITSI_IMAGES/mcbuleli-favicon.png"

echo "==> Watermark coin vidéo (depuis mcbuleli.org ou repo)"
WATERMARK_SRC="$SCRIPT_DIR/../../public/brand/mcbuleli-meet-watermark.png"
if [[ -f "$WATERMARK_SRC" ]]; then
  cp -a "$WATERMARK_SRC" "$JITSI_IMAGES/mcbuleli-meet-watermark.png"
elif curl -fsSL "https://mcbuleli.org/brand/mcbuleli-meet-watermark.png" -o "$JITSI_IMAGES/mcbuleli-meet-watermark.png"; then
  echo "    watermark depuis mcbuleli.org"
else
  python3 "$SCRIPT_DIR/make-transparent-logo.py" "$JITSI_IMAGES/mcbuleli-meet-logo.png" "$JITSI_IMAGES/mcbuleli-meet-watermark.png" 72 2>/dev/null || \
    cp "$JITSI_IMAGES/mcbuleli-meet-logo.png" "$JITSI_IMAGES/mcbuleli-meet-watermark.png"
fi

cp "$SCRIPT_DIR/mcbuleli-watermark.svg" "$JITSI_IMAGES/watermark.svg"
cp "$SCRIPT_DIR/mcbuleli-custom.css" "$JITSI_CSS/mcbuleli-custom.css"
cp "$JITSI_IMAGES/mcbuleli-meet-watermark.png" "$JITSI_IMAGES/watermark.png" 2>/dev/null || true

echo "==> Favicon navigateur (onglet)"
for html in "$JITSI_ROOT/index.html" "$JITSI_ROOT/static.html" "$JITSI_ROOT/title.html"; do
  [[ -f "$html" ]] || continue
  if ! grep -q 'mcbuleli-favicon' "$html"; then
    sed -i 's|favicon.ico|mcbuleli-favicon.png|g; s|images/favicon|images/mcbuleli-favicon|g' "$html" 2>/dev/null || true
    sed -i "s|Jitsi Meet|$APP_NAME|g; s|jitsi meet|$APP_NAME|gi" "$html" 2>/dev/null || true
    sed -i "s|<title>.*</title>|<title>$APP_NAME</title>|" "$html" 2>/dev/null || true
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
# Toujours pointer vers le logo Meet sur ce serveur
sed -i "s|defaultLogoUrl = '[^']*'|defaultLogoUrl = '/images/mcbuleli-meet-logo.png'|g" "$CONFIG" 2>/dev/null || true
sed -i "s|DEFAULT_LOGO_URL = '[^']*'|DEFAULT_LOGO_URL = '/images/mcbuleli-meet-logo.png'|g" "$CONFIG" 2>/dev/null || true
sed -i "s|APP_NAME = '[^']*'|APP_NAME = 'McBuleli'|g" "$CONFIG" 2>/dev/null || true
sed -i "s|NATIVE_APP_NAME = '[^']*'|NATIVE_APP_NAME = 'McBuleli'|g" "$CONFIG" 2>/dev/null || true
sed -i 's|SHOW_JITSI_WATERMARK = false|SHOW_JITSI_WATERMARK = true|g' "$CONFIG" 2>/dev/null || true
sed -i 's|SHOW_WATERMARK_FOR_GUESTS = false|SHOW_WATERMARK_FOR_GUESTS = true|g' "$CONFIG" 2>/dev/null || true
# Toujours désactiver la welcome page (même si le marker existe déjà)
if grep -q 'enableWelcomePage' "$CONFIG"; then
  sed -i 's/enableWelcomePage = true/enableWelcomePage = false/g; s/enableWelcomePage=true/enableWelcomePage=false/g' "$CONFIG"
else
  echo "config.enableWelcomePage = false;" >> "$CONFIG"
fi

echo "==> Pré-join (salle d'attente + micro/caméra comme meet.jit.si)"
if grep -q 'prejoinPageEnabled' "$CONFIG"; then
  sed -i 's/prejoinPageEnabled = false/prejoinPageEnabled = true/g; s/prejoinPageEnabled=false/prejoinPageEnabled=true/g' "$CONFIG"
else
  echo "config.prejoinPageEnabled = true;" >> "$CONFIG"
fi
if ! grep -q 'mcbuleli-prejoin-defaults' "$CONFIG"; then
  cat >> "$CONFIG" <<'EOF'

// mcbuleli-prejoin-defaults — filet si le hash #config est absent (redirect nginx)
config.prejoinPageEnabled = true;
config.startWithAudioMuted = false;
config.startWithVideoMuted = true;
config.requireDisplayName = true;
config.disableThirdPartyRequests = false;
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.DEFAULT_BACKGROUND = '#f4f6f4';
EOF
fi

echo "==> Corriger fond sombre + requêtes tierces (README manuel)"
sed -i 's/disableThirdPartyRequests = true/disableThirdPartyRequests = false/g' "$CONFIG" 2>/dev/null || true
sed -i "s|DEFAULT_BACKGROUND = '#1a2e1c'|DEFAULT_BACKGROUND = '#f4f6f4'|g" "$CONFIG" 2>/dev/null || true
sed -i "s|DEFAULT_BACKGROUND = '#040404'|DEFAULT_BACKGROUND = '#f4f6f4'|g" "$CONFIG" 2>/dev/null || true

if ! grep -q "$MARKER" "$CONFIG"; then
  cat >> "$CONFIG" <<EOF

// $MARKER
config.defaultLanguage = 'fr';
config.defaultLogoUrl = '$LOGO_URL';
config.subject = 'McBuleli';
config.enableWelcomePage = false;
config.disableDeepLinking = true;
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.APP_NAME = '$APP_NAME';
config.interfaceConfig.NATIVE_APP_NAME = '$APP_NAME';
config.interfaceConfig.PROVIDER_NAME = 'McBuleli';
config.interfaceConfig.DEFAULT_LOGO_URL = '$LOGO_URL';
config.interfaceConfig.SHOW_JITSI_WATERMARK = true;
config.interfaceConfig.SHOW_WATERMARK_FOR_GUESTS = true;
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

for js in mcbuleli-hide-thankyou.js mcbuleli-live-title.js mcbuleli-prejoin-brand.js; do
  cp "$SCRIPT_DIR/$js" "$JITSI_ROOT/$js"
  if [[ -f "$JITSI_ROOT/index.html" ]] && ! grep -q "$js" "$JITSI_ROOT/index.html"; then
    sed -i "s|</body>|<script src=\"/$js\"></script>\n</body>|" "$JITSI_ROOT/index.html"
  fi
done

echo "==> Redémarrage"
systemctl restart prosody jicofo jitsi-videobridge2
systemctl reload nginx

echo "OK — Titre attendu : « Soirée de lancement | McBuleli ». Watermark coin vidéo sans fond."
