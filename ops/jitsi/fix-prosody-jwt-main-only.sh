#!/bin/bash
# McBuleli JWT-only : enable_domain_verification=false SANS réactiver guest/anonymousdomain.
# Remplace fix-prosody-jwt-guest.sh (qui causait le split host/guest).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
GUEST="guest.${DOMAIN}"
LOBBY="lobby.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "Missing $CFG"; exit 1; }

cp -a "$CFG" "${CFG}.bak.jwt-main-only.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$DOMAIN" "$GUEST" "$LOBBY" <<'PY'
import re, sys

path, domain, guest, lobby = sys.argv[1:5]
text = open(path).read()

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
    elif "allow_empty_token" in body:
        body = re.sub(
            r'(allow_empty_token\s*=\s*\w+\s*\n)',
            r'\1    enable_domain_verification = false\n',
            body,
            count=1,
        )
    else:
        body = "    enable_domain_verification = false\n" + body
    for key, val in (
        ("consider_websocket_secure", "true"),
        ("consider_bosh_secure", "true"),
        ("cross_domain_websocket", "true"),
        ("cross_domain_bosh", "true"),
    ):
        if key not in body:
            body = f"    {key} = {val}\n" + body
    return m.group(1) + body

if not re.search(vhost_re, text, re.DOTALL):
    print(f"VirtualHost {domain} not found", file=sys.stderr)
    sys.exit(1)
text = re.sub(vhost_re, patch_main, text, count=1, flags=re.DOTALL)

def comment_block(name):
    global text
    pat = rf'(?m)^(\s*)(VirtualHost|Component) "{re.escape(name)}"\s*$'
    while True:
        m = re.search(pat, text)
        if not m:
            return
        start = m.start()
        tail = text[m.end():]
        nxt = re.search(r'\n(?=(?:VirtualHost|Component) ")', tail)
        end = m.end() + (nxt.start() if nxt else len(tail))
        block = text[start:end]
        if block.lstrip().startswith("--"):
            return
        commented = "\n".join(
            ("-- " + line) if line.strip() and not line.lstrip().startswith("--") else line
            for line in block.splitlines()
        )
        text = text[:start] + commented + text[end:]
        print(f"OK: commented {name}")

for stray in (guest, lobby):
    comment_block(stray)

text = re.sub(r'(?m)^\s*"muc_lobby_rooms";\s*\n?', "", text)
text = re.sub(r'(?m)^\s*"muc_lobby_rooms",\s*\n?', "", text)

open(path, "w").write(text)
print("OK: JWT main-only (no guest split)")
PY

prosodyctl check config
echo "OK fix-prosody-jwt-main-only"
