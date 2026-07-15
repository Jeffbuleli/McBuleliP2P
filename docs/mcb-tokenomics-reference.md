# McB Tokenomics - Document de référence

> **Statut :** référence produit & technique - à mettre à jour à chaque phase.  
> **Dernière révision :** juillet 2026  
> **Documents liés :** [utility-token-roadmap.md](./utility-token-roadmap.md) · [mcb-token-phase3.md](./mcb-token-phase3.md) · [mcb-bsc-deploy-checklist.md](./mcb-bsc-deploy-checklist.md) · [game-architecture.md](./game-architecture.md) · [mcbuleli-constitution-outline.md](./mcbuleli-constitution-outline.md) · [builders-program-spec.md](./builders-program-spec.md)

---

## 1. Vision

**McBuleli** vise un jeton utilitaire **McB** au centre d’une économie multi-produits (wallet, P2P, trade, Academy, Community, AVEC, bots, jeu).

Principe directeur :

| Couche | Rôle | Instrument |
|--------|------|------------|
| **Engagement** | Récompenser les actions utiles, anti-farming | **BP** (Buleli Points, off-chain) |
| **Utilité** | Réduire les frais, débloquer des accès | **McB** (BEP-20 BSC) |
| **Valeur stable** | Échanges, épargne, trade | **USDT / PI** (wallet custodial) |

**Règle :** pas d’ICO, pas de promesse de prix. Utility only - certification marketing selon pays.

---

## 2. État actuel (audit code)

### 2.1 Les trois « McB » (à ne pas confondre)

| Nom affiché | Stockage | Fichiers clés | Lié au wallet ? |
|-------------|----------|---------------|-----------------|
| **Buleli Points (BP)** | `users.buleliPointsBalance` + ledger | `src/lib/reward-points-config.ts`, `reward-points-service.ts` | Oui |
| **McB on-chain** | BSC BEP-20 | `contracts/McBuleliToken.sol`, `mcb-claim-service.ts` | Via claim (100 BP = 1 McB) |
| **McB jeu** | `game_players.mcb_balance` | `docs/game-architecture.md`, `game/` | **Non** - silo séparé |

**Action UX future :** renommer le McB jeu en « Crédits jeu » pour éviter la confusion.

### 2.2 Conversion BP → McB

| Paramètre | Valeur | Source |
|-----------|--------|--------|
| Ratio | **100 BP = 1 McB** | `REWARD_BP_PER_MCB_CLAIM` |
| Claim minimum | 100 BP (défaut) | `MCB_CLAIM_MIN_BP` |
| Chaîne | BEP-20, BSC chainId 56 | `mcb-token-config.ts` |
| Gate claim | KYC approuvé + `MCB_CLAIM_ENABLED=true` | env Render |
| Fulfillment | File admin `mcb_claims` → hash BSC manuel | `/admin/mcb-claims` |

### 2.3 Plafonds & anti-farming

| Règle | Valeur code | Note |
|-------|-------------|------|
| Plafond mensuel earn BP | **4 000 BP / user / mois UTC** | `REWARD_MONTHLY_EARN_CAP` |
| Plafonds journaliers Community | Par type (ex. 8 posts texte/j, 50 likes/j) | `COMMUNITY_REWARD_DAILY_CAPS` |
| Idempotence | `(userId, idempotencyKey)` sur `reward_point_grants` | - |

> ⚠️ `utility-token-roadmap.md` mentionne encore **2 000 BP/mois** - **obsolète** ; la référence est **4 000** dans le code.

### 2.4 Earn BP - branché en production

| Grant | BP | Déclencheur |
|-------|-----|-------------|
| `email_verified` | 10 | Vérification email |
| `kyc_approved` | 100 | KYC Didit approuvé |
| `bot_first_subscription` | 150 | Premier abo bot |
| `staking_opened` | 30 | Ouverture stake USDT/PI |
| `staking_matured` | 50 | Maturité stake |
| `p2p_trade_completed` | 20 | P2P libéré (acheteur) |
| `training_enrolled` | 25 | Inscription cohorte Academy |
| `training_session_attended` | 40 | Présence live Academy |
| `training_quiz_passed` | 60 | Quiz réussi |
| Community (profil, posts, likes, Q&A, signaux, follow, etc.) | 2–100 | `community/rewards-service.ts` |

### 2.5 Earn BP - codé mais non branché

| Grant | BP | Problème |
|-------|-----|----------|
| `community_live_join` | 35 | **Aucun appel** depuis academy/live |

### 2.6 Spend BP - branché

| Sink | Coût | Effet | Durée |
|------|------|-------|-------|
| P2P fee −15 % | 80 BP | Perk `p2p_fee_discount_15` | 30 j |
| Bot renewal −10 % | 200 BP | Perk renouvellement bot | 14 j |
| Game boosts | 15–40 BP | Énergie / outil / marché | immédiat |
| Claim McB | multiples de 100 BP | Débit BP → file `mcb_claims` | - |

### 2.7 Économie USDT/PI (hors McB/BP)

