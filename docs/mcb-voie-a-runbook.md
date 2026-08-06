# McB — Voie A : mise en circulation (runbook ops)

> **Objectif :** passer de « code prêt » à **McB on-chain utilisable** (claim pilote → liquidité → Builders → Ads).  
> **Statut :** en cours — mettre à jour les cases à chaque étape.  
> **Dernière révision :** août 2026  
> **Liens :** [mcb-bsc-deploy-checklist.md](./mcb-bsc-deploy-checklist.md) · [mcb-token-ops-launch.md](./mcb-token-ops-launch.md) · [mcb-token-phase3.md](./mcb-token-phase3.md) · [builders-program-spec.md](./builders-program-spec.md) · [social-utility-ads-mcb.md](./social-utility-ads-mcb.md)

---

## État de départ (audit août 2026)

| Zone | Code app | Production |
|------|----------|------------|
| Claim BP → McB | ✅ Complet | ❌ `MCB_CLAIM_ENABLED` off |
| Pool claim 40M | ✅ `mcb-token-config.ts` | — |
| Admin `/admin/mcb-claims` | ✅ | — |
| Builders Program | ✅ | ❌ `BUILDERS_PROGRAM_ENABLED` off |
| Ads McB custodial | ✅ | ❌ `COMMUNITY_ADS_ENABLED` off |
| Contrat BSC mainnet | ✅ `McBuleliToken.sol` | ❌ Non déployé |
| Liquidité DEX | — | ❌ |

**Vérifier la config locale :** `npm run verify:mcb`

---

## Vue d’ensemble des étapes

```
A1 Deploy BSC + BscScan
        ↓
A2 Trésorerie multisig + wallet minter
        ↓
A3 Env VPS (contrat, taux USD, preview)
        ↓
A4 Pilote claim (KYC, groupe restreint)
        ↓
A5 Liquidité PancakeSwap + lock LP
        ↓
A6 Builders Program ON
        ↓
A7 Ads McB ON
```

**Règle :** ne pas activer A4 avant A1–A3. Ne pas activer A6 avant A5 (cours McB pour pricing USD→McB).

---

## A1 — Deploy contrat BSC mainnet

| # | Action | Done |
|---|--------|------|
| A1.1 | Wallet deployer avec **0.02–0.05 BNB** sur BSC (chainId 56) | ✅ |
| A1.2 | Remix → **Injected Provider** (pas Remix VM) | ✅ |
| A1.3 | Deploy `McBuleliToken.sol` — **VALUE = 0** | ✅ |
| A1.4 | `initialSupply` = `100000000000000000000000000` (100M × 10¹⁸) | ✅ |
| A1.5 | Copier adresse **contrat** (pas wallet) → noter ci-dessous | ✅ |
| A1.6 | Vérifier sur BscScan (onglet Contract) | ✅ |
| A1.7 | Verify source sur BscScan (Solidity 0.8.20) | ✅ |

**Détail pas-à-pas :** [mcb-bsc-deploy-checklist.md](./mcb-bsc-deploy-checklist.md)  
**Remix privé VPS (optionnel) :** [mcb-remix-vps.md](./mcb-remix-vps.md) — Docker + Nginx + MetaMask Injected Provider

### Registre deploy (à remplir)

