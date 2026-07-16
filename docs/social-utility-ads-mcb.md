# SUG Horizon B - Ads McB, Creator Fund & burn

> **Statut :** B6 tips BP **live** · B1 schema ads **prêt** · spend McB **gated** (`COMMUNITY_ADS_ENABLED`) jusqu'au lancement BSC  
> **Parent :** [social-utility-graph.md](./social-utility-graph.md)  
> **Liés :** [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md) · [mcb-token-ops-launch.md](./mcb-token-ops-launch.md) · [builders-program-spec.md](./builders-program-spec.md)  
> **Dernière révision :** juillet 2026

**Prérequis go-live ads McB :** token McB déployé BSC + claim/liquidité + `COMMUNITY_ADS_ENABLED=true`.  
**Avant BSC :** tips BP (B6) + tables ads (B1) peuvent être migrés sans servir d'ads.

Migration : `0101_community_ads_horizon_b.sql`  
Tips : `src/lib/community/tip-service.ts` (20/50/100 BP)  
Split ads : `src/lib/community/ads-config.ts` (50/25/25)  
---

## 1. Objectif

Créer un **sink McB réel** via publicité entreprise, tout en redistribuant une part aux créateurs utiles (Creator Fund) et en brûlant une part - sans transformer McB en salaire spéculatif.

**USDT** = valeur stable pour tips/abos quand approprié.  
**McB** = carburant ads / perks / claim.

---

## 2. Produits ads (catalogue v1)

| Produit | Code | Devise | Durée / unité | Cible |
|---------|------|--------|---------------|-------|
| Boost post (upgrade) | `ad_boost_mcb` | McB | 24-72h | Créateur Verified+ |
| Placement feed marque | `ad_feed_brand` | McB | impressions ou jours | Brand KYC |
| Sponsored live / formation | `ad_live_sponsor` | McB + USDT mix | session | Brand + Academy |
| Offre emploi / local | `ad_job_local` | McB | 7-14j | Brand / org |

Prix exacts (McB) : **proposition finance** avant go-live - stocker en config admin (`community_ad_products`).

### 2.1 Policy contenu ads (Constitution)

Refus automatique ou manuel si :

- Promesse de rendement / prix McB
- ICO / presale non affiliée McBuleli
- Arnaque P2P / phishing
- Contenu illégal ou haineux

IA Curateur ads (score) + revue staff pour campagnes > seuil.

---

## 3. Acteurs & KYC

| Rôle | Exigence | Capacités |
|------|----------|-----------|
| Creator Verified | KYC user | Boost McB optionnel, tips in, Creator Fund éligible |
| Brand | KYC + compte `community_brands` + contrat / ToS ads | Acheter campagnes, dashboard reporting |
| McBuleli ops | super_admin / scope `community_ads` | Approuver, pause, rembourser |

Table cible `community_brands` :

