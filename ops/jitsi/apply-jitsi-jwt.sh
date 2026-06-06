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

patch_one_cfg() {
  local CFG="$1"
  [[ -f "$CFG" ]] || return 0
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
    enable_domain_verification = false
'''

vhost_re = rf'VirtualHost "{re.escape(host)}"\s*\n'

def dedupe_token_auth_in_vhost(body: str) -> str:
    """Un seul bloc token par VirtualHost (doublon jitsi-meet-tokens + manuel)."""
    if body.count('authentication = "token"') <= 1:
        return body
    lines = body.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    kept_token = False
    while i < len(lines):
        line = lines[i]
        if re.match(r'\s*authentication\s*=\s*"token"', line):
            if kept_token:
                i += 1
                while i < len(lines) and re.match(
                    r'\s*(app_id|app_secret|allow_empty_token|-- do not delete me)', lines[i]
                ):
                    i += 1
                continue
            kept_token = True
        out.append(line)
        i += 1
    return "".join(out)

if re.search(vhost_re, text):
    def patch_vhost(m):
        body = m.group(1)
        body = dedupe_token_auth_in_vhost(body)
        if re.search(r'authentication\s*=\s*"token"', body):
            body = re.sub(r'app_id\s*=\s*"[^"]*"', f'app_id = "{app_id}"', body, count=1)
            body = re.sub(r'app_secret\s*=\s*"[^"]*"', f'app_secret = "{secret}"', body, count=1)
            if re.search(r'allow_empty_token\s*=', body):
                body = re.sub(
                    r'allow_empty_token\s*=\s*\w+', 'allow_empty_token = false', body, count=1
                )
            else:
                body = re.sub(
                    r'(app_secret\s*=\s*"[^"]*"\s*\n)',
                    r'\1    allow_empty_token = false\n',
                    body,
                    count=1,
                )
        else:
            body = block + body
        return f'VirtualHost "{host}"\n' + body

    text = re.sub(
        vhost_re + r'(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)',
        patch_vhost,
        text,
        count=1,
        flags=re.DOTALL,
    )
else:
    print(f"SKIP: VirtualHost \"{host}\" not found in {path}", file=sys.stderr)
    sys.exit(0)

muc_re = rf'Component "conference\.{re.escape(host)}" "muc"\s*\n'

def patch_muc(m):
    body = m.group(1)
    if "token_verification" in body:
        return f'Component "conference.{host}" "muc"\n' + body
    patched = re.sub(
        r'(modules_enabled\s*=\s*\{)',
        r'\1\n        "token_verification";',
        body,
        count=1,
    )
    return f'Component "conference.{host}" "muc"\n' + patched

if re.search(muc_re, text):
    text = re.sub(
        muc_re + r'(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)',
        patch_muc,
        text,
        count=1,
        flags=re.DOTALL,
    )
elif "token_verification" not in text:
    text = text.replace(
        'modules_enabled = {',
        'modules_enabled = {\n        "token_verification";',
        1,
    )

open(path, "w").write(text)
print("OK: token auth lines written inside VirtualHost")
PY
}

# Prosody charge conf.d en priorité — patcher LES DEUX
patch_one_cfg "/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
patch_one_cfg "/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
if [[ -f "$MEET_CFG" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  JITSI_MEET_CONFIG="$MEET_CFG" bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh"
fi

prosodyctl check config 2>&1 | tail -12 || true
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# McBuleli: host ET invité ont un JWT sur live.mcbuleli.org — NE PAS réactiver guest/anonymousdomain
# (fix-prosody-jwt-guest.sh causait le split MUC host vs guest)
bash "$SCRIPT_DIR/fix-prosody-jwt-main-only.sh"

echo "Done. Set the same JITSI_APP_ID and JITSI_JWT_SECRET on Render, then redeploy."
echo "Pour baseline complète: bash ops/jitsi/fix-live-unified-baseline.sh"