| Champ | Valeur |
|-------|--------|
| Date deploy | 2026-08-06 |
| Adresse contrat `MCB_TOKEN_CONTRACT` | `0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147` |
| Wallet deployer (EOA) | `0x2d2bB686e52Bd85057AdbFd1CD0A2b5A1E6aC4CD` |
| Tx creation BscScan | [token](https://bscscan.com/token/0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147) |
| Supply initiale | 100 000 000 McB |
| Owner contrat actuel | `0x2d2bB686e52Bd85057AdbFd1CD0A2b5A1E6aC4CD` (détient 100M) |

---

## A2 — Trésorerie & wallet minter

| # | Action | Done |
|---|--------|------|
| A2.1 | Créer / désigner **multisig trésorerie** (recommandé) | ✅ `0x7Ada…Aa9` |
| A2.2 | Transférer McB depuis deployer → trésorerie (ex. 95M+) | ⏳ ~200k sur trésorerie ; ~99.7M encore sur owner (migrer plus tard) |
| A2.3 | Garder **hot wallet minter** pour claims pilote (ex. 50k–500k McB) | ✅ `0x6F66…E83D` (~100k McB + 0.01 BNB) |
| A2.4 | Documenter adresses (coffre-fort ops, pas dans git public) | ✅ |
| A2.5 | (Option) `transferOwnership` trésorerie sur le contrat | ☐ |

### Allocation suggérée (100M supply)

| Destination | McB | % | Usage |
|-------------|-----|---|--------|
| Trésorerie multisig | ~55M | 55% | Réserve écosystème + LP + ops |
| Pool claim (app cap) | 40M | 40% | Émission via BP (plafond app) |
| Hot minter pilote | 0.05–0.5M | <1% | Fulfillment manuel claims |
| Liquidité initiale | 2–5M | 2–5% | PancakeSwap (avec USDT/BNB) |

Le plafond **40M** est appliqué côté app (`MCB_CLAIM_POOL_CAP_MCB`) — la trésorerie physique doit pouvoir honorer les envois.

### Registre trésorerie

| Rôle | Adresse | Notes |
|------|---------|-------|
| Multisig / trésorerie | `0x7Ada926CA3d30d2b102a09333EF34144C13EaAa9` | `MCB_BUILDERS_TREASURY` — ~200k McB |
| Hot wallet minter (claims) | `0x6F6689182f83176830705443394228b5a536E83D` | ~100k McB + BNB gas — fulfillment manuel |
| Owner contrat (deployer) | `0x2d2bB686e52Bd85057AdbFd1CD0A2b5A1E6aC4CD` | ~99.7M McB restants — migrer vers trésorerie |

---

## A3 — Variables d’environnement (VPS + local)

McBuleli tourne sur le **VPS** (`ops/vps` / Docker), pas Render.  
Après A1, configurer **`/opt/mcbuleli/ops/vps/.env`** (ou le `.env` monté par `docker compose`), puis redémarrer le service web.

| Variable | Phase A3 | Exemple / note |
|----------|----------|----------------|
| `MCB_TOKEN_CONTRACT` | **Obligatoire** | `0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147` |
| `MCB_CLAIM_ENABLED` | `false` (jusqu’à A4) | |
| `MCB_CLAIM_POOL_CAP_MCB` | `40000000` | 40% supply |
| `MCB_CLAIM_MONTHLY_GLOBAL_CAP_MCB` | `50000` (pilote) ou `0` | Plafond mint/mois UTC |
| `MCB_CLAIM_MIN_BP` | `100` | 100 BP = 1 McB |
| `MCB_USD_RATE` | **Obligatoire avant Builders** | Ex. `0.01` (admin, pas promesse marché) |
| `MCB_BUILDERS_TREASURY` | Adresse réception McB Builders | |
| `BUILDERS_PROGRAM_ENABLED` | `false` (jusqu’à A6) | |
| `NEXT_PUBLIC_MCB_CLAIM_PREVIEW` | `true` (défaut) | UI visible avant claim ON |
| `NEXT_PUBLIC_BUILDERS_PREVIEW` | `true` | |
| `COMMUNITY_ADS_ENABLED` | `false` (jusqu’à A7) | |

**Vérification :** `npm run verify:mcb` (local) ; sur VPS après restart : page `/app/wallet/points` (lien BscScan).

### Checklist VPS

| # | Action | Done |
|---|--------|------|
| A3.1 | Ajouter `MCB_TOKEN_CONTRACT` dans `ops/vps/.env` | ✅ |
| A3.2 | `MCB_CLAIM_ENABLED=false` explicitement | ✅ |
| A3.3 | `MCB_USD_RATE` défini | ☐ |
| A3.4 | `MCB_BUILDERS_TREASURY` défini (après A2) | ☐ |
| A3.5 | `docker compose up -d web` (ou `bash ops/vps/deploy.sh`) | ✅ |
| A3.6 | UI points : lien BscScan contrat visible | ☐ |
| A3.7 | Admin mcb-claims : pool counters OK | ☐ |

---

## A4 — Pilote claim BP → McB

| # | Action | Done |
|---|--------|------|
| A4.1 | Hot wallet minter alimenté (McB + BNB gas) | ☐ |
| A4.2 | Process ops écrit : qui envoie, délai SLA, template tx | ☐ |
| A4.3 | Test interne : 1 user KYC → claim 100 BP → admin complete | ☐ |
| A4.4 | `MCB_CLAIM_ENABLED=true` dans `ops/vps/.env` + restart web | ☐ |
| A4.5 | Communication **interne** uniquement (beta, pas pub mass market) | ☐ |
| A4.6 | Mesurer 2 semaines : pending time, reject rate, pool % | ☐ |

### Process fulfillment admin

1. User soumet claim sur `/app/wallet/points` (KYC + wallet BEP20).
2. BP débités → statut `pending` dans `mcb_claims`.
3. Ops envoie McB depuis **hot wallet** vers `wallet_address` (MetaMask / multisig).
4. Admin `/admin/mcb-claims` → **Complete** + coller `txHash` (0x + 64 hex).
5. En cas d’erreur : **Reject** → BP remboursés automatiquement.

### KPI pilote (cibles)

| KPI | Cible pilote |
|-----|----------------|
| Délai pending → completed | < 48 h |
| Claims rejetés | < 5% |
| Pool utilisé | tracer weekly |
| Support tickets claim | documenter motifs |

---

## A5 — Liquidité PancakeSwap

| # | Action | Done |
|---|--------|------|
| A5.1 | Décider paire : McB/USDT ou McB/WBNB | ☐ |
| A5.2 | Montant initial modeste (doc : 5–10k USD équivalent) | ☐ |
| A5.3 | Créer pool sur [PancakeSwap](https://pancakeswap.finance) | ☐ |
| A5.4 | **Lock LP** (recommandé avant com publique) | ☐ |
| A5.5 | Mettre à jour `MCB_USD_RATE` selon cours réel (ops) | ☐ |
| A5.6 | (Option) `MCB_PANCAKESWAP_URL` si URL custom | ☐ |
| A5.7 | Vérifier lien DEX sur page points + Builders | ☐ |

**Communication :** utility + liquidité pour échanges — **pas** de promesse de prix ou listing pump.

---

## A6 — Builders Program

**Prérequis :** A5 (cours McB utilisable pour quote USD→McB).

| # | Action | Done |
|---|--------|------|
| A6.1 | `MCB_USD_RATE` aligné sur réalité marché / admin | ☐ |
| A6.2 | `BUILDERS_PROGRAM_ENABLED=true` | ☐ |
| A6.3 | Page `/app/community/builders` : quotes McB visibles | ☐ |
| A6.4 | Test achat Bronze : tx on-chain → admin approve | ☐ |
| A6.5 | Badge profil Community après activation | ☐ |

**Spec :** [builders-program-spec.md](./builders-program-spec.md) · [builders-pricing-usd-anchor.md](./builders-pricing-usd-anchor.md)

---

## A7 — Ads McB (Community)

**Prérequis :** liquidité + claim pilote stable.

| # | Action | Done |
|---|--------|------|
| A7.1 | Créditer ledger custodial test (`/admin/community-ads`) | ☐ |
| A7.2 | `COMMUNITY_ADS_ENABLED=true` | ☐ |
| A7.3 | Campagne test marque (interne) | ☐ |
| A7.4 | Vérifier split 50/25/25 (Creator Fund / burn / ops) | ☐ |
| A7.5 | Creator Fund payout cron (si activé) | ☐ |

**Spec :** [social-utility-ads-mcb.md](./social-utility-ads-mcb.md)

---

## Communication autorisée par phase

| Phase | OK | Interdit |
|-------|-----|----------|
| A1–A3 | « McB BEP-20 déployé », lien BscScan, utility token | Prix, APY, ICO |
| A4 | Claim BP→McB pilote KYC | « Achat maintenant avant pump » |
| A5 | Liquidité pour échanges | Garantie de cours |
| A6–A7 | Builders, ads utility | Rendement McB |

Constitution : [mcbuleli-constitution-outline.md](./mcbuleli-constitution-outline.md)

---

## Dépannage rapide

| Symptôme | Cause probable | Fix |
|----------|----------------|-----|
| `mcb_claim_disabled` | `MCB_CLAIM_ENABLED` false | A4 — activer dans `ops/vps/.env` + restart |
| Pas de lien BscScan UI | `MCB_TOKEN_CONTRACT` invalide/absent | A3 |
| Builders : prix McB null | `MCB_USD_RATE` absent | A3 |
| Claim pool exhausted | Cap 40M atteint | Pause + gouvernance réserve |
| Remix deploy fail VALUE | Supply dans VALUE | VALUE=0, supply dans constructeur |
| Ads spend blocked | `COMMUNITY_ADS_ENABLED` false | A7 |

---

## Prochaine action immédiate

**A1 fait** — contrat `0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147`.

1. **A2** — trésorerie / hot wallet minter.
2. **A3** — variables McB dans **`/opt/mcbuleli/ops/vps/.env`** + `docker compose up -d web` (pas Render).
3. Local : `npm run verify:mcb`.
4. Ne passer à A4 qu’après hot wallet minter prêt.

---

*Document maintenu par l’équipe ops McBuleli. Cocher les cases et dater les registres à chaque jalon.*
