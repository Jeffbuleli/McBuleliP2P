# NGEMBA - Domaine propre `ngemba-rdc.org`

> Separation de Cyber Alert (`ngemba.cyberalert-rdc.org` devient legacy / redirect).

## Diagnostic (4 sept 2026)

**Probleme :** `https://ngemba-rdc.org` ouvre **Africa Insight** (301 → `www.africa-insight.org`).

| Check | Resultat |
|--|--|
| DNS A `ngemba-rdc.org` | Cloudflare proxy (`104.21…` / `172.67…`) - **pas** `153.75.235.176` |
| Header HTTP | `server: cloudflare` · `Location: https://www.africa-insight.org/` |
| VPS nginx Ngemba | OK sur `ngemba.cyberalert-rdc.org` → port `3012` |
| Cache navigateur | Secondaire - la redirect est cote Cloudflare, pas un vieux HTML |

**Cause :** zone Cloudflare `ngemba-rdc.org` mal cablee (Page Rule / Bulk Redirect / mauvais origin), pas un bug app Ngemba.

**UI app installee ≠ web :** la PWA a ete installee depuis `ngemba-rdc.org` → c'est **Africa Insight**. Desinstaller cette icone ; reinstaller depuis https://ngemba.cyberalert-rdc.org jusqu'au cutover.

### Fix Cloudflare (a faire dans le dashboard)

1. Ouvrir la zone **ngemba-rdc.org** (pas africa-insight).
2. **Rules → Redirects / Page Rules** : supprimer toute regle vers `africa-insight.org`.
3. **DNS** :
   - `A @` → `153.75.235.176` (proxy orange OK apres cert, ou gris le temps du certbot)
   - `A www` → `153.75.235.176`
4. **SSL/TLS** : Full (Strict) apres certbot.
5. **Caching** → Purge Everything (apres correction).
6. Verifier : `curl -sSI https://ngemba-rdc.org/` ne doit plus avoir `Location: africa-insight`.

Puis certbot sur le VPS (voir section 3).

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

**Ne pas** rediriger vers Africa Insight. Proxy Cloudflare : ON · SSL **Full (Strict)** apres certbot.

Garder temporairement `ngemba.cyberalert-rdc.org` pointe vers la meme IP.

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
