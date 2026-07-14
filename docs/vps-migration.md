# Migration Render → VPS (McBuleliP2P)

Objectif : quitter Render (web + Postgres + cron jobs) pour un VPS autonome, avec une partie des crons sur **GitHub Actions** et le reste sur le **VPS**.

## Serveur unique (décision)

| | IP |
|--|----|
| **Principal (tout)** | **`162.35.181.98`** — `mcbuleli.org` + Postgres + crons + ai-relay + **`live.mcbuleli.org`** |
| Ancien live | `162.35.160.30` — décommissionner après cutover DNS live |

Inventaire IP / DNS / ports : [`ops/vps/SERVER.md`](../ops/vps/SERVER.md)  
Migration Jitsi depuis l’ancien host : `ops/vps/migrate-live-from-old.sh`

## État du backup local (critique)

| Fichier | Taille | Verdict |
|---------|--------|---------|
| `mcbuleli_backup.dump` (racine du repo) | **0 octet** (05 jul) | **Inutile** — pas un dump Postgres |

Dernières migrations code : `drizzle/0097_kyc_identity_correction.sql` (27 jun). Même un dump valide du 5 juil. ne couvrirait pas l’activité DB depuis (users, wallets, P2P, KYC, etc.).

**Avant toute coupure Render** : refaire un dump **depuis Render** vers une machine locale ou le VPS :

```bash
# Depuis le laptop (EXTERNAL Database URL Render → Connect)
./ops/vps/backup-from-render.sh "$DATABASE_URL"
# → ./backups/mcbuleli_YYYYMMDD_HHMMSS.dump (custom format pg_dump -Fc)
```

Vérifier : `ls -lh backups/*.dump` doit montrer plusieurs Mo (pas 0).

---

## Inventaire Render → destination

| Service Render | Schedule | Script / endpoint | Destination | Pourquoi |
|----------------|----------|-------------------|-------------|----------|
| `mcbuleli-wallet-withdraw-worker` | `*/1` | `cron-wallet-withdraw-worker.mjs` | **VPS** | Argent + fréquence trop haute pour GHA |
| `mcbuleli-wallet-deposit-scan` | `*/2` | `cron-wallet-deposit-scan.mjs` | **VPS** | Argent + latence dépôt |
| `mcbuleli-ai-relay` | `*/1` | Python `relay_all_instances.py` | **VPS** (systemd loop) | Build Python + 1 min |
| `mcbuleli-bots-tick` | `*/5` | `cron-bots-tick.mjs` | **VPS** | Trading ; GHA peut retarder |
| `McBuleliP2P` (cron) | ~`*/5` | `cron-p2p-expire.mjs` | **VPS** | Fenêtres paiement P2P |
| `mcbuleli-kyc-sync` | `*/10` | `cron-kyc-sync-pending.mjs` | **VPS** | UX KYC |
| `mcbuleli-governance-tick` | `*/10` | `cron-governance-tick.mjs` | **VPS** | Timeliness gouvernance |
| `mcbuleli-wallet-retry-jobs` | `*/15` | `cron-wallet-retry-failed-jobs.mjs` | **GitHub Actions** | Récupération, tolère délai |
| `mcbuleli-academy-reminders` | `*/15` | `cron-academy-reminders.mjs` | **GitHub Actions** | Emails |
| `mcbuleli-game-economy-tick` | `*/15` | `cron-game-tick.mjs` | **GitHub Actions** | Jeu |
| `mcbuleli-academy-journey-nudge` | `0 9 * * *` | `cron-academy-journey-nudge.mjs` | **GitHub Actions** | Quotidien |
| `mcbuleli-top-trader-payout` | `0 1 * * 0` | `cron-top-trader-payout.mjs` | **GitHub Actions** | Hebdo |
| *(non listé Render mais script)* events reminders | `*/15` | `cron-events-reminders.mjs` | **GitHub Actions** | Emails events |
| Web `McBuleliP2P` | — | Next.js | **VPS** (Docker / Node) | |
| Postgres `McBuleliP2P` | — | PostgreSQL | **VPS** (Docker `postgres:16`) | |

> GitHub Actions : les crons `*/15` et daily/weekly sont OK. Ne **jamais** y mettre withdraw / deposit / bots / p2p / ai-relay (délais GHA imprévisibles).

---

## Architecture cible

