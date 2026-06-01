# McBuleliToken — BEP-20 on BNB Smart Chain

## ERC-20 vs BEP-20 (Remix)

If Remix shows **"Type: ERC-20 Token"**, that is expected on BSC:

| | BEP-20 | ERC-20 |
|---|--------|--------|
| Blockchain | BNB Smart Chain | Ethereum |
| Interface | Same EVM methods | Same |
| McBuleli app network | `BEP20` | — |

Source: [BNB Chain — Creating BEP-20 tokens](https://www.bnbchain.org/en/blog/your-guide-to-creating-bep-20-tokens-on-bnb-smart-chain).

## BEP-20 checklist (this contract)

| Method | `McBuleliToken.sol` |
|--------|---------------------|
| `totalSupply()` | `public totalSupply` |
| `balanceOf(address)` | `balanceOf` mapping |
| `transfer(address,uint256)` | yes |
| `allowance(address,address)` | `allowance` mapping |
| `approve(address,uint256)` | yes |
| `transferFrom(address,address,uint256)` | yes |

Plus metadata: `name`, `symbol`, `decimals` (18).

## Mainnet deploy (reference)

| Field | Value |
|-------|--------|
| Contract | `McBuleliToken` |
| Chain | BNB Smart Chain (56) |
| Address | `0x2D2bB686E52bD85057AdBFd1CD0a2b5A1e6aC4Cd` |
| Explorer | https://bscscan.com/token/0x2D2bB686E52bD85057AdBFd1CD0a2b5A1e6aC4Cd |

Set on Render: `MCB_TOKEN_CONTRACT=0x2D2bB686E52bD85057AdBFd1CD0a2b5A1e6aC4Cd`

## Remix deploy steps

1. [Remix](https://remix.ethereum.org) → compile `McBuleliToken.sol` (0.8.20).
2. Deploy → **Injected Provider** → wallet on **BNB Smart Chain** (not Ethereum).
3. Constructor: `initialSupply` in **wei** (e.g. `100000000000000000000000000` = 100M tokens).
4. Verify on [BscScan](https://bscscan.com/verifyContract) (same source + compiler settings).
5. Transfer treasury supply to multisig; revoke/minimize owner mint if policy requires fixed supply.

## App integration

- Claim wallets validated as **BEP20** (`0x` + 40 hex) — same as USDT BEP20 withdrawals.
- PancakeSwap: pair McB/WBNB or McB/USDT after liquidity seed.

See [`docs/mcb-token-phase3.md`](../docs/mcb-token-phase3.md).
