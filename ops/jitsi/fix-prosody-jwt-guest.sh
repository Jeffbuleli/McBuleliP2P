#!/bin/bash
# Fix « Authentication failed » avec JWT valide — conflit guest domain + domain verification.
# Réf: https://github.com/jitsi/jitsi-meet/issues/11967 (enable_domain_verification = false)
# Usage (root VPS): bash ops/jitsi/fix-prosody-jwt-guest.sh
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
GUEST="guest.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
JICOFO_CFG="/etc/jitsi/jicofo/jicofo.conf"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root"
  exit 1
fi

if [[ ! -f "$CFG" ]]; then
  echo "Missing $CFG" >&2
  exit 1
fi

cp -a "$CFG" "${CFG}.bak.jwt-guest.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$DOMAIN" "$GUEST" <<'PY'
import re, sys
path, domain, guest = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(path).read()

# 1) Main VirtualHost — enable_domain_verification = false (JWT + guest domain)
vhost_re = rf'(VirtualHost "{re.escape(domain)}"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'

def patch_main(m):
    body = m.group(2)
    if "enable_domain_verification" in body:
        body = re.sub(
            r"enable_domain_verification\s*=\s*\w+",
            "enable_domain_verification = false",
            body,
            count=1,
        )
    else:
        body = re.sub(
            r'(allow_empty_token\s*=\s*\w+\s*\n)',
            r'\1    enable_domain_verification = false\n',
            body,
            count=1,
        )
        if "enable_domain_verification" not in body:
            body = "    enable_domain_verification = false\n" + body
    return m.group(1) + body

if re.search(vhost_re, text, re.DOTALL):
    text = re.sub(vhost_re, patch_main, text, count=1, flags=re.DOTALL)
else:
    print(f"VirtualHost {domain} not found", file=sys.stderr)
    sys.exit(1)

# 2) Guest VirtualHost — jitsi-anonymous (pas token / internal_hashed)
guest_re = rf'VirtualHost "{re.escape(guest)}"\s*\n'

guest_block = f'''VirtualHost "{guest}"
    authentication = "jitsi-anonymous"
    c2s_require_encryption = false
'''

if re.search(guest_re, text):
    text = re.sub(
        guest_re + r".*?(?=\n(?:VirtualHost|Component)\s|\Z)",
        guest_block,
        text,
        count=1,
        flags=re.DOTALL,
    )
else:
    # Insérer après le VirtualHost principal
    text = re.sub(
        vhost_re,
        lambda m: m.group(0) + "\n" + guest_block,
        text,
        count=1,
        flags=re.DOTALL,
    )

open(path, "w").write(text)
print(f"OK: Prosody patched ({domain} + {guest})")
PY

# 3) config.js — anonymousdomain
if [[ -f "$MEET_CFG" ]]; then
  cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").jwt-guest.$(date +%Y%m%d%H%M%S)"
  # Décommenter anonymousdomain si jitsi-meet l'a laissé en // ...
  sed -i "s|// *anonymousdomain:.*|anonymousdomain: '${GUEST}',|" "$MEET_CFG"
  if grep -qE '^[[:space:]]*anonymousdomain:' "$MEET_CFG"; then
    sed -i "s|anonymousdomain:.*|anonymousdomain: '${GUEST}',|" "$MEET_CFG"
  elif grep -q "domain: '${DOMAIN}'" "$MEET_CFG"; then
    sed -i "s|domain: '${DOMAIN}'|domain: '${DOMAIN}',\n        anonymousdomain: '${GUEST}'|" "$MEET_CFG"
  else
    cat >> "$MEET_CFG" <<EOF

// mcbuleli-jwt-guest
config.hosts = config.hosts || {};
config.hosts.domain = '${DOMAIN}';
config.hosts.anonymousdomain = '${GUEST}';
EOF
  fi
  echo "OK: config.js anonymousdomain = ${GUEST}"
fi

# 4) Jicofo — auth doit rester désactivée avec JWT (handbook Jitsi)
if [[ -f "$JICOFO_CFG" ]]; then
  if grep -q 'authentication-enabled' "$JICOFO_CFG"; then
    sed -i 's/authentication-enabled=true/authentication-enabled=false/g' "$JICOFO_CFG" || true
    echo "OK: jicofo authentication-enabled=false"
  fi
fi

prosodyctl check config || true
systemctl restart prosody jicofo jitsi-videobridge2 nginx

echo ""
echo "==> Vérification"
grep -n 'enable_domain_verification\|allow_empty_token' "$CFG" | head -5
grep -n "VirtualHost \"${GUEST}\"" -A2 "$CFG" || true
grep 'anonymousdomain' "$MEET_CFG" 2>/dev/null || true
echo ""
echo "Retestez : nouvel onglet → App → Démarrer le live"
echo "Logs live : tail -f /var/log/prosody/prosody.log"
