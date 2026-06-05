#!/bin/bash
# Retire les fichiers .bak de sites-enabled (nginx les charge tous).
set -euo pipefail
mkdir -p /root/nginx-backups
shopt -s nullglob
moved=0
for f in /etc/nginx/sites-enabled/*.bak*; do
  echo "mv $f -> /root/nginx-backups/"
  mv -f "$f" "/root/nginx-backups/$(basename "$f")"
  moved=1
done
shopt -u nullglob
if [[ "$moved" -eq 0 ]]; then
  echo "Aucun .bak dans sites-enabled."
fi
nginx -t
echo "OK — systemctl reload nginx"