Produits avec ledger wallet propre (`wallet-ledger.ts`) :

- P2P escrow, frais plateforme (USDT)
- Trade futures/options (5 bps/side) → 60 % vers LP pool si activé
- Staking USDT/PI (6–12 % APR selon durée)
- AVEC (contributions, prêts, cycles)
- Academy payante, bots, fiat deposit/withdraw
- Referral USDT (50 % 1er dépôt fiat, 1 USDT 1er dépôt on-chain)

**Aucun earn/spend BP** sur trade, AVEC, withdraw aujourd’hui (prévu Phase 2b roadmap).

### 2.8 Reconcile / backfill

`reconcileUserRewardPoints` au login + page points couvre :

- email, KYC, bot, staking, P2P

**Manque :** Academy, Community (crédits rétroactifs incomplets).

Script bulk : `npm run db:backfill-reward-points`.

---

## 3. Architecture cible

```
┌─────────────────────────────────────────────────────────────┐
│                    ACTIONS UTILISATEUR                       │
│  KYC · Community · Academy · P2P · Trade · AVEC · Bots · Jeu │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              BULELI POINTS (BP) - off-chain                  │
│  Plafond 4000/mois · caps journaliers · ledger audit         │
└────────────┬───────────────────────────────┬────────────────┘
             ▼                               ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│   SPEND BP (sinks)      │    │   CLAIM → McB (BEP-20 BSC)    │
│   perks · accès · jeu   │    │   100 BP = 1 McB · KYC        │
└────────────┬───────────┘    └──────────────┬───────────────┘
             ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    McB ON-CHAIN (utilité)                    │
│  Frais −25 % · LP · staking McB · gouvernance paramètres   │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 USDT / PI (valeur stable)                    │
│  P2P · Trade · Staking yield · AVEC · Wallet                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Matrice earn / spend cible

### 4.1 Existant (live)

| Produit | Earn BP | Spend BP / McB |
|---------|---------|----------------|
| Onboarding | Email 10, KYC 100 | - |
| Bots | 1er abo 150 | Renewal −10 % (200 BP) |
| Staking | Open 30, Mature 50 | - |
| P2P | Trade buyer 20 | Fee −15 % (80 BP) |
| Academy | Enroll 25, Live 40, Quiz 60 | - |
| Community | 2–100 selon action | - |
| Jeu | - | Boosts 15–40 BP |
| McB | - | Claim 100 BP → 1 McB |

### 4.2 Court terme (0–3 mois) - proposé

| Produit | Earn (nouveau / fix) | Spend (nouveau) |
|---------|----------------------|-----------------|
| Academy / Community | **Brancher** `community_live_join` 35 | Badge Formation 150 BP |
| Community | Post Formation publié +40 | Épinglage carte 7j 80 BP |
| Trading | - | Accès fil signaux Pro 200 BP/mois |
| Trading | - | Boost signal 24h 50 BP |
| Wallet | - | Frais retrait −10 % (1×) 120 BP |
| Academy | - | Preview Pro 1 mois 300 BP |

### 4.3 Moyen terme (3–9 mois) - proposé

| Produit | Earn | Spend |
|---------|------|-------|
| P2P | +10 BP vendeur KYC | Listing boost 48h 60 BP |
| Referral | 50 BP parrain + 25 filleul (1er trade) | - |
| AVEC | +15 BP contribution cycle validé | −5 % frais groupe 200 BP |
| Academy | +100 BP parcours cohorte complet | Paiement partiel module en BP (max 30 % prix) |
| Trade | Leaderboard mensuel (pool 500 BP) | Paper trading 7j 100 BP |
| Community | Multiplicateur réputation ×1.1–×1.5 | - |

### 4.4 Long terme (9–24 mois) - proposé

| Mécanisme | Détail |
|-----------|--------|
| Frais en McB | Trade −25 %, P2P −15 %, withdraw −10 % |
| Burn | 30 % des McB reçus en frais brûlés, 70 % trésorerie |
| Staking McB | Boost earn BP ou petit pool USDT |
| LP McB/USDT | Récompenses PancakeSwap |
| Gouvernance légère | McB staké → vote paramètres (caps, burn %, sinks) |
| Game bridge | Crédits jeu → BP (one-way, plafonné) |

---

## 5. Plan par horizon

### Phase A - Court terme (0–3 mois) : Brancher & clarifier

**Objectif utilisateur :** comprendre et dépenser les BP immédiatement.

| # | Action | Priorité |
|---|--------|----------|
| A1 | Brancher `community_live_join` sur présence live Academy | P0 |
| A2 | Étendre `reconcileUserRewardPoints` à Academy + Community | P0 |
| A3 | Ledger BP pour dépenses game boosts | P1 |
| A4 | UX : distinguer BP / McB wallet / Crédits jeu | P1 |
| A5 | Activer sinks court terme (retrait, signal, badge formation) | P1 |
| A6 | Pilote claim McB (groupe restreint, trésorerie multisig) | P2 |

**KPI :**

- % users avec BP > 0
- Ratio BP dépensés / BP gagnés (cible > 30 %)
- Claims McB complétés vs rejetés

### Phase B - Moyen terme (3–9 mois) : McB = carburant

**Objectif utilisateur :** BP/McB réduit le coût réel d’usage (frais, accès).

| # | Action |
|---|--------|
| B1 | Referral BP + P2P seller reward |
| B2 | AVEC BP earn/spend |
| B3 | Academy parcours bonus + paiement partiel BP |
| B4 | Trade perks + leaderboard BP |
| B5 | Déployer McB BSC + BscScan verify + liquidité initiale (5–10k USD) |
| B6 | Claim auto ≤ seuil (ex. 10 McB), manuel au-delà |

**KPI :**

- BP monthly burn rate > 40 %
- Volume P2P/trade avec perk actif
- McB claimée vs trésorerie

### Phase C - Long terme (9–24 mois) : McB utilitaire on-chain

**Objectif utilisateur :** fidélité récompensée, frais réduits en McB.

| # | Action |
|---|--------|
| C1 | Paiement frais plateforme en McB (−25 %) + burn 30 % |
| C2 | Staking McB + LP rewards |
| C3 | Gouvernance paramètres (non-DAO lourde) |
| C4 | Bridge jeu → BP limité |
| C5 | Liquidité 30–50k USD, listings CoinGecko/CMC |

---

## 6. Supply on-chain (proposition conservative)

| Allocation | % suggéré | Notes |
|------------|-----------|-------|
| Émission via claim BP | 40 % | Plafond mensuel global claim |
| Réserve écosystème (LP, rewards) | 35 % | Trésorerie ops |
| Équipe / ops | 15 % | Vesting 4 ans |
| Partenariats | 10 % | - |
| **Supply max contrat** | 100M McB | `McBuleliToken` owner-mint |

Pas d’ICO - émission liée à l’utilité réelle.

---

## 7. Lacunes techniques (backlog)

| ID | Lacune | Fichiers / zone |
|----|--------|-----------------|
| G1 | `community_live_join` non appelé | `academy-service.ts`, live attendance |
| G2 | Reconcile sans Academy/Community | `reward-points-service.ts` |
| G3 | Game BP spend sans ledger | `game/bp-boosts.ts` |
| G4 | Claim McB 100 % manuel | `mcb-claim-service.ts`, admin |
| G5 | 3 namespaces McB non unifiés | game vs wallet vs chain |
| G6 | Trade / AVEC / withdraw sans BP | roadmap Phase 2b |
| G7 | `deposit_launch_rewards` table sans service | drizzle 0079 |
| G8 | Doc roadmap 2000 BP vs code 4000 | `utility-token-roadmap.md` |
| G9 | Réputation / badges Community | `community-hub-master-plan.md` - non implémenté |

---

## 8. Fichiers de référence code

| Domaine | Chemin |
|---------|--------|
| Config BP earn/spend | `src/lib/reward-points-config.ts` |
| Moteur grants | `src/lib/reward-points-service.ts` |
| Perks spend | `src/lib/reward-point-perks.ts` |
| Community rewards | `src/lib/community/rewards-service.ts` |
| Catalog UI Community | `src/lib/community/rewards-catalog.ts` |
| Claim McB | `src/lib/mcb-claim-service.ts`, `src/lib/mcb-token-config.ts` |
| Contrat | `contracts/McBuleliToken.sol` |
| UI points | `src/app/app/wallet/points/page.tsx` |
| Admin claims | `src/app/admin/mcb-claims/page.tsx` |
| APIs | `/api/rewards/me`, `spend`, `claim` |
| Wallet ledger (USDT) | `src/lib/wallet-ledger.ts` |
| Staking | `src/lib/staking-config.ts` |
| P2P fees | `src/lib/p2p-config.ts` |
| Trade fees | `src/lib/trade-config.ts` |
| Game BP | `src/lib/game/bp-boosts.ts` |
| Backfill | `scripts/backfill-reward-points.mjs` |

---

## 9. Conformité & communication

- **Utility token only** - pas de promesse de rendement ou de prix.
- Claim McB **gated KYC** (aligné wallet withdraw crypto).
- Plafonds mensuels et caps journaliers = anti-farming documenté.
- Pays à risque : adapter messaging Google/Meta selon règles locales.
- Transparence : page `/app/wallet/points` avec historique ledger BP.

---

## 10. Prochaines étapes suggérées (quand on reprend)

1. Valider la **Phase A** (P0 : live join BP + reconcile).
2. Prioriser **2–3 sinks court terme** (retrait, signal, formation).
3. Décider **date pilote claim McB** + montant trésorerie initiale.
4. Mettre à jour `utility-token-roadmap.md` (cap 4000, lien vers ce doc).
5. Implémenter puis mesurer KPI Phase A avant Phase B.

---

*Document maintenu par l’équipe produit McBuleli. Pour toute modification des montants BP, mettre à jour `reward-points-config.ts` et ce fichier en même temps.*
