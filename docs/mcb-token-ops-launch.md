# McB - Ops lancement (parallèle au Whitepaper)

> Checklist ops pour le jeton utilitaire **McB** (BEP-20 BSC).  
> **Règle :** aucune promesse de prix dans le Whitepaper, le marketing, ou l’UI claim.  
> Liés : [mcb-bsc-deploy-checklist.md](./mcb-bsc-deploy-checklist.md) · [mcb-token-phase3.md](./mcb-token-phase3.md) · [mcbuleli-constitution-outline.md](./mcbuleli-constitution-outline.md)

---

## 1. Avant toute activation publique des claims

| # | Action | Done? |
|---|--------|-------|
| 1 | Contrat déployé sur **BNB Smart Chain mainnet** (pas Remix VM) | ☐ |
| 2 | Adresse **contrat** (pas wallet) dans `MCB_TOKEN_CONTRACT` Render | ☐ |
| 3 | Source vérifiée sur BscScan | ☐ |
| 4 | Supply / owner documentés ; trésorerie sur **multisig** | ☐ |
| 5 | Solde trésorerie suffisant pour le **pilote** claim | ☐ |
| 6 | `MCB_CLAIM_ENABLED=false` jusqu’à prêt | ☐ |
| 7 | UI preview OK (`NEXT_PUBLIC_MCB_CLAIM_PREVIEW`) | ☐ |
| 8 | Process admin `/admin/mcb-claims` testé (complete + reject/refund BP) | ☐ |

---

## 2. Pilote claim (restreint)

1. Activer `MCB_CLAIM_ENABLED=true` seulement pour le pilote.
2. Limiter via KYC + communication interne (équipe, beta users).
3. Mesurer : claims pending → completed, délais, erreurs wallet.
4. Documenter chaque envoi (tx hash BscScan).
5. Ne pas annoncer de cours, d’APY, ni de « listing date = pump ».

---

## 3. Liquidité (après pilote)

| Étape | Note |
|-------|------|
| PancakeSwap McB/USDT ou McB/WBNB | Montant initial **modeste** (doc Phase 3 : 5–10k USD cible plus tard) |
| Lock LP | Recommandé avant communication élargie |
| `MCB_PANCAKESWAP_URL` | Optionnel si auto depuis contrat |
| Phase 4 | 30–50k USD, CoinGecko/CMC - **roadmap**, pas engagement WP v1.0 |

---

## 4. Communication autorisée

**OK :** utility token, claim BP→McB, réduction de frais (quand live), lien BscScan, Constitution `/whitepaper`.

**Interdit :** promesse de prix, rendement McB, ICO, « get rich », garanties de listing.

---

## 5. Lien Whitepaper

La page publique [`/whitepaper`](https://mcbuleli.org/whitepaper) décrit l’économie **sans** date de listing ni prix. Toute mise à jour ops (contrat live, claim ouvert) peut ajouter un fait vérifié dans la Constitution (bump semver 1.0 → 1.1).
