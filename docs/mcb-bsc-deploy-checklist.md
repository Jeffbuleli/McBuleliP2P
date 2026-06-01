# McB — Débloquer le deploy BSC mainnet (Remix + MetaMask)

Tu as déjà réussi sur **Remix VM** (`0xd914…` = test local). Pour **finir BSC**, il faut **refaire le même deploy** sur **BNB Smart Chain** avec MetaMask.

## Où tu es bloqué ? (diagnostic rapide)

| Symptôme | Cause | Fix |
|----------|--------|-----|
| `sender doesn't have enough funds` + `value=100000…000` | **VALUE** = supply au lieu du constructeur | **VALUE = 0**, supply dans `initialSupply` |
| Compte `0x5B38…` | Tu es sur **Remix VM**, pas MetaMask | Passer à **Injected Provider** |
| MetaMask ne propose pas de signer | Mauvais réseau (Ethereum au lieu de BSC) | Choisir **BNB Smart Chain** (chainId 56) |
| `insufficient funds` avec VALUE=0 | Pas assez de **BNB** pour le gas | Envoyer ~**0.01–0.05 BNB** sur le wallet deployer |
| Tu copies l’adresse du wallet | Confusion wallet / contrat | Adresse sous **Deployed Contracts → McBuleliToken** |
| Rien sur BscScan | Deploy seulement en VM | Refaire deploy avec **Injected** sur BSC |

## Checklist deploy BSC (15 min)

### 1. MetaMask

1. Installer [MetaMask](https://metamask.io) (ou l’app que tu utilises).
2. Ajouter le réseau **BNB Smart Chain** (chainId **56**) si absent.  
   - RPC : `https://bsc-dataseed.binance.org`  
   - Explorer : `https://bscscan.com`
3. Wallet **burner** (recommandé) : nouveau compte, pas ton wallet principal.
4. Envoyer **0.02–0.05 BNB** sur ce wallet (frais deploy ~0.002–0.01 BNB selon le gas).

### 2. Remix

1. Ouvrir [remix.ethereum.org](https://remix.ethereum.org).
2. Coller `contracts/McBuleliToken.sol` du repo (compile **0.8.20**, pas d’erreur NatSpec).
3. **Deploy & run** (icône Ethereum en bas à gauche).

### 3. Environnement (le point qui bloque souvent)

| Champ | Valeur |
|-------|--------|
| **Environment** | **Injected Provider - MetaMask** (pas Remix VM) |
| **Account** | Ton adresse MetaMask `0x…` (pas `0x5B38…`) |
| **Contract** | `McBuleliToken` |

MetaMask doit afficher **BNB Smart Chain** quand Remix demande le réseau.

### 4. Paramètres de deploy

| Champ | Valeur |
|-------|--------|
| **VALUE** | `0` |
| **initialSupply** (uint256) | `100000000000000000000000000` (= 100M McB, 18 décimales) |
| **Gas** | laisser **auto** |

Cliquer **Deploy** → confirmer dans MetaMask.

### 5. Copier la bonne adresse

Sous **Deployed Contracts** :

```
McBuleliToken at 0xABCD...1234   ← CETTE adresse = MCB_TOKEN_CONTRACT
```

Pas l’adresse en haut « Account ».

### 6. Vérifier sur BscScan

1. Ouvrir `https://bscscan.com/address/0x<TON_CONTRAT>`
2. Onglet **Contract** doit exister.
3. Tx **Contract Creation** depuis ton wallet.

### 7. Render (McBuleli app)

```env
MCB_TOKEN_CONTRACT=0x<adresse_contrat_BSC>
MCB_CLAIM_ENABLED=false   # true quand trésorerie prête à envoyer McB
```

Redéployer le service web Render après changement d’env.

## Test optionnel avant mainnet : BSC Testnet

Si tu veux t’entraîner sans BNB réel :

1. MetaMask → **BSC Testnet** (chainId 97).
2. BNB test : [BSC testnet faucet](https://testnet.bnbchain.org/faucet-smart).
3. Même deploy Remix (Injected).
4. L’adresse testnet **ne va pas** sur Dexscreener mainnet — uniquement pour pratique.

## Après deploy mainnet

1. `balanceOf` (Remix) → ton wallet → doit montrer 100M McB.
2. Transférer une partie vers multisig trésorerie.
3. (Plus tard) PancakeSwap + liquidité → Dexscreener.
4. Activer claims dans l’app quand prêt.

## Fichier contrat

[`contracts/McBuleliToken.sol`](../contracts/McBuleliToken.sol) — identique à celui qui a compilé en VM.
