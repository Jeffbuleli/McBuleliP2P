# NGEMBA production host

- **Domain:** `ngemba-rdc.org` (email `info@ngemba-rdc.org`)
- **Legacy:** `ngemba.cyberalert-rdc.org` → 301 vers le nouveau domaine
- **VPS:** `153.75.235.176` (meme hote Cyber Alert - app separee)
- **Path:** `/opt/ngemba`
- **Bind:** `127.0.0.1:3012`
- **Data:** Docker volume `ngemba_data` → `/app/data/sessions.json`
- **No dedicated Postgres** (RAM constrained) - file sessions for Phase 1

Cutover detaille : [`docs/ngemba/24-DOMAINE-NGEMBA-RDC.md`](../../../docs/ngemba/24-DOMAINE-NGEMBA-RDC.md)

## Deploy

```bash
# From laptop:
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude data --exclude .env \
  /path/to/McBuleliP2P/services/ngemba/ root@153.75.235.176:/opt/ngemba/

ssh root@153.75.235.176
# Mettre a jour APP_URL / emails dans /opt/ngemba/ops/vps/.env
bash /opt/ngemba/ops/vps/deploy.sh

# nginx + TLS (nouveau domaine)
cp /opt/ngemba/ops/vps/nginx-ngemba-bootstrap.conf /etc/nginx/sites-available/ngemba
ln -sf /etc/nginx/sites-available/ngemba /etc/nginx/sites-enabled/ngemba
nginx -t && systemctl reload nginx
certbot --nginx -d ngemba-rdc.org -d www.ngemba-rdc.org
# Puis remplacer par nginx-ngemba.conf (redirect legacy inclus)
cp /opt/ngemba/ops/vps/nginx-ngemba.conf /etc/nginx/sites-available/ngemba
nginx -t && systemctl reload nginx
```

## DNS

```
A     ngemba-rdc.org      → 153.75.235.176
A     www.ngemba-rdc.org  → 153.75.235.176
```

Cloudflare : proxied OK avec SSL Full (Strict) apres certbot.
