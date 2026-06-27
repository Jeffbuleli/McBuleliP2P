# Cloudflare & Render — durcissement McBuleli.org

Checklist manuelle (dashboard). Complète [security-hardening.md](./security-hardening.md).

**Plan actuel : Free** — les **Managed rules** (OWASP, Cloudflare Managed Ruleset) nécessitent **Pro** (~20 USD/mois). Sur Free, on s’appuie sur l’app (middleware, Turnstile, rate limits) + les options ci-dessous.

---

## Plan Free — ce qu’on peut faire sans upgrade

### 1. SSL/TLS (gratuit)

**SSL/TLS → Overview**

- Mode : **Full (strict)**
- **Always Use HTTPS** : On
- **HSTS** : activé (doublon OK avec l’app)
- **IPv6 Compatibility** : On

### 2. Sécurité de base (gratuit)

**Security → Settings**

| Réglage | Valeur recommandée |
|---------|-------------------|
| **Security Level** | Medium (High si attaque en cours) |
| **Bot Fight Mode** | On — surveiller Pi Browser / WebView ; désactiver si faux positifs |
| **Browser Integrity Check** | On |

DDoS L3/L4 est inclus sur tous les plans (pas de réglage OWASP sans Pro).

### 3. Rate limiting — **1 règle** incluse (Free)

**Security → Security rules → Rate limiting rules → Create rule**

Prioriser **login** (le reste est déjà limité dans l’app) :

| Champ | Valeur |
|-------|--------|
| Rule name | `McBuleli auth login` |
| Expression | `(http.request.uri.path eq "/api/auth/login") and (http.request.method eq "POST")` |
| Requests | 10 |
| Period | 1 minute |
| Action | Block |

**Erreurs fréquentes :**

| Mauvaise config | Problème |
|-----------------|----------|
| Période **10 secondes** au lieu de **1 minute** | Blocage après 2–3 essais de connexion (trop strict) |
| Expression sur `/login` (page HTML) | Bloque le chargement de la page, pas seulement les tentatives |
| Expression trop large (`*`, tout `/api/*`) | Peut perturber Turnstile / assets Next.js |

L’app limite déjà **`POST /api/auth/login` à 5 req / IP / minute** (`src/lib/rate-limit.ts`). La règle Cloudflare est un **secours edge** (10/min), pas un doublon agressif.

> Register, forgot-password, wallet/P2P : déjà couverts par `src/lib/rate-limit.ts` et le middleware — pas besoin de 4 règles edge tant que le plan reste Free.

### 4. Custom rules — **5 règles** incluses (Free)

**Security → Security rules → Custom rules → Create rule**

Exemples utiles (à activer selon besoin). **Utiliser l’éditeur d’expressions** (syntaxe fonctions `starts_with()`, pas `starts with`) :

| Règle | Expression (copier-coller) | Action |
|-------|---------------------------|--------|
| Bloquer scans WordPress / `.env` | `(http.request.uri.path contains "/wp-admin") or (http.request.uri.path contains "/.env")` | Block |
| Bloquer méthodes dangereuses sur `/api/` | `starts_with(http.request.uri.path, "/api/") and http.request.method in {"TRACE" "CONNECT"}` | Block |
| Challenge pays (optionnel) | `ip.src.country in {"CN" "RU"}` | Managed Challenge |

**Ne pas utiliser** (syntaxe invalide) :
```text
http.request.uri.path starts with "/api/" and not http.request.method in {...}
```

**Équivalent valide** si vous voulez bloquer toute méthode hors liste (plus verbeux) :
```text
starts_with(http.request.uri.path, "/api/") and not (http.request.method in {"GET" "POST" "PUT" "PATCH" "DELETE" "OPTIONS"})
```

Points clés :
- `starts_with(champ, "/api/")` — fonction, pas opérateur `starts with`
- `not (...)` — parenthèses obligatoires autour du `in {…}`

Adapter après analyse des logs **Security → Events**.

### 5. En-têtes (secours)

**Rules → Transform Rules → Modify response header**

