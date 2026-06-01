# McB token — Phase 3 deploy & claim portal

On-chain **McB** (**BEP-20** on BNB Smart Chain) + KYC-gated **BP → McB** claim queue in McBuleli.

## BEP-20 vs “ERC-20” in Remix

Remix and BscScan often label the contract **ERC-20** because the bytecode interface is the same as Ethereum ERC-20. On **BNB Smart Chain (chainId 56)** your token is **BEP-20**.

| Standard | Chain | McBuleli |
|----------|-------|----------|
| BEP-20 | BNB Smart Chain | McB claims, PancakeSwap, `BEP20` addresses |
| ERC-20 | Ethereum | Not used for McB |

Official guide: [Creating BEP-20 tokens on BNB Smart Chain](https://www.bnbchain.org/en/blog/your-guide-to-creating-bep-20-tokens-on-bnb-smart-chain).

Required methods (all implemented in `contracts/McBuleliToken.sol`):

- `totalSupply()`, `balanceOf()`, `transfer()`, `allowance()`, `approve()`, `transferFrom()`

## Mainnet contract (deployed)

| | |
|---|---|
| Name | McBuleliToken |
| Symbol | McB |
| Standard | BEP-20 (BSC) |
| Address | `0x2D2bB686E52bD85057AdBFd1CD0a2b5A1e6aC4Cd` |
| BscScan | https://bscscan.com/token/0x2D2bB686E52bD85057AdBFd1CD0a2b5A1e6aC4Cd |

## App (live after deploy)

| Piece | Location |
|-------|----------|
| User claim UI | `/app/wallet/points` — McB section |
| User API | `GET/POST /api/rewards/claim` |
| Admin queue | `/admin/mcb-claims` (super-admin) |
| Admin API | `/api/admin/mcb-claims` |

**Ratio:** 100 BP = 1 McB (`REWARD_BP_PER_MCB_CLAIM`).

Claim wallets use the same validation as **USDT BEP20** withdrawals (`0x` + 40 hex).

## Env (Render)

```env
# BEP-20 contract on BSC mainnet (required for explorer link + PancakeSwap default URL)
MCB_TOKEN_CONTRACT=0x2D2bB686E52bD85057AdBFd1CD0a2b5A1e6aC4Cd

# Accept claims + burn BP (when treasury is ready)
MCB_CLAIM_ENABLED=true

# Optional — defaults to PancakeSwap swap with outputCurrency=MCB_TOKEN_CONTRACT
# MCB_PANCAKESWAP_URL=https://pancakeswap.finance/swap?outputCurrency=0x2D2bB686E52bD85057AdBFd1CD0a2b5A1e6aC4Cd

MCB_CLAIM_MIN_BP=100
```

Hide claim UI until ready: `NEXT_PUBLIC_MCB_CLAIM_PREVIEW=false`

## Migration

```bash
cd /Users/mac/Documents/McBuleliP2P
npm run db:migrate:render
```

Applies `0054_mcb_claims.sql`.

## Deploy checklist (BSC)

1. Remix → compile `McBuleliToken.sol` (Solidity **0.8.20**).
2. Deploy with **Injected Provider** on **BNB Smart Chain** (not Ethereum mainnet).
3. Constructor `initialSupply` in **wei** (18 decimals).
4. Verify source on **BscScan** (improves trust for PancakeSwap / wallets).
5. Move treasury balance to **multisig**; document owner/mint policy.
6. Set `MCB_TOKEN_CONTRACT` on Render → redeploy web service.

See also [`contracts/README.md`](../contracts/README.md).

## Claim flow

1. User (KYC **approved**) submits **BEP20** address + BP (multiple of 100).
2. App debits BP, creates `mcb_claims` row `pending`.
3. Super-admin sends McB on BSC → pastes tx hash in `/admin/mcb-claims`.
4. Reject → BP refunded.

## PancakeSwap

1. Import token by contract address on [PancakeSwap](https://pancakeswap.finance) (BSC).
2. Add liquidity McB/WBNB or McB/USDT.
3. Lock LP.
4. App link uses `MCB_PANCAKESWAP_URL` or auto-builds from `MCB_TOKEN_CONTRACT`.

## Legal

Utility token only — no price promises, no ICO.

See also: [`utility-token-roadmap.md`](utility-token-roadmap.md).
