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
WATERMARK_URL="/images/watermark.png"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
IFACE_CONFIG="/etc/jitsi/meet/${DOMAIN}-interface_config.js"
MARKER="mcbuleli-full-brand-v10"
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

echo "==> Watermark coin vidéo (PNG transparent 96px — jamais la source JPEG brute)"
WM_REPO="$SCRIPT_DIR/../../public/brand/mcbuleli-meet-watermark.png"
WM_RAW="$SCRIPT_DIR/../../public/brand/mcbuleli-meet-watermark-source.png"
WM_BUILD="$JITSI_IMAGES/.mcbuleli-watermark-build.png"
WM_OK=0
# 1) Prefère le PNG déjà généré dans le repo (évite le fond noir 1024×682 en live)
if [[ -f "$WM_REPO" ]]; then
  cp -a "$WM_REPO" "$WM_BUILD"
  WM_OK=1
  echo "    source: public/brand/mcbuleli-meet-watermark.png"
fi
# 2) Sinon régénère depuis la source (Pillow)
if [[ "$WM_OK" -eq 0 ]]; then
  if [[ ! -f "$WM_RAW" ]]; then
    curl -fsSL "https://mcbuleli.org/brand/mcbuleli-meet-watermark-source.png" -o "$WM_RAW" || true
  fi
  if [[ -f "$WM_RAW" ]] && command -v python3 >/dev/null; then
    PYTHONPATH="${SCRIPT_DIR}/../../.tmp/pillow-lib:${PYTHONPATH:-}"
    if python3 "$SCRIPT_DIR/make-meet-watermark.py" "$WM_RAW" "$WM_BUILD" 96 2>/dev/null \
      || python3 "$SCRIPT_DIR/make-meet-watermark.py" "$WM_RAW" "$WM_BUILD" 96; then
      WM_OK=1
      echo "    source: regenerated via make-meet-watermark.py"
    fi
  fi
fi
# 3) Dernier recours: logo Meet circulaire (pas la JPEG source)
if [[ "$WM_OK" -eq 0 ]]; then
  if [[ -f "$JITSI_IMAGES/mcbuleli-meet-logo.png" ]]; then
    cp -a "$JITSI_IMAGES/mcbuleli-meet-logo.png" "$WM_BUILD"
    echo "    fallback: mcbuleli-meet-logo.png (installez python3-pil pour le watermark transparent)"
  else
    echo "ERREUR: aucun watermark McBuleli disponible" >&2
    exit 1
  fi
fi
cp -a "$WM_BUILD" "$JITSI_IMAGES/watermark.png"
cp -a "$WM_BUILD" "$JITSI_IMAGES/mcbuleli-meet-watermark.png"
# Ne jamais laisser la JPEG source se faire servir comme watermark
rm -f "$JITSI_IMAGES/mcbuleli-meet-watermark-source.png" 2>/dev/null || true
cp -a "$SCRIPT_DIR/mcbuleli-custom.css" "$JITSI_CSS/mcbuleli-custom.css"

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

echo "==> Corriger syntaxe config.js (écran noir si JWT mal injecté)"
JITSI_MEET_CONFIG="$CONFIG" bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh" || true
# Watermark coin vidéo — PNG transparent (traits blancs uniquement)
sed -i \
  -e "s|defaultLogoUrl = '[^']*'|defaultLogoUrl = '${WATERMARK_URL}'|g" \
  -e "s|DEFAULT_LOGO_URL = '[^']*'|DEFAULT_LOGO_URL = '${WATERMARK_URL}'|g" \
  -e "s|/images/watermark.svg|${WATERMARK_URL}|g" \
  -e "s|/images/mcbuleli-meet-watermark.png|${WATERMARK_URL}|g" \
  "$CONFIG" 2>/dev/null || true
sed -i "s|APP_NAME = '[^']*'|APP_NAME = 'McBuleli'|g" "$CONFIG" 2>/dev/null || true
sed -i "s|NATIVE_APP_NAME = '[^']*'|NATIVE_APP_NAME = 'McBuleli'|g" "$CONFIG" 2>/dev/null || true
sed -i 's|SHOW_JITSI_WATERMARK = false|SHOW_JITSI_WATERMARK = true|g' "$CONFIG" 2>/dev/null || true
sed -i 's|SHOW_WATERMARK_FOR_GUESTS = false|SHOW_WATERMARK_FOR_GUESTS = true|g' "$CONFIG" 2>/dev/null || true