L’app envoie déjà CSP/HSTS via middleware. Ajouter ici seulement si [securityheaders.com](https://securityheaders.com) n’est pas A+.

### 6. Masquer l’origine Render

- DNS `mcbuleli.org` → proxied (nuage orange)
- Ne pas exposer l’URL `*.onrender.com` publiquement

---

## Plan Pro — si upgrade plus tard

**Security → WAF → Managed rules** (bouton « Upgrade to Pro » sur Free)

- Activer **Cloudflare Managed Ruleset**
- Activer **OWASP Core Ruleset** (sensibilité Medium)
- Mode : **Block** sur les règles critiques

Rate limiting edge supplémentaire (jusqu’à 2 règles Pro, plus sur Business) :

| Règle | Expression | Seuil |
|-------|------------|-------|
| Register | `path contains "/api/auth/register"` POST | 5 / 10 min / IP |
| Wallet / P2P / Trade | `path starts with "/api/wallet" or …` POST | 60 / 1 min / IP |
| Forgot password | `path contains "/api/auth/forgot-password"` | 5 / 1 h / IP |

---

## Render — pas de « Firewall » sur les plans standard

**Normal si vous ne trouvez pas « Firewall »** sur le service web McBuleli : les **Inbound IP rules** pour les *web services* ne sont disponibles que sur les orgs **Scale / Enterprise** (voir [Render Inbound IP rules](https://render.com/docs/inbound-ip-rules)).

| Plan Render | Web service `mcbuleli.org` | Postgres |
|-------------|---------------------------|----------|
| Free / Starter / Pro (web) | Pas de allowlist IP entrante | Règles IP possibles sur la DB |
| Scale / Enterprise | **Settings → Networking → Inbound IP rules** | Oui |

**Sans Enterprise**, l’origine Render reste joignable si quelqu’un connaît l’URL `*.onrender.com`. Mitigations déjà en place :

1. **DNS Cloudflare proxied** (nuage orange) — votre `curl` montre `cf-ray` ✅  
2. **Ne pas publier** l’URL `*.onrender.com` (docs, emails, liens publics)  
3. **Sécurité app** — headers, CORS, rate limits, Turnstile ✅  

Si vous passez **Scale/Enterprise** plus tard :

1. Service web → **Settings** → section **Networking** → **Inbound IP rules**  
2. Remplacer `0.0.0.0/0` par les CIDR [Cloudflare IPv4](https://www.cloudflare.com/ips-v4) (~22 plages)  
3. Render ne supporte que **IPv4** en allowlist — le trafic public passe déjà par Cloudflare en IPv4

```bash
curl -s https://www.cloudflare.com/ips-v4
```

---

## Vérifications

```bash
# Headers prod — attendu : CSP, HSTS, X-Frame-Options DENY
curl -sI https://mcbuleli.org | grep -iE 'strict|content-security|x-frame'

# Trafic via Cloudflare — attendu : ligne cf-ray: …
curl -sI https://mcbuleli.org | grep -i cf-ray

# CORS origin malveillant — attendu : 401 ou 200 SANS header
#   Access-Control-Allow-Origin: https://evil.com
curl -sI -H "Origin: https://evil.com" https://mcbuleli.org/api/auth/session | grep -i access-control
# (aucune ligne = OK — pas de CORS ouvert vers evil.com)
```

**Exemple de résultat sain (juin 2026)** :

- Headers : `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY` ✅  
- `cf-ray: …-JNB` → trafic proxied Cloudflare ✅  
- Session sans cookie : `HTTP/2 401`, pas de `access-control-allow-origin` vers evil.com ✅  

## Dépendances

- **Dependabot** : `.github/dependabot.yml`
- Locale : `npm audit` avant chaque release

## Synthèse Free vs Pro

| Contrôle | Free | Pro |
|----------|------|-----|
| Managed rules / OWASP | ❌ | ✅ |
| Rate limiting edge | 1 règle | 2+ |
| Custom firewall rules | 5 | 20 |
| DDoS L3/L4 | ✅ | ✅ |
| Turnstile + rate limit app | ✅ (McBuleli) | ✅ |

**Sans Pro**, la sécurité repose sur : **Turnstile**, **rate limits app**, **1 règle CF login**, **Bot Fight**, **headers middleware** — suffisant pour clôturer l’audit code ; Pro ajoute une couche WAF OWASP recommandée à moyen terme.

---

## Passage Cloudflare Pro (~20 USD/mois)

Quand le budget le permet :

1. **Upgrade** : Cloudflare Dashboard → mcbuleli.org → **Change plan** → Pro  
2. **Security → WAF → Managed rules** → activer :
   - Cloudflare Managed Ruleset → **Block**
   - OWASP Core Ruleset → sensibilité **Medium** (ajuster si faux positifs)
3. **Rate limiting** (2 règles incluses) — ajouter register + wallet en plus du login (voir tableau section Plan Pro ci-dessus)
4. **Super Bot Fight Mode** (optionnel) — tester Pi Browser / WebView avant activation stricte
5. Re-vérifier : `npm run security:smoke` + [securityheaders.com](https://securityheaders.com)

**ROI** : OWASP automatique + plus de règles edge ; le durcissement app (juin 2026) reste la base même avec Pro.
