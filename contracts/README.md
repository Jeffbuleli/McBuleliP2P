# McBuleliToken — BEP-20 on BNB Smart Chain

## ERC-20 vs BEP-20 (Remix)

If Remix shows **"Type: ERC-20 Token"**, that is expected on BSC:

| | BEP-20 | ERC-20 |
|---|--------|--------|
| Blockchain | BNB Smart Chain | Ethereum |
| Interface | Same EVM methods | Same |
| McBuleli app network | `BEP20` | — |

Source: [BNB Chain — Creating BEP-20 tokens](https://www.bnbchain.org/en/blog/your-guide-to-creating-bep-20-tokens-on-bnb-smart-chain).

## Wallet address ≠ contract address

| | MetaMask wallet (EOA) | McBuleliToken contract |
|---|----------------------|-------------------------|
| Role | Pays gas, receives initial mint | Holds token logic + `totalSupply` |
| BscScan | No **Contract** tab | **Contract** tab + verified source |
| Use in app | Treasury can hold McB | `MCB_TOKEN_CONTRACT` env only |

**Never** put your personal wallet in `MCB_TOKEN_CONTRACT`.

### After deploy — copy the right address

1. Remix → **Deploy & run** → **Deployed Contracts** → **McBuleliToken** → address on the contract row.
2. BscScan → your wallet → tx **Contract Creation** → **Contract** field in receipt.

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

## Remix deploy steps

1. [Remix](https://remix.ethereum.org) → compile `McBuleliToken.sol` (0.8.20).
2. Deploy → **Injected Provider** → wallet on **BNB Smart Chain** (not Ethereum).
3. Constructor: `initialSupply` in **wei** (e.g. `100000000000000000000000000` = 100M tokens).
4. Copy **contract** address → set `MCB_TOKEN_CONTRACT` on Render.
5. Verify on [BscScan](https://bscscan.com/verifyContract).
6. Transfer treasury supply to multisig if needed.

## App integration

- Claim wallets validated as **BEP20** (`0x` + 40 hex).
- PancakeSwap: import token by **contract** address.

See [`docs/mcb-token-phase3.md`](../docs/mcb-token-phase3.md).
