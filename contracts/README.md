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

**Sans copier-coller** (recommandé) : upload le fichier depuis  
[`contracts/remix-upload/`](./remix-upload/) — voir [`remix-upload/README.md`](./remix-upload/README.md).

1. [Remix](https://remix.ethereum.org) → **Upload** `McBuleliToken.sol` (ne pas coller le code).
2. Compile **0.8.20**.
3. Deploy → **Injected Provider** ou **WalletConnect** (MetaMask téléphone) → réseau **BNB Smart Chain**.
4. Constructor: `initialSupply` = `100000000000000000000000000` ; **VALUE = 0**.
5. Copy **contract** address → set `MCB_TOKEN_CONTRACT` on Render.
6. Verify on [BscScan](https://bscscan.com/verifyContract).
7. Transfer treasury supply to multisig if needed.

## App integration

- Claim wallets validated as **BEP20** (`0x` + 40 hex).
- PancakeSwap: import token by **contract** address.

See [`docs/mcb-token-phase3.md`](../docs/mcb-token-phase3.md).
