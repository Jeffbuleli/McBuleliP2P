#!/bin/bash
# duplicate location "/http-bind" — Jitsi vhost + snippet mcbuleli = nginx emerg.
# Garde UN SEUL bloc via include snippets/mcbuleli-xmpp-proxy.conf
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
SNIP="/etc/nginx/snippets/mcbuleli-xmpp-proxy.conf"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

find_nginx_vhost() {
  for f in /etc/nginx/sites-enabled/${DOMAIN}.conf \
           /etc/nginx/sites-enabled/${DOMAIN} \
           /etc/nginx/sites-available/${DOMAIN}.conf; do
    [[ -f "$f" ]] && echo "$f" && return 0
  done
  return 1
}

VHOST="$(find_nginx_vhost)" || { echo "Vhost introuvable"; exit 1; }
cp -a "$VHOST" "/root/nginx-backups/$(basename "$VHOST").dedupe.$(date +%Y%m%d%H%M%S)"

python3 - "$VHOST" <<'PY'
import re, sys

path = sys.argv[1]
text = open(path).read()

def remove_location_blocks(src, loc_path):
    out = []
    i = 0
    lines = src.splitlines(keepends=True)
    pat = re.compile(rf'^\s*location\s*=\s*{re.escape(loc_path)}\s*\{{\s*$')
    while i < len(lines):
        if pat.match(lines[i]):
            depth = 0
            while i < len(lines):
                depth += lines[i].count('{') - lines[i].count('}')
                i += 1
                if depth <= 0:
                    break
            continue
        out.append(lines[i])
        i += 1
    return ''.join(out)

for loc in ('/http-bind', '/xmpp-websocket'):
    text = remove_location_blocks(text, loc)

# Un seul include snippet par fichier
text = re.sub(r'^\s*include\s+snippets/mcbuleli-xmpp-proxy\.conf;\s*\n', '', text, flags=re.M)
# Un include après chaque server_name live.mcbuleli.org
text = re.sub(
    r'(server_name[^;]*live\.mcbuleli\.org[^;]*;)',
    r'\1\n    include snippets/mcbuleli-xmpp-proxy.conf;',
    text,
)

open(path, 'w').write(text)
print("OK deduped", path)
PY

# Snippet doit exister (créé par fix-nginx-websocket-complete.sh)
if [[ ! -f "$SNIP" ]]; then
  bash "$(dirname "$0")/fix-nginx-websocket-complete.sh" 2>/dev/null || true
fi

echo "==> Comptage locations (attendu: 0 inline dans vhost, 1 include)"
grep -c 'location = /http-bind' "$VHOST" 2>/dev/null || echo "0 inline http-bind"
grep -c 'mcbuleli-xmpp-proxy' "$VHOST" || echo "0 includes"

nginx -t
systemctl reload nginx

echo ""
for p in /http-bind /xmpp-websocket; do
  echo -n "https://${DOMAIN}${p} → "
  curl -sI -o /dev/null -w '%{http_code}\n' "https://${DOMAIN}${p}" 2>/dev/null || echo ERR
done
echo "OK nginx xmpp dedupe"
