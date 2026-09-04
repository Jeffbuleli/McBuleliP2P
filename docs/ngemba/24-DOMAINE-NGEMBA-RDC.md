# NGEMBA - Domaine propre `ngemba-rdc.org`

> Separation de Cyber Alert (`ngemba.cyberalert-rdc.org` devient legacy / redirect).

## Diagnostic (4 sept 2026) - resolu

**Cause reelle :** Cloudflare Full SSL parlait HTTPS a l'origine, mais nginx n'avait **pas** de vhost TLS `ngemba-rdc.org` → fallback SSL = Africa Insight (`301`).

**Fix :** certbot `ngemba-rdc.org` + `www` · vhost HTTPS nginx · legacy `ngemba.cyberalert-rdc.org` → 301 vers apex.

HTTP-only (cadenas « Not Secure ») marchait deja ; le navigateur prive montrait donc Ngemba en HTTP.

### Email (Cloudflare Email Routing)

Dans DNS, bouton **Add missing records** pour MX + SPF + DKIM Cloudflare = OK pour `info@ngemba-rdc.org`.  
Resend (envoi transactionnel) reste a verifier a part si utilise.

---

| | Avant | Apres |
|--|--|--|
| **Site** | `https://ngemba.cyberalert-rdc.org` | `https://ngemba-rdc.org` |
| **Email public** | `hi@mcbuleli.org` / `noreply@mcbuleli.org` | `info@ngemba-rdc.org` |
| **Hote VPS** | `153.75.235.176` | inchange |
| **Medias R2** | `media.cyberalert-rdc.org/ngemba/` | inchange (OK) |

---

## 1. DNS (Cloudflare / registrar)

Sur la zone **ngemba-rdc.org** :

```
A     @     153.75.235.176
A     www   153.75.235.176
```

Proxy orange OK · SSL Cloudflare **Full (Strict)**.

Garder `ngemba.cyberalert-rdc.org` (sous-domaine cyberalert) pour le 301 legacy.

---

## 2. Email (Resend)

1. Ajouter le domaine `ngemba-rdc.org` dans Resend.
2. Publier SPF / DKIM / DMARC selon Resend.
3. Creer boite / forward `info@ngemba-rdc.org` (Google Workspace, ImprovMX, etc.).
4. Sur le VPS `.env` :

```bash
NEXT_PUBLIC_APP_URL=https://ngemba-rdc.org
APP_URL=https://ngemba-rdc.org
NGEMBA_OPS_EMAIL=info@ngemba-rdc.org
NGEMBA_OPS_EMAIL_BCC=ceo@mcbuleli.org
NGEMBA_OPS_EMAIL_FROM=NGEMBA <info@ngemba-rdc.org>
NGEMBA_OPS_EMAIL_REPLY_TO=info@ngemba-rdc.org
```

Sans domaine Resend verifie, les emails ops echoueront (l'app web reste OK).

---

## 3. Cutover VPS

```bash
# Laptop
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude data --exclude .env \
  services/ngemba/ root@153.75.235.176:/opt/ngemba/

ssh root@153.75.235.176
# editer /opt/ngemba/ops/vps/.env (URLs + emails ci-dessus)
bash /opt/ngemba/ops/vps/deploy.sh

# TLS nouveau domaine (si premier passage)
cp /opt/ngemba/ops/vps/nginx-ngemba-bootstrap.conf /etc/nginx/sites-available/ngemba
nginx -t && systemctl reload nginx
certbot --nginx -d ngemba-rdc.org -d www.ngemba-rdc.org

# Conf finale (apex + redirect legacy)
cp /opt/ngemba/ops/vps/nginx-ngemba.conf /etc/nginx/sites-available/ngemba
nginx -t && systemctl reload nginx
```

Verif :

```bash
curl -sS https://ngemba-rdc.org/api/health
curl -sSI https://ngemba.cyberalert-rdc.org/ | head -5   # Location: https://ngemba-rdc.org/
```

---

## 4. Mobile APK

Rebuild EAS apres cutover DNS+TLS (sinon API 404) :

```bash
cd /Users/mac/Documents/ngemba-mobile
# EXPO_PUBLIC_NGEMBA_API_URL=https://ngemba-rdc.org dans eas.json
npx eas-cli build -p android --profile preview --non-interactive
```

Redistribuer via [23-PILOTE-APK-DISTRIBUTION.md](./23-PILOTE-APK-DISTRIBUTION.md).

---

## 5. Checklist

| # | Action | OK |
|---|--------|----|
| 1 | DNS A `@` + `www` → VPS | |
| 2 | Resend domaine + `info@` | |
| 3 | `.env` VPS mis a jour | |
| 4 | `deploy.sh` + certbot | |
| 5 | Health `ngemba-rdc.org` | |
| 6 | 301 depuis ancien sous-domaine | |
| 7 | Email test alerte → `info@` | |
| 8 | Nouveau build APK | |
