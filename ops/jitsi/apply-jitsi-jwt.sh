#!/usr/bin/env bash
# Configure Prosody JWT on the VPS — do NOT paste Lua lines into bash by hand.
# Usage (root on VPS):
#   export JITSI_APP_ID=mcbuleli_live
#   export JITSI_JWT_SECRET='your-secret-from-openssl'
#   bash apply-jitsi-jwt.sh
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
APP_ID="${JITSI_APP_ID:-mcbuleli_live}"
APP_SECRET="${JITSI_JWT_SECRET:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash apply-jitsi-jwt.sh"
  exit 1
fi

if [[ -z "$APP_SECRET" || ${#APP_SECRET} -lt 16 ]]; then
  echo "Set JITSI_JWT_SECRET (min 16 chars), same value as on Render."
  echo "  export JITSI_JWT_SECRET=\$(openssl rand -hex 32)"
  exit 1
fi

echo "==> Installing jitsi-meet-tokens (recommended)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y jitsi-meet-tokens 2>/dev/null || true

CFG=""
for d in /etc/prosody/conf.avail /etc/prosody/conf.d; do
  if [[ -f "$d/${DOMAIN}.cfg.lua" ]]; then
    CFG="$d/${DOMAIN}.cfg.lua"
    break
  fi
done

if [[ -z "$CFG" ]]; then
  echo "Prosody config not found for ${DOMAIN}. Check:"
  ls -la /etc/prosody/conf.avail/ /etc/prosody/conf.d/ 2>/dev/null || true
  exit 1
fi

cp -a "$CFG" "${CFG}.bak.$(date +%Y%m%d%H%M%S)"
echo "==> Patching $CFG"

python3 - "$CFG" "$APP_ID" "$APP_SECRET" "$DOMAIN" <<'PY'
import re, sys
path, app_id, secret, host = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
text = open(path).read()

block = f'''    authentication = "token"
    app_id = "{app_id}"
    app_secret = "{secret}"
    allow_empty_token = false
'''

if re.search(r'authentication\s*=\s*"token"', text):
    text = re.sub(r'app_id\s*=\s*"[^"]*"', f'app_id = "{app_id}"', text, count=1)
    text = re.sub(r'app_secret\s*=\s*"[^"]*"', f'app_secret = "{secret}"', text, count=1)
    text = re.sub(r'allow_empty_token\s*=\s*\w+', 'allow_empty_token = false', text, count=1)
else:
    pattern = rf'(VirtualHost "{host}"\s*\n)'
    if not re.search(pattern, text):
        print(f"VirtualHost \"{host}\" not found in {path}", file=sys.stderr)
        sys.exit(1)
    text = re.sub(pattern, r'\1' + block, text, count=1)

if "token_verification" not in text:
    text = text.replace(
        'modules_enabled = {',
        'modules_enabled = {\n        "token_verification";',
        1,
    )

open(path, "w").write(text)
print("OK: token auth lines written inside VirtualHost")
PY

MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
if [[ -f "$MEET_CFG" ]] && ! grep -q 'enableUserRolesBasedOnToken' "$MEET_CFG"; then
  sed -i.bak '/^};$/i config.enableUserRolesBasedOnToken = true;' "$MEET_CFG" 2>/dev/null || \
    echo "config.enableUserRolesBasedOnToken = true;" >> "$MEET_CFG"
fi

prosodyctl check config
systemctl restart prosody
systemctl restart jicofo jitsi-videobridge2 nginx

echo "Done. Set the same JITSI_APP_ID and JITSI_JWT_SECRET on Render, then redeploy."
