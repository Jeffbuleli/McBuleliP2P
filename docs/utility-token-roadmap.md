# Buleli Points — Utility token roadmap

McBuleli’s ecosystem utility layer: **Buleli Points (BP)** off-chain first, on-chain **McB** later.

## Phase 1 (live) — Off-chain BP

- Ledger + balance in PostgreSQL
- Earn: KYC approved (+100 BP), first bot subscription (+150 BP), email verified (+10 BP)
- UI: `/app/wallet/points`
- Monthly earn cap: 2,000 BP / user (anti-farming); **one-shot grants skip cap on reconcile/backfill**
- **Retroactive credit:** `reconcileUserRewardPoints` on login + points page; bulk: `npm run db:backfill-reward-points` or `POST /api/internal/rewards/backfill` with `x-cron-secret`

## Phase 2 — Expand earn & spend

- P2P volume, staking, AVEC, referral mix USDT + BP
- Spend: fee discounts (P2P, withdraw, bot renewal)

## Phase 3 — On-chain McB

- BEP-20 deploy, KYC-gated claim portal (BP → McB)
- Small PancakeSwap pool + LP lock

## Phase 4 — DEX scale

- 30–50k USD liquidity, CoinGecko/CMC, pay fees in McB (−25%, partial burn)

## Legal

Utility only — no price promises, no ICO. Certification Google/Meta per country when promoting crypto features.

See product chat (May 2026) for full earn/spend matrix and tokenomics sketch.
