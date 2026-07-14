# McBuleli P2P

Next.js app for **USDT deposits** (TXID checked against **Binance** deposit history on the server) and **manual withdrawals**: balance is reserved (**net + fixed USDT fee**), agents **claim** a ticket (others see it **in progress**), then paste on-chain **TXID** or **reject** with automatic refund.

**Bilingual UI:** **FR / EN** (flag switcher, cookie `mcbuleli_locale`).

Primary colours: **green** + **maroon**. **PWA**-ready.

## Withdrawals

- User enters **net** USDT to receive; platform fee is **always 2 USDT** (added on top). Minimum net **5 USDT** external (Binance catalogue); lower minimum when destination is a known Binance internal wallet.
- Status flow: **Pending** → agent **Take charge** → **Processing** (visible to all agents) → **Completed** / **Rejected**.

## Agent workflow

1. Open **`/admin/withdrawals`** — filter **Open + In progress**, or single status.
2. Open a row → **Take charge** → status becomes **Processing**, others see **busy**.
3. Send funds externally → paste **TXID** → **✓ Sent**, or **✕ Refund**.

## Setup (local — équipe)

1. Copy `.env.example` → `.env`. Set **`JWT_SECRET`** (≥ 16 chars).  
   **`NEXT_PUBLIC_APP_URL=http://localhost:3000`** for local preview.
2. `npm install` && `npm run db:push` (Postgres local)
3. **`npm run dev`** → open **http://localhost:3000/**
4. Optional: `npm run verify:binance`

See **[docs/team-workflow.md](docs/team-workflow.md)** — local → GitHub → VPS (no laptop rsync to prod).

## Deploy (prod VPS)

- Source of truth: **GitHub `main` only**
- On VPS: `bash ops/vps/deploy.sh` (or GitHub Action **Deploy VPS** after merge)
- Do **not** copy files from a laptop onto production

Legacy Render notes below are historical; active ops live in `ops/vps/` + `docs/vps-migration.md`.

## Roles

| Role          | Access                          |
|---------------|----------------------------------|
| `user`        | `/app` deposit & withdraw        |
| `agent`       | `/admin` queue, claim, complete  |
| `super_admin` | Above + **`/admin/users`** roles |

## Deploy

| Env | How |
|-----|-----|
| **Local** | `npm run dev` → http://localhost:3000 |
| **Prod VPS** | Merge `main` on GitHub → `ops/vps/deploy.sh` or Action **Deploy VPS** |

Set **`DATABASE_URL`**, **`JWT_SECRET`**, wallet/KYC secrets in `ops/vps/.env` on the server only (never commit).

## License

Private / your terms — adjust as needed.