- `id`, `owner_user_id`, `legal_name`, `display_name`, `kyc_status`, `status` (pending/active/suspended)
- `billing_wallet` (adresse BEP-20 ou ledger interne McB custodial si on crédite McB off-chain d'abord)

**Décision produit v1 (retenue) :** paiements ads en **McB custodial** (ledger interne) d'abord, settlement on-chain plus tard - réduit friction gas pour marques RDC. Burn = debit ledger + burn on-chain périodique depuis trésorerie (batch).

---

## 4. Split économique (proposition v1)

Sur chaque dépense ads en McB :

| Destination | % | Notes |
|-------------|---|-------|
| **Creator Fund** | 50 % | Pool mensuel redistribué |
| **Burn** | 25 % | Sink supply / crédibilité utility |
| **Ops McBuleli** | 25 % | Infra, modération, IA |

À valider finance avant publication Whitepaper v1.1. Toute pub des % doit être taguée "proposition" jusqu'à validation fondateur.

### 4.1 Creator Fund - règles d'éligibilité

Sur la fenêtre calendaire mensuelle UTC :

1. Auteur Verified (KYC)
2. Somme `quality_score` pondérée des posts publiés > seuil (ex. moyenne ≥ 55)
3. Pas de sanction modération active
4. Cap anti-whale : max X % du pool par créateur (ex. 10 %)

**Formule redistribution (proposition) :**

```
share_i = utility_weight_i / sum(utility_weight)
utility_weight_i = sum over posts (quality_score × utility_engagement)
```

`utility_engagement` = likes authentiques + réponses acceptées + live joins - pas raw impressions seules.

Payout : **70 % McB ledger** + **30 % USDT** (si solde ads USDT mix) - ou 100 % McB si pas de rail USDT ads encore.

---

## 5. Flux technique

```
Brand wallet McB (custodial)
        │
        ▼
  POST /api/community/ads/campaigns  (create)
        │
        ▼
  Debit McB ledger (ads_spend)
        │
        ├── 50% credit creator_fund_pool (month key)
        ├── 25% credit burn_queue
        └── 25% credit ops_treasury_internal
        │
        ▼
  Ad serves in feed (respect frequency caps)
        │
        ▼
  Cron mensuel : compute shares → credit creators
  Cron burn : batch burn on-chain depuis hot wallet
```

### 5.1 Tables (draft)

```
community_brands
community_ad_products          -- price_mcb, duration, kind
community_ad_campaigns         -- brand_id, product, status, targeting jsonb
community_ad_impressions       -- campaign_id, user_id?, post_id?, created_at
community_creator_fund_months  -- month, total_mcb, status
community_creator_fund_payouts -- month, user_id, mcb_amount, usdt_amount, tx_ref
```

### 5.2 Targeting v1 (simple)

- Pays (ISO) si user.country
- Utility tags du feed
- KYC-only reach (option marque)

Pas de lookalike Meta au jour 1.

### 5.3 Fréquence & UX

- Max 1 ad / 8 posts organiques
- Label clair « Sponsorisé » / « Sponsored »
- Opt-out ads non pour brands (users can reduce via settings later)

---

## 6. Tips créateur (Horizon B parallèle)

| Étape | Devise | Note |
|-------|--------|------|
| B1 | Tip en **BP** (ex. 20/50/100) | Sink immédiat, pas de liquidité McB |
| B2 | Tip en **USDT** micro | Valeur stable ; fee plateforme 5-10 % |
| B3 | Tip en McB | Seulement si claim/liquidité mature |

UI : bouton Tip sur profil + post ; ledger notifications.

---

## 7. Canaux locaux (léger Telegram-like)

Hors ads strict, mais Horizon B :

- `community_channels` (ville / métier / AVEC)
- Membership + rôles (lien MBP)
- Posts scoped channel
- Bot IA matchmaker dans le canal

Spec détail channels : ticket séparé après ads MVP.

---

## 8. IA modération & curateur ads

| Pipeline | Input | Output |
|----------|-------|--------|
| Pre-publish organic | body + media meta | allow / soft_limit / reject |
| Ad submit | creative + landing URL | allow / needs_review / reject |
| Matchmaker | question text | suggested academy module / P2P help |

Logs : table `community_ai_moderation_events` pour audit.

---

## 9. Alignement tokenomics

Mettre à jour en même temps que le go-live B :

- [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md) - section spend McB ads + burn %
- Allocation supply : ads sink augmente utilité réelle (pas inflation narrative)
- Ops : burn queue + multisig ([mcb-token-ops-launch.md](./mcb-token-ops-launch.md))

---

## 10. Critères de done Horizon B (MVP ads)

- [ ] Brand peut créer une campagne feed après KYC + ToS
- [ ] Debit McB split 50/25/25 visible en ledger admin
- [ ] Feed injecte ads avec label Sponsorisé + frequency cap
- [ ] Cron Creator Fund mensuel dry-run puis payout test
- [ ] Burn batch documenté (même si manuel au début)
- [ ] Zero promesse de prix dans creatives (policy enforced)

---

## 11. Tickets suggérés

| ID | Titre |
|----|-------|
| SUG-B1 | Schema brands + ad_products + campaigns | **Schema done** (flag off) |
| SUG-B2 | McB custodial debit + split fund/burn/ops | After BSC |
| SUG-B3 | Feed ad injection + frequency cap | After BSC |
| SUG-B4 | Admin approve / pause campaigns | After BSC |
| SUG-B5 | Creator Fund monthly cron + payouts | After BSC |
| SUG-B6 | Tips BP (puis USDT) | **BP tips live** |
| SUG-B7 | AI ad curator + organic moderator | Later |

---

## 12. Ce qu'on ne fait pas en B

- ICO / sale de McB pour "investir dans le social"
- Salaire 100 % McB sans option USDT
- NFT marketplace obligatoire
- Ads behavioral type Meta (privacy / coût)

---

*Proposition v1 des % (50/25/25). Validation fondateur + finance requise avant communication publique ou Whitepaper v1.1.*
