# McB token — Phase 3 deploy & claim portal

On-chain **McB** (BEP-20 on BSC) + KYC-gated **BP → McB** claim queue in McBuleli.

## App (live after deploy)

| Piece | Location |
|-------|----------|
| User claim UI | `/app/wallet/points` — McB section |
| User API | `GET/POST /api/rewards/claim` |
| Admin queue | `/admin/mcb-claims` (super-admin) |
| Admin API | `/api/admin/mcb-claims` |

**Ratio:** 100 BP = 1 McB (config: `REWARD_BP_PER_MCB_CLAIM`).

## Env (Render)

```env
# Preview UI before go-live (shows ratio + form disabled)
NEXT_PUBLIC_MCB_CLAIM_PREVIEW=true

# Accept claims + burn BP (set when treasury is ready)
MCB_CLAIM_ENABLED=true

# After BEP-20 deploy on BSC mainnet
MCB_TOKEN_CONTRACT=0xYourContractAddress

# Optional
MCB_CLAIM_MIN_BP=100
MCB_PANCAKESWAP_URL=https://pancakeswap.finance/swap?outputCurrency=0x...
```

## Migration

```bash
cd /Users/mac/Documents/McBuleliP2P
npm run db:migrate:render
```

Applies `0054_mcb_claims.sql` (`mcb_claims` table).

## BEP-20 deploy (BSC)

1. Open [`contracts/McBuleliToken.sol`](../contracts/McBuleliToken.sol) in [Remix](https://remix.ethereum.org) or Hardhat.
2. Compile with Solidity **0.8.20**.
3. Deploy on **BNB Smart Chain** (mainnet) with constructor arg `initialSupply` in **wei** (18 decimals).  
   Example: 100M McB → `100000000000000000000000000`.
4. Send treasury allocation to a **multisig** (not a hot EOA on Render).
5. Set `MCB_TOKEN_CONTRACT` on Render.

## Claim flow

1. User (KYC **approved**) submits BEP20 address + BP amount (multiple of 100).
2. App **burns BP** immediately, creates `mcb_claims` row `pending`.
3. Super-admin sends McB from treasury on BSC → pastes **tx hash** in `/admin/mcb-claims`.
4. On reject → BP refunded to user balance.

## PancakeSwap (small pool)

After deploy:

1. Create **McB / BNB** or **McB / USDT** pair on PancakeSwap v2.
2. Seed modest liquidity (e.g. $500–2k) from treasury — not investment advice.
3. Lock LP tokens (e.g. [Team Finance](https://www.team.finance/) or PinkLock).
4. Set `MCB_PANCAKESWAP_URL` for the in-app link.

## Legal

Utility token only — no price promises, no ICO. McB is for **fee discounts & ecosystem perks** (Phase 4). KYC-gated claims reduce sybil abuse.

See also: [`utility-token-roadmap.md`](utility-token-roadmap.md).
