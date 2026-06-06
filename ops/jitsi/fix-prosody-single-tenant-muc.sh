#!/bin/bash
# McBuleli single-tenant : retirer muc_domain_mapper du VirtualHost live (pas du Component muc).
# Double mapper sur vhost + component peut router vers des MUC dérivées.
# Réf: https://prosody.im/doc/console (muc:room) + Jitsi single-domain installs
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
cp -a "$CFG" "${CFG}.bak.no-mapper.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$DOMAIN" <<'PY'
import re, sys
path, domain = sys.argv[1], sys.argv[2]
text = open(path).read()

vhost_re = rf'(VirtualHost "{re.escape(domain)}"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'

def strip_mapper_from_vhost(m):
    body = m.group(2)
    body = re.sub(r'(?m)^\s*"muc_domain_mapper";\s*\n', '', body)
    body = re.sub(r'(?m)^\s*"muc_domain_mapper",\s*\n', '', body)
    return m.group(1) + body

text = re.sub(vhost_re, strip_mapper_from_vhost, text, count=1, flags=re.DOTALL)

if "mcbuleli-single-tenant-muc" not in text:
    text += "\n-- mcbuleli-single-tenant-muc: muc_domain_mapper retiré du VirtualHost live\n"

open(path, "w").write(text)
print("OK: muc_domain_mapper retiré du VirtualHost", domain)
PY

echo ""
echo "==> muc_domain_mapper restant (attendu: Component conference seulement)"
grep -n 'muc_domain_mapper' "$CFG" || echo "(aucun — vérifier manuellement)"

prosodyctl check config 2>&1 | tail -10 || true
systemctl restart prosody
sleep 3
systemctl restart jicofo

echo "OK — retest + diagnose-muc-occupants-live.sh"
