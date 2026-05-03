# McBuleli P2P

Next.js app for **USDT deposits** (TXID checked against **server-side** liquidity APIs — Binance / OKX internally) and **operator-managed withdrawals** (no automated exchange payout): funds are **reserved** from the user balance until an **agent** marks the withdrawal **completed** with an on-chain **TXID**, or **rejects** it with an automatic **refund**.

**End-user UI is neutral** (no Binance/OKX branding): deposits use **Route A / Route B**; withdrawals describe **team processing**.

Primary colours: **green** + **maroon**. **PWA**-ready (manifest).

## Prerequisites

- Node.js (current LTS)
- PostgreSQL 16+ (local or hosted)

## Setup

1. Copy `.env.example` → `.env`. Set **`JWT_SECRET`** (≥ 16 chars). Add **`SUPER_ADMIN_EMAILS`** (comma-separated) so those accounts become **super_admin** on register/login — they can open **`/admin/users`** and assign **`agent`** roles.

2. Apply schema:

   ```bash
   npm install
   npm run db:push
   ```

3. Run:

   ```bash
   npm run dev
   ```

4. Optional: `npm run verify:binance` — validates Binance keys only (used for deposit routes / TXID lookup where configured).

### Exchange API permissions

- **Deposits (Route A / B)** only need what’s required to fetch a **deposit address** and **deposit history** (TXID validation). On OKX, **read-style permissions are sufficient** for Route B — you do **not** need OKX “withdraw” rights for this codebase, because **outbound transfers are operator-driven** (`/admin`), not API-driven.
- If you later create OKX keys **with withdrawal**, that only matters for **manual** operations in the OKX UI or a future automation — not required today.

## Roles

| Role            | Access                                              |
|-----------------|-----------------------------------------------------|
| `user`          | `/app` deposit & withdraw                         |
| `agent`         | `/admin` withdrawal queue, complete/reject        |
| `super_admin`   | Above + **`/admin/users`** (assign roles)          |

## Operator workflow (withdrawals)

1. User submits withdrawal → balance locked, status **`PENDING_AGENT`**.
2. Agent opens **`/admin/withdrawals`**, copies destination / amount / network, executes transfer **outside this app** (custody / exchange UI).
3. Agent pastes **TXID** → **Mark as sent**, or **Reject** (refunds balance + reason shown to user).

## Product scenarios (ideas)

- **SLA / ageing**: sort queue by `createdAt`; highlight items older than N minutes.
- **Claim**: optional “assign to me” to avoid two agents processing the same ticket.
- **Notifications**: webhook/email when `PENDING_AGENT` count &gt; 0.
- **Limits**: cap daily outflow per user in `POST /api/withdrawals`.
- **Dual custody**: `networkCex` in DB already hints the chain code for ops; you can add an internal “wallet selector” field later without exposing brands to users.

## Deploy

- Set **`DATABASE_URL`**, **`JWT_SECRET`**, **`SUPER_ADMIN_EMAILS`**, and liquidity API vars as needed on **Vercel** / **Render**.
- Run **`npm run db:push`** against production DB once after deploy.

## License

Private / your terms — adjust as needed.
