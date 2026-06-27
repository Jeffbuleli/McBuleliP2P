# Security hardening — McBuleli.org

Checklist post-audit. Application-level fixes live in `src/middleware.ts`, `src/lib/security-headers.ts`, auth routes, and Turnstile.

## 1. HTTP security headers (app + Cloudflare)

**Next.js:** Headers are set in middleware and duplicated in `next.config.ts`. `X-Powered-By` is disabled.

**Cloudflare (backup / static assets):** Transform Rules → Modify response header → All incoming requests:

| Header | Value |
|--------|--------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(self)` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| ~~`Cross-Origin-Embedder-Policy`~~ | **Non utilisé** (`require-corp` casse Turnstile / Didit / Jitsi) |
| `Cross-Origin-Resource-Policy` | `same-origin` |

Copy `Content-Security-Policy` from `src/lib/security-headers.ts` when adding CSP at the edge.

**Verify:**

```bash
curl -sI https://mcbuleli.org | grep -i -E "(security|policy|frame|content-type|strict)"
```

## 2. Authentication

| Control | Implementation |
|---------|----------------|
| Login rate limit | 5 req / IP / min — `/api/auth/login` |
| Register rate limit | 3 req / IP / 10 min — `/api/auth/register` |
| Forgot password | 3 req / email / hour + 10 / IP / min + Turnstile — `/api/auth/forgot-password` |
| CAPTCHA | Cloudflare Turnstile on login + register (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) |
| JWT | HS256 only; `kid` rejected; session cookie (see `src/lib/jwt.ts`) |
| Password reset | 15 min TTL; prior tokens invalidated on new request |

**Note:** Session tokens use a signed HTTP-only cookie (not separate access/refresh JWTs). Rotation is via `sessionVersion` bump on password change / step-up.

## 3. API & CORS

- CORS: only `https://mcbuleli.org` (+ localhost in dev, optional `CORS_ALLOWED_ORIGINS`).
- Preflight `OPTIONS` handled in middleware for `/api/*`.
- **Global middleware throttle** : 120 mutating req/min/IP par bucket `/api/segment` (hors webhooks, crons, config).
- Input validation: Zod schemas in `src/lib/validation.ts` (email, nickname ≤30 chars, ISO country, amounts).
- **Rate limits (app layer)** — `src/lib/api-rate-limit.ts`:

| Scope | Limit |
|-------|--------|
| `withdrawal` | 5/h per user, 30/h per IP |
| `wallet_transfer` | 15/h per user |
| `fiat_withdraw` | 5/h per user |
| `p2p_order` | 20/h per user |
| `p2p_action` | 40/h per user |
| `trade_futures` | 30/min per user |
| `trade_options` | 40/min per user |
| `staking_stake` | 10/h per user |
| `jitsi_join` | 30/min per user |

- **Financial audit log** — table `financial_audit_log` (migration `0095_financial_audit_log.sql`). Run `npm run db:migrate:render` after deploy.
- **Jitsi access log** — `jitsi_access_log` (migration `0096_jitsi_access_log.sql`).

**Rate limiting at edge (recommandé) :** [cloudflare-waf.md](./cloudflare-waf.md) — sur plan **Free**, 1 seule règle edge (priorité login) ; OWASP managed rules nécessitent **Pro**.

## 4. Jitsi (`live.mcbuleli.org`)

Guide complet : [jitsi-security.md](./jitsi-security.md).

Sur le VPS :

```bash
sudo bash ops/jitsi/harden-security.sh
```

Résumé : JWT McBuleli (pas de basic auth), gate nginx, uploads désactivés, audit `jitsi_access_log`, rate limit join-token.

## 5. Financial operations

Server-side amount validation is enforced in wallet/P2P/trade services.

| Control | Implementation |
|---------|----------------|
| Amounts | Calculés serveur (`withdrawals`, `p2p-service`, `trade-*-service`) |
| Step-up | TOTP / passkey sur retraits USDT auto (`assertStepUp`) |
| Plafond journalier | `WITHDRAWAL_DAILY_MAX_USDT` / `WITHDRAWAL_DAILY_MAX_PI` (24 h glissantes) |
| Scoring retrait | `src/lib/wallet-withdraw-risk.ts` |
| Audit | `financial_audit_log`, `jitsi_access_log`, `platform_admin_audit_log` |

For compliance-grade immutable logs (2y retention), export ledger + audit tables to cold storage or a SIEM.

## 6. Infrastructure

| Item | Action |
|------|--------|
| `robots.txt` | No `Disallow` paths that reveal `/app`, `/admin`, `/api` — use `noindex` on private layouts instead |
| Cloudflare | Free : 1 rate limit (login), Bot Fight, custom rules (5) — **Managed OWASP = Pro** — voir [cloudflare-waf.md](./cloudflare-waf.md) |
| SPF/DKIM/DMARC | Configurer dans Cloudflare DNS — voir [dns-email-security.md](./dns-email-security.md) |
| Render origin lockdown | **Inbound IP rules** web = Scale/Enterprise seulement — sinon masquer `*.onrender.com` + Cloudflare proxied |
| Secrets | Only in Render env — never in repo |
| Dependencies | Dependabot `.github/dependabot.yml`; run `npm audit` regularly |

## 7. Post-deploy tests

```bash
# Headers
curl -sI https://mcbuleli.org | grep -i -E "(security|policy|frame|content-type|strict)"

# Rate limit (expect 429 after threshold)
for i in {1..10}; do curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://mcbuleli.org/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"wrong"}'; done

# CORS (evil origin should not get Allow-Origin)
curl -sI -H "Origin: https://evil.com" https://mcbuleli.org/api/auth/session | grep -i access-control
```

Target: A+ on [securityheaders.com](https://securityheaders.com), OWASP ZAP baseline without high findings, scheduled penetration test after deploy.
