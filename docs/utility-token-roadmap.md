# Buleli Points — Utility token roadmap

McBuleli’s ecosystem utility layer: **Buleli Points (BP)** off-chain first, on-chain **McB** later.

## Phase 1 (live) — Off-chain BP

- Ledger + balance in PostgreSQL
- Earn: KYC approved (+100 BP), first bot subscription (+150 BP), email verified (+10 BP)
- UI: `/app/wallet/points`
- Monthly earn cap: 2,000 BP / user (anti-farming); **one-shot grants skip cap on reconcile/backfill**
- **Retroactive credit:** `reconcileUserRewardPoints` on login + points page; bulk: `npm run db:backfill-reward-points` or `POST /api/internal/rewards/backfill` with `x-cron-secret`

## Phase 2 (live) — Expand earn & spend

- **Earn (repeatable):** staking opened (+30 BP), staking matured (+50 BP), P2P trade completed as buyer (+20 BP)
- **Spend:** P2P fee −15% (80 BP, 30d), bot renewal −10% (200 BP, 14d)
- UI: hero BP logo, spend section, active perks on `/app/wallet/points`
- Migration `0053_reward_points_phase2.sql` — idempotency keys + `reward_point_perks`
- Re-run backfill after deploy for retro staking/P2P credits

## Phase 2b (planned)

- AVEC, referral mix USDT + BP
- Withdraw fee discounts

## Phase 3 (live) — On-chain McB (BEP-20 BSC)

- **BEP-20 contract:** `McBuleliToken` — mainnet `0x2D2bB686E52bD85057AdBFd1CD0a2b5A1e6aC4Cd` (Remix label “ERC-20” = same interface on BSC)
- **Claim portal:** `/app/wallet/points` — KYC-gated BP → McB (100 BP = 1 McB), BEP20 wallet validation
- **Admin fulfillment:** `/admin/mcb-claims`
- Docs: `docs/mcb-token-phase3.md`, `contracts/README.md`
- Env: `MCB_TOKEN_CONTRACT`, `MCB_CLAIM_ENABLED`, optional `MCB_PANCAKESWAP_URL`
- **Next ops:** BscScan verify, treasury multisig, PancakeSwap liquidity + LP lock

## Phase 4 — DEX scale

- 30–50k USD liquidity, CoinGecko/CMC, pay fees in McB (−25%, partial burn)

## Legal

Utility only — no price promises, no ICO. Certification Google/Meta per country when promoting crypto features.

See product chat (May 2026) for full earn/spend matrix and tokenomics sketch.
