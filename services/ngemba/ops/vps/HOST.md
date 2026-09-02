# NGEMBA production host

- **Domain:** `ngemba.cyberalert-rdc.org`
- **VPS:** `153.75.235.176`
- **Path:** `/opt/ngemba`
- **Bind:** `127.0.0.1:3012`
- **Data:** Docker volume `ngemba_data` → `/app/data/sessions.json`
- **No dedicated Postgres** (RAM constrained) — file sessions for Phase 1

## Deploy

```bash
# From laptop (rsync source of truth until dedicated git remote):
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude data --exclude .env \
  /path/to/McBuleliP2P/services/ngemba/ root@153.75.235.176:/opt/ngemba/

ssh root@153.75.235.176
cp /opt/ngemba/ops/vps/.env.example /opt/ngemba/ops/vps/.env
# edit .env
bash /opt/ngemba/ops/vps/deploy.sh

# nginx + TLS
cp /opt/ngemba/ops/vps/nginx-ngemba.conf /etc/nginx/sites-available/ngemba
ln -sf /etc/nginx/sites-available/ngemba /etc/nginx/sites-enabled/ngemba
nginx -t && systemctl reload nginx
# First HTTP-only, then:
certbot --nginx -d ngemba.cyberalert-rdc.org
```

## DNS

`A ngemba.cyberalert-rdc.org → 153.75.235.176` (Cloudflare proxied OK with Full Strict after cert)
