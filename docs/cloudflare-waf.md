# Cloudflare & Render — durcissement McBuleli.org

Checklist manuelle (dashboard). Complète [security-hardening.md](./security-hardening.md).

## Cloudflare — WAF & rate limiting

### 1. WAF managed rules

**Security → WAF → Managed rules**

- Activer **Cloudflare Managed Ruleset**
- Activer **OWASP Core Ruleset** (sensibilité Medium en prod, ajuster si faux positifs)
- Mode : **Block** sur les règles critiques

### 2. Rate limiting (edge)

**Security → WAF → Rate limiting rules**

| Règle | Expression | Seuil |
|-------|------------|-------|
| Auth brute-force | `(http.request.uri.path contains "/api/auth/login") and http.request.method eq "POST"` | 10 req / 1 min / IP |
| Register | `path contains "/api/auth/register"` POST | 5 req / 10 min / IP |
| Wallet / P2P / Trade | `path starts with "/api/wallet" or path starts with "/api/p2p" or path starts with "/api/trade"` POST | 60 req / 1 min / IP |
| Forgot password | `path contains "/api/auth/forgot-password"` | 5 req / 1 h / IP |

Action : **Block** ou **Managed challenge** (Turnstile déjà sur login/register app).

### 3. En-têtes (secours)

**Rules → Transform Rules → Modify response header**

Copier les en-têtes depuis `src/lib/security-headers.ts` si le score [securityheaders.com](https://securityheaders.com) n’est pas A+.

### 4. SSL/TLS

- Mode : **Full (strict)**
- **Always Use HTTPS** : On
- **HSTS** : activé (doublon OK avec l’app)
- **IPv6 Compatibility** : On

### 5. Bot Fight / DDoS

- **DDoS** : sensibilité High
- **Bot Fight Mode** : On (surveiller Pi Browser / WebView — whitelister si besoin)

### 6. Masquer l’origine Render

- DNS `mcbuleli.org` → proxied (nuage orange)
- Ne pas exposer l’URL `*.onrender.com` publiquement
- Vérifier : [dnshistory.org](https://dnshistory.org) / Shodan sur l’IP Render

## Render — firewall

**Dashboard → Service → Settings → Outbound / Inbound**

Si disponible sur votre plan :

1. **Inbound IP allowlist** : uniquement les plages [Cloudflare IPv4/IPv6](https://www.cloudflare.com/ips/)
2. Désactiver les logs verbeux en production
3. Variables sensibles uniquement dans Environment (jamais dans le repo)

Script de référence (à adapter) :

```bash
# Télécharger les IP Cloudflare
curl -s https://www.cloudflare.com/ips-v4 -o /tmp/cf-v4.txt
curl -s https://www.cloudflare.com/ips-v6 -o /tmp/cf-v6.txt
# Coller dans Render allowlist ou firewall VPS si trafic direct
```

## Vérifications

```bash
# Headers prod
curl -sI https://mcbuleli.org | grep -iE 'strict|content-security|x-frame'

# Origin non exposé (doit passer par Cloudflare)
curl -sI https://mcbuleli.org | grep -i cf-ray

# CORS evil
curl -sI -H "Origin: https://evil.com" https://mcbuleli.org/api/auth/session
```

## Dépendances

- **Dependabot** : `.github/dependabot.yml` (PR hebdomadaires npm)
- Locale : `npm audit` avant chaque release
