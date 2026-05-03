# McBuleli P2P

Next.js app for **USDT deposits** (TXID checked against **Binance** deposit history on the server) and **manual withdrawals**: balance is reserved (**net + fixed USDT fee**), agents **claim** a ticket (others see it **in progress**), then paste on-chain **TXID** or **reject** with automatic refund.

**Bilingual UI:** **FR / EN** (flag switcher, cookie `mcbuleli_locale`).

Primary colours: **green** + **maroon**. **PWA**-ready.

## Withdrawals

- User enters **net** USDT to receive; platform fee is **2 USDT** (added on top). Minimum net **10 USDT**.
- Status flow: **Pending** → agent **Take charge** → **Processing** (visible to all agents) → **Completed** / **Rejected**.

## Agent workflow

1. Open **`/admin/withdrawals`** — filter **Open + In progress**, or single status.
2. Open a row → **Take charge** → status becomes **Processing**, others see **busy**.
3. Send funds externally → paste **TXID** → **✓ Sent**, or **✕ Refund**.

## Setup

1. Copy `.env.example` → `.env`. Set **`JWT_SECRET`** (≥ 16 chars). **`SUPER_ADMIN_EMAILS`** for bootstrap admins.

2. `npm install` && `npm run db:push`

3. `npm run dev`

4. Optional: `npm run verify:binance` — validates Binance keys.

## Roles

| Role          | Access                          |
|---------------|----------------------------------|
| `user`        | `/app` deposit & withdraw        |
| `agent`       | `/admin` queue, claim, complete  |
| `super_admin` | Above + **`/admin/users`** roles |

## Deploy

Set **`DATABASE_URL`**, **`JWT_SECRET`**, **`SUPER_ADMIN_EMAILS`**, **`BINANCE_*`** on Vercel / Render. Run **`npm run db:push`** on production DB once.

## License

Private / your terms — adjust as needed.