echo "==> interface_config.js (obligatoire — .leftwatermark lit ce fichier)"
for ICFG in "$JITSI_ROOT/interface_config.js" "$IFACE_CONFIG"; do
  [[ -f "$ICFG" ]] || continue
  if command -v python3 >/dev/null; then
    python3 "$SCRIPT_DIR/patch-interface-config.py" "$ICFG" || true
  fi
  sed -i \
    -e "s|DEFAULT_LOGO_URL: '[^']*'|DEFAULT_LOGO_URL: '${WATERMARK_URL#/}'|g" \
    -e "s|DEFAULT_WELCOME_PAGE_LOGO_URL: '[^']*'|DEFAULT_WELCOME_PAGE_LOGO_URL: '${WATERMARK_URL#/}'|g" \
    -e "s|SHOW_JITSI_WATERMARK: false|SHOW_JITSI_WATERMARK: true|g" \
    -e "s|SHOW_WATERMARK_FOR_GUESTS: false|SHOW_WATERMARK_FOR_GUESTS: true|g" \
    "$ICFG" 2>/dev/null || true
done

# Bloc forcé à chaque run (corrige anciens markers v6–v9)
if grep -q 'mcbuleli-watermark-force' "$CONFIG"; then
  sed -i \
    -e "s|config.defaultLogoUrl = '[^']*'|config.defaultLogoUrl = '${WATERMARK_URL}'|g" \
    -e "s|config.interfaceConfig.DEFAULT_LOGO_URL = '[^']*'|config.interfaceConfig.DEFAULT_LOGO_URL = '${WATERMARK_URL}'|g" \
    "$CONFIG" 2>/dev/null || true
else
  cat >> "$CONFIG" <<EOF

// mcbuleli-watermark-force — réaligné à chaque apply-mcbuleli-brand.sh
config.defaultLogoUrl = '${WATERMARK_URL}';
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.DEFAULT_LOGO_URL = '${WATERMARK_URL}';
config.interfaceConfig.DEFAULT_WELCOME_PAGE_LOGO_URL = '${WATERMARK_URL}';
config.interfaceConfig.SHOW_JITSI_WATERMARK = true;
config.interfaceConfig.SHOW_WATERMARK_FOR_GUESTS = true;
config.interfaceConfig.SHOW_BRAND_WATERMARK = false;
config.interfaceConfig.JITSI_WATERMARK_LINK = '';
EOF
fi

# Toujours désactiver la welcome page (même si le marker existe déjà)
if grep -q 'enableWelcomePage' "$CONFIG"; then
  sed -i 's/enableWelcomePage = true/enableWelcomePage = false/g; s/enableWelcomePage=true/enableWelcomePage=false/g' "$CONFIG"
else
  echo "config.enableWelcomePage = false;" >> "$CONFIG"
fi

echo "==> Entrée directe (sans 2e écran pré-join Jitsi)"
# Jitsi récent: prejoinConfig.enabled (dans var config) — pas seulement prejoinPageEnabled
sed -i \
  -e 's/prejoinPageEnabled = true/prejoinPageEnabled = false/g' \
  -e 's/prejoinPageEnabled=true/prejoinPageEnabled=false/g' \
  -e 's/prejoinPageEnabled: true/prejoinPageEnabled: false/g' \
  -e 's/prejoinPageEnabled:true/prejoinPageEnabled: false/g' \
  -e 's/prejoinConfig: { enabled: true/prejoinConfig: { enabled: false/g' \
  -e 's/prejoinConfig:{enabled:true/prejoinConfig:{enabled:false/g' \
  "$CONFIG" 2>/dev/null || true
if ! grep -q 'mcbuleli-prejoin-defaults' "$CONFIG"; then
  cat >> "$CONFIG" <<'EOF'

// mcbuleli-prejoin-defaults — entrée directe (McBuleli gère le clic Joindre)
config.prejoinPageEnabled = false;
config.prejoinConfig = config.prejoinConfig || {};
config.prejoinConfig.enabled = false;
config.startWithAudioMuted = false;
config.startWithVideoMuted = true;
config.requireDisplayName = false;
config.disableThirdPartyRequests = false;
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.DEFAULT_BACKGROUND = '#f4f6f4';
EOF
else
  grep -q 'prejoinConfig.enabled = false' "$CONFIG" || {
    cat >> "$CONFIG" <<'EOF'
config.prejoinConfig = config.prejoinConfig || {};
config.prejoinConfig.enabled = false;
EOF
  }
fi