```
Internet → Cloudflare
              ↓
    VPS 162.35.181.98 (Nginx TLS)
              ↓
    ┌─────────┴──────────────────────┐
    │  mcbuleli.org → web :3000      │
    │  live.mcbuleli.org → Jitsi     │  (ex 162.35.160.30)
    │  Postgres docker (localhost)   │
    │  crontab + ai-relay systemd    │
    └────────────────────────────────┘
              ↑
    GitHub Actions (jobs basse fréquence)
```

Fichiers ops :

| Chemin | Rôle |
|--------|------|
| `ops/vps/docker-compose.yml` | Web + Postgres |
| `ops/vps/Dockerfile` | Image Next.js |
| `ops/vps/Caddyfile` ou `nginx-mcbuleli.conf` | TLS reverse proxy |
| `ops/vps/crontab` | Crons haute fréquence |
| `ops/vps/mcbuleli-ai-relay.service` | Relais Python en boucle |
| `ops/vps/install.sh` | Bootstrap VPS |
| `ops/vps/backup-db.sh` | Dump quotidien local |
| `ops/vps/backup-from-render.sh` | Dump externe Render |
| `ops/vps/restore-db.sh` | Restore `.dump` |
| `.github/workflows/cron-scheduled.yml` | Crons GHA |

---

## Plan de bascule (ordre)

### Phase 0 — Pendant que tu ajoutes la capacité VPS

1. Refaire un **vrai** `pg_dump` Render (script ci-dessus). Garder 2 copies (laptop + objet storage).
2. Sur le VPS : Docker, clone repo, copier secrets depuis Render Web → `.env` (`ops/vps/.env.example`).
3. `docker compose up -d db` → `restore-db.sh` → vérifier taille tables.
4. `npm run db:migrate` / push drizzle si schémas plus récents que le dump.
5. Monter le web en **staging** (ex. `https://vps.mcbuleli.org` ou IP) **sans** changer le DNS prod.

### Phase 1 — Crons hybrides (Render web encore live)

1. Configurer secrets GitHub : `CRON_SECRET`, `MCBULELI_API_URL=https://mcbuleli.org`.
2. Activer le workflow GHA (jobs infrequent) — **désactiver** les mêmes crons sur Render pour éviter le double run.
3. Installer crontab + ai-relay sur VPS pointant encore vers `https://mcbuleli.org` (API Render).
4. Désactiver les crons haute fréquence sur Render un par un après validation logs.

### Phase 2 — Cutover DB + Web

1. **Maintenance window** courte : freeze écritures (ou pause wallet automation).
2. Dump final Render → restore VPS (incrémental si possible, sinon full).
3. DNS `mcbuleli.org` → IP VPS ; SSL.
4. Mettre à jour `MCBULELI_API_URL` / `NEXT_PUBLIC_APP_URL` / env GHA vers la prod VPS.
5. Suspendre service Web + Postgres Render (ne **pas** delete tout de suite — 7–14 jours).

### Phase 3 — Cleanup

1. Suspendre tous les cron Render restants.
2. Archiver `render.yaml` comme historique (ne plus sync Blueprint).
3. Surveiller 48 h : wallet, bots, P2P expire, KYC.

---

## Secrets à transférer (Web Render → VPS `.env`)

Minimum : `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, `BINANCE_*`, `OKX_*`, `BOT_KEYS_ENCRYPTION_SECRET`, Resend/email, Didit KYC, Turnstile, `JITSI_JWT_SECRET`, S3, OpenAI (pour ai-relay), Twitter bearer.

Le cron VPS / GHA n’a besoin que de :

```bash
MCBULELI_API_URL=https://mcbuleli.org
CRON_SECRET=<même que le web>
```

Ai-relay : `MCBULELI_CRON_SECRET` (= `CRON_SECRET`) + clés LLM / Twitter (voir `services/mcbuleli-ai-trading/.env.example`).

---

## Anti double-exécution

Pendant la bascule, **un seul** déclencheur par job (Render **ou** VPS **ou** GHA). Les endpoints internes sont en général idempotents, mais wallet withdraw / deposit ne doivent pas tourner en double.

---

## Checklist validation post-cutover

- [ ] `curl -fsS https://mcbuleli.org/api/health` (ou route santé existante)
- [ ] Deposit scan log VPS toutes les ~2 min
- [ ] Withdraw worker ~1 min
- [ ] Bots tick ~5 min + health dans `/app` bots
- [ ] P2P expire
- [ ] GHA : workflow « Cron scheduled » vert (retry-jobs, academy, game, nudge, top-trader)
- [ ] Ai-relay `systemctl status mcbuleli-ai-relay`
- [ ] Backup quotidien `ops/vps/backup-db.sh` + retention
