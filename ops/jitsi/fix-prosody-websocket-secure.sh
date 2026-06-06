#!/bin/bash
# « No stream features to offer on insecure session » derrière nginx TLS.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").ws-secure.$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" "$DOMAIN" <<'PY'
import re, sys
path, domain = sys.argv[1], sys.argv[2]
text = open(path).read()
pat = rf'(VirtualHost "{re.escape(domain)}".*?)(?=\n(?:VirtualHost|Component) ")'
m = re.search(pat, text, re.DOTALL)
if not m:
    print("WARN: VirtualHost not found"); sys.exit(0)
block = m.group(1)

# Réparer modules_enabled dupliqué / cassé
if block.count("modules_enabled") > 1:
    # Garder le premier bloc modules_enabled complet
    block = re.sub(
        r'\n\s*modules_enabled\s*=\s*\{[^}]*\}\s*\n\s*-- muc_lobby_whitelist[^\n]*\n\s*modules_enabled\s*=\s*\{',
        '\n    modules_enabled = {',
        block,
        count=1,
    )

for key, val in [
    ("consider_websocket_secure", "true"),
    ("consider_bosh_secure", "true"),
    ("cross_domain_websocket", "true"),
    ("cross_domain_bosh", "true"),
]:
    if re.search(rf'^\s*{key}\s*=', block, re.M):
        block = re.sub(rf'^\s*{key}\s*=.*$', f'    {key} = {val}', block, flags=re.M)
    else:
        block += f"\n    {key} = {val}\n"

for mod in ("bosh", "websocket", "smacks"):
    if f'"{mod}"' not in block:
        if "modules_enabled" in block:
            block = re.sub(
                r'(modules_enabled\s*=\s*\{)',
                rf'\1\n        "{mod}";',
                block,
                count=1,
            )

if "mcbuleli-ws-secure" not in block:
    block += "\n    -- mcbuleli-ws-secure\n"

text = text[: m.start(1)] + block + text[m.end(1) :]
open(path, "w").write(text)
print("OK")
PY

# Désactiver jaas.cfg.lua (jigasi.meet.jitsi)
for f in /etc/prosody/conf.avail/jaas.cfg.lua /etc/prosody/conf.d/jaas.cfg.lua; do
  [[ -f "$f" ]] || continue
  mv -f "$f" "/root/nginx-backups/$(basename "$f").disabled.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
  echo "DISABLED: $f"
done

prosodyctl check config
systemctl restart prosody
sleep 2
echo "OK — retestez après fix-config-js-emergency-restore.sh"