echo "==> Corriger fond sombre + requêtes tierces (README manuel)"
sed -i 's/disableThirdPartyRequests = true/disableThirdPartyRequests = false/g' "$CONFIG" 2>/dev/null || true
sed -i "s|DEFAULT_BACKGROUND = '#1a2e1c'|DEFAULT_BACKGROUND = '#f4f6f4'|g" "$CONFIG" 2>/dev/null || true
sed -i "s|DEFAULT_BACKGROUND = '#040404'|DEFAULT_BACKGROUND = '#f4f6f4'|g" "$CONFIG" 2>/dev/null || true

echo "==> Watermark vidéo (coin pré-join + live)"
if ! grep -q 'mcbuleli-video-watermark-v1' "$CONFIG"; then
  cat >> "$CONFIG" <<EOF

// mcbuleli-video-watermark-v1 — public/brand/mcbuleli-meet-watermark.png
config.defaultLogoUrl = '$WATERMARK_URL';
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.DEFAULT_LOGO_URL = '$WATERMARK_URL';
config.interfaceConfig.SHOW_JITSI_WATERMARK = true;
config.interfaceConfig.SHOW_WATERMARK_FOR_GUESTS = true;
config.interfaceConfig.JITSI_WATERMARK_LINK = '';
EOF
fi

if ! grep -q "$MARKER" "$CONFIG"; then
  cat >> "$CONFIG" <<EOF

// $MARKER
config.defaultLanguage = 'fr';
config.defaultLogoUrl = '$WATERMARK_URL';
config.subject = 'McBuleli';
config.enableWelcomePage = false;
config.enableClosePage = false;
config.welcomePage = config.welcomePage || {};
config.welcomePage.disabled = true;
config.disableDeepLinking = true;
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.APP_NAME = '$APP_NAME';
config.interfaceConfig.NATIVE_APP_NAME = '$APP_NAME';
config.interfaceConfig.PROVIDER_NAME = 'McBuleli';
config.interfaceConfig.DEFAULT_LOGO_URL = '$WATERMARK_URL';
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

echo "==> Notifications McBuleli (plus de « via Jitsi »)"
if ! grep -q 'mcbuleli-brand-notifications' "$CONFIG"; then
  cat >> "$CONFIG" <<EOF

// mcbuleli-brand-notifications — APP_NAME pour {{appName}} dans thankYou
config.feedbackPercentage = 0;
config.brandingRoomAlias = 'Live McBuleli';
config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.APP_NAME = '$APP_NAME';
config.interfaceConfig.NATIVE_APP_NAME = '$APP_NAME';
config.interfaceConfig.PROVIDER_NAME = '$APP_NAME';
EOF
fi

# Retirer l'overlay PNG (cause du carré blanc sur mobile)
if [[ -f "$JITSI_ROOT/index.html" ]]; then
  sed -i '/mcbuleli-watermark-overlay\.js/d' "$JITSI_ROOT/index.html" 2>/dev/null || true
fi

for js in mcbuleli-hangup-return.js mcbuleli-rebrand-notifications.js mcbuleli-live-title.js mcbuleli-prejoin-brand.js; do
  cp "$SCRIPT_DIR/$js" "$JITSI_ROOT/$js"
  if [[ -f "$JITSI_ROOT/index.html" ]] && ! grep -q "$js" "$JITSI_ROOT/index.html"; then
    sed -i "s|</body>|<script src=\"/$js\"></script>\n</body>|" "$JITSI_ROOT/index.html"
  fi
done

echo "==> Fin de live : retour companion via ?mcbReturn= (passé par l'app McBuleli)"

echo "==> Vérification watermark"
if [[ -f "$JITSI_IMAGES/watermark.png" ]]; then
  ls -la "$JITSI_IMAGES/watermark.png"
else
  echo "ERREUR: watermark.png absent" >&2
  exit 1
fi
grep -E 'defaultLogoUrl|DEFAULT_LOGO_URL|SHOW_JITSI_WATERMARK' "$CONFIG" 2>/dev/null | tail -8 || true
[[ -f "$IFACE_CONFIG" ]] && grep -E 'DEFAULT_LOGO_URL|SHOW_JITSI_WATERMARK' "$IFACE_CONFIG" 2>/dev/null | head -4 || true

echo "==> Redémarrage"
systemctl restart prosody jicofo jitsi-videobridge2
systemctl reload nginx

echo "OK — Watermark: $WATERMARK_URL (PNG transparent, pas la JPEG source)"
