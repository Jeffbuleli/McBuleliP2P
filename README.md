# McBuleli P2P

Next.js app for **guided USDT deposits and withdrawals** with **strict on-exchange validation** (Binance and OKX APIs hold the source of truth for TXIDs, networks, and addresses). Primary UI colors: **green** and **maroon**. Installable as a **PWA** (manifest + standalone display).

## Prerequisites

- Node.js (current LTS)
- PostgreSQL 16+ (local or hosted)

## Setup

1. Copy `.env.example` to `.env.local` and fill values. **Do not put real API keys in `.env.example`** (it may be committed to git). Optional: `npm run verify:binance` checks Binance keys from `.env.local`.

2. Create the database schema:

   ```bash
   npm install
   npm run db:push
   ```

   Or apply the SQL in `drizzle/` manually.

3. Run locally:

   ```bash
   npm run dev
   ```

## Environment

- **DATABASE_URL** — PostgreSQL connection string (Vercel: use Neon or other compatible host; long-lived connections work with `postgres` + pooling on Render).
- **JWT_SECRET** — at least 16 characters.
- **BINANCE_*** / **OKX_*** — API keys stay on the server only; the browser never sees them.

## Deploy

- **Vercel**: connect the GitHub repo, set environment variables, use a serverless-friendly Postgres (e.g. Neon) and set `DATABASE_URL`.
- **Render**: deploy as a **Web Service** (build `npm run build`, start `npm start`), add a **PostgreSQL** instance and paste its URL into `DATABASE_URL`.

Withdrawals call the exchange immediately after locking balance in Postgres; if the exchange rejects the request, funds are refunded in the same failure path.

## License

Private / your terms — adjust as needed.
