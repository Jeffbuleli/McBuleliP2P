# Deploy McB — upload fichier (sans copier-coller)

> Évite de coller le code dans Remix (casse l’indentation).  
> Fichiers prêts : ce dossier.

| Fichier | Usage |
|---------|--------|
| `McBuleliToken.sol` | Upload direct dans Remix |
| `McBuleliToken-remix.zip` | Option : dézipper puis upload le `.sol` |

Chemin Mac :
`/Users/mac/Documents/McBuleliP2P/contracts/remix-upload/`

---

## Méthode A — Upload dans Remix (recommandé)

1. Ouvrir **https://remix.ethereum.org** (Chrome / Brave).
2. À gauche : icône **File explorer** (dossier).
3. Bouton **Upload** (flèche vers le haut) ou menu `⋯` → **Upload File**.
4. Choisir **`McBuleliToken.sol`** (ce dossier).
5. Le fichier apparaît dans le workspace — **ne pas** retaper le code.
6. Onglet **Solidity Compiler** :
   - Compiler : **0.8.20**
   - Cocher Auto compile (optionnel)
   - **Compile McBuleliToken.sol**
7. Onglet **Deploy & Run** — voir section MetaMask ci-dessous.

---

## Méthode B — WalletConnect (MetaMask téléphone, plus simple)

Si MetaMask **PC** est pénible :

1. Dans Remix → Deploy → Environment → **WalletConnect**.
2. Scanner le QR avec **MetaMask mobile**.
3. Sur le téléphone : réseau **BNB Smart Chain** + BNB pour le gas.
4. Deploy depuis Remix (le téléphone confirme la signature).

---

## Méthode C — MetaMask extension PC

1. Environment → **Injected Provider - MetaMask**.
2. MetaMask : réseau **BNB Smart Chain** (chainId **56**), pas Ethereum.
3. Compte deployer avec ~0.02–0.05 BNB.

---

## Paramètres Deploy (identiques A/B/C)

| Champ | Valeur exacte |
|-------|----------------|
| Contract | `McBuleliToken` |
| **VALUE** (Ether) | **`0`** — obligatoire |
| `initialSupply` | `100000000000000000000000000` |
| Gas | Auto |

Cliquer **Deploy** → confirmer dans MetaMask (PC ou téléphone).

---

## Après succès — noter

Sous **Deployed Contracts** :

```
McBuleliToken at 0x................
```

→ C’est `MCB_TOKEN_CONTRACT` (adresse **contrat**, pas le wallet).

Envoyer cette adresse à l’équipe / coller dans `.env` + Render.

---

## Vérifs rapides

- Remix compile sans erreur rouge.
- Tx visible sur [bscscan.com](https://bscscan.com) (votre wallet → Contract Creation).
- `VALUE` n’était **pas** la supply (sinon erreur « insufficient funds » avec un gros amount).

Détail : [docs/mcb-bsc-deploy-checklist.md](../../docs/mcb-bsc-deploy-checklist.md)
