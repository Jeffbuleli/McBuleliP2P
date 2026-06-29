# McBuleli Community Creators — Plan Maître

> **Statut :** référence produit & technique — à mettre à jour à chaque phase.  
> **Dernière révision :** juin 2026  
> **Documents liés :** [community-hub-master-plan.md](./community-hub-master-plan.md) · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md) · [mcb-token-phase3.md](./mcb-token-phase3.md) · [utility-token-roadmap.md](./utility-token-roadmap.md)

---

## 1. Vision

**McBuleli Community Creators** est le module de **monétisation de contenu** intégré au hub Communauté existant. Il permet aux artistes et créateurs — en priorité en **République Démocratique du Congo** — de publier, vendre et diffuser leurs œuvres numériques (musique, vidéo, images, livres, objets de valeur) tout en bénéficiant de l’engagement communautaire, de la découverte personnalisée, des publicités entreprises et, en phase ultérieure, de certificats **NFT** sur BSC.

### Principes directeurs

| Principe | Décision |
|----------|----------|
| **Emplacement** | Créateurs + NFT **dans Community** — pas de 7e onglet racine |
| **Paiements** | Uniquement via **solde Wallet** ; l’utilisateur choisit la devise parmi celles qu’il détient |
| **Solde insuffisant** | **Swap inline** vers la devise requise (`wallet-swap`, `wallet-convert`) |
| **Vérification** | Aucune publication publique audio/vidéo sans **contrôle de propriété / droits** |
| **Engagement** | **BP** en premier (système live) ; bascule progressive vers **McB** après mise en circulation |
| **Découverte** | Score communautaire + fil **Pour vous** + section **Tendances créateurs** |
| **Monétisation** | Modèle hybride type TikTok / Meta / X : achats, tips, abonnements, part pub, boost |
| **NFT** | Certificat d’authenticité et éditions limitées — **pas** prérequis pour consommer le contenu |
| **Jeu Mining Congo** | **Hors scope** phases M0–M5 (pas de bridge jeu ↔ créateurs) |

### Positionnement produit

Ce n’est pas un marketplace NFT spéculatif. C’est une **plateforme de vente et streaming de contenus numériques** où :

1. L’artiste **publie et vend** (revenu immédiat en wallet).
2. La plateforme **protège** via vérification avant publication.
3. La **communauté** fait émerger les œuvres appréciées (score, tendances).
4. Le **NFT BSC** renforce la preuve on-chain en phase M4+.

---

## 2. État actuel (audit code)

### Ce qui existe et est réutilisable

| Domaine | État | Fichiers clés |
|---------|------|---------------|
| **Community Hub** | Live (feed, blogs, Q&R, signaux, profils) | `src/lib/community/*`, `/app/community` |
| **Navigation Community** | Catégories dont `for_you`, `trending` | `src/lib/community/nav-config.ts` |
| **Médias R2** | Presign upload Community | `src/lib/community/media-r2.ts` |
| **Engagement** | Likes, vues média, follows | `media-engagement-service.ts`, `follows-service.ts` |
| **Wallet multi-devise** | USDT, PI, USD, CDF | `src/lib/wallet-types.ts`, `wallet-ledger.ts` |
| **Swap** | Conversion entre devises wallet | `src/lib/wallet-swap.ts`, `/api/wallet/swap` |
| **Taux de change** | Référence USD | `src/lib/reference-rates.ts`, `wallet-convert.ts` |
| **KYC** | Gates par feature | `src/lib/kyc-guard.ts`, `kyc-policy.ts` |
| **BP / récompenses** | Ledger, caps 4 000/mois | `reward-points-config.ts`, `reward-points-service.ts` |
| **McB on-chain** | BEP-20, claim BP→McB manuel | `McBuleliToken.sol`, `mcb-claim-service.ts` |
| **Badges Academy** | Off-chain Open Badges | `academy_credentials`, `academy-open-badge.ts` |
| **Streaming vidéo** | Cloudflare Stream (spec Community) | `community-hub-master-plan.md` |

### Ce qui manque

- Tables `creator_*`, `ad_*`, `nft_*` liées aux œuvres
- Module Créateurs / NFT dans la nav Community
- Checkout wallet unifié pour achats créateurs
- File de vérification propriété (audio, vidéo)
- Player audio / bibliothèque acheteur
- Creator Fund, Ads entreprises
- Pocket McB custodial dans le wallet (post-circulation)
- Contrats ERC-721 / marketplace BSC

---

## 3. Architecture cible

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMMUNITY (module unique — inchangé en racine)        │
│  Feed · Discussions · Formations · Signaux · CRÉATEURS · NFT · ADS      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   Publication            Engagement              Monétisation
   musique · vidéo ·       réactions · score ·      achat · tips · abo ·
   image · livre · objet   tendances · pour vous    ads · boost · NFT
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                    WALLET — devise choisie par l'utilisateur
                    USDT · PI · USD · CDF  →  McB (phase M4+)
                    swap inline si solde insuffisant
                                │
                                ▼
                    NFT BSC (certificat, édition limitée) — optionnel M4+
```

### Intégration sans régression

- Module sous `src/lib/community/creators/*` et `src/app/app/community/creators/*`
- APIs sous `/api/community/creators/*`, `/api/community/nft/*`, `/api/community/ads/*`
- Aucune modification des routes Wallet / P2P / Trade existantes
- Ledger wallet étendu (nouveaux `kind`) — pas de ledger parallèle

---

## 4. Navigation & routes UI

Extension de `src/lib/community/nav-config.ts` :

| Entrée | Route | Phase |
|--------|-------|-------|
| **Créateurs** | `/app/community/creators` | M0 |
| **Publier** | `/app/community/creators/upload` | M0 |
| **Ma bibliothèque** | `/app/community/creators/library` | M1 |
| **Mes revenus** | `/app/community/creators/earnings` | M3 |
| **NFT** | `/app/community/nft` | M4 |
| **Publicités** (annonceurs) | `/app/community/ads` | M3 |
| Catégorie fil `creators` | Filtre feed posts liés à une œuvre | M1 |
| Admin review | `/admin/creator/review` | M0 |
| Admin ads | `/admin/ads` | M3 |
| Admin NFT mints | `/admin/nft/mints` | M4 |

### Genres musicaux MVP (RD Congo)

Rumba · Ndombolo · Gospel · Hip-hop congolais · Traditionnel · Autre — tags libres + modération.

---

## 5. Types de contenus

| Type | Preview public | Après achat | Vérification spécifique |
|------|----------------|-------------|-------------------------|
| **Musique** | 30–60 s stream | Stream illimité + download MP3 | Empreinte audio, review staff |
| **Vidéo** | Trailer / 480p | Stream HD (Cloudflare Stream) | Empreinte vidéo, review staff |
| **Image / art** | Watermark / basse résolution | Full res + download | Anti-doublon, review si signalé |
| **Livre / titre** | Extrait (chapitre 1) | Ebook complet (PDF) | ISBN optionnel, déclaration auteur |
| **Objet de valeur** | Photos certifiées | NFT + certificat (QR) | Photos + description + review staff |

---

## 6. Vérification de propriété (avant publication)

Aucun son ou vidéo n’est **public** ou **en streaming catalogue** sans passage par la file de vérification.

### Niveaux de contrôle

| Niveau | Contrôle | Délai | Automatique |
|--------|----------|-------|-------------|
| **L0** | Format, taille, scan malware, métadonnées | Instantané | Oui |
| **L1** | Hash SHA-256 + empreinte audio/vidéo (perceptual hash) | < 1 min | Oui |
| **L2** | Anti-doublon plateforme (même empreinte → autre user) | Instantané | Oui |
| **L3** | Déclaration légale + KYC approuvé (`creator_publish`) | Instantané | Oui |
| **L4** | Review humain staff (échantillon audio/vidéo) | 24–72 h | Non |
| **L5** | Preuve renforcée (selfie + œuvre, ISRC/ISBN, liens sociaux) | 3–7 j | Non |

**MVP :** L0 + L1 + L2 + L3 + L4 pour tout contenu audio/vidéo.

### Statuts œuvre

`draft` → `pending_review` → `approved` → `published` → (option) `minted` | `rejected` | `suspended`

### Limites légales

McBuleli ne remplace pas un dépôt légal (OAPI, etc.). La plateforme garantit : pas de doublon interne, auteur KYC identifié, déclaration horodatée, empreinte archivée, modération et retrait sur signalement.

---

## 7. Paiements Wallet multi-devises

### Principe

Tous les flux monétaires (achat, tip, abonnement, boost, campagne ads) passent par le **wallet custodial** McBuleli. L’utilisateur sélectionne la **devise de paiement** parmi ses soldes détenus.

### Devises par phase

| Devise | Phase | Référence code |
|--------|-------|----------------|
| USDT, PI, USD, CDF | **M1** | `WALLET_ASSETS` dans `wallet-types.ts` |
| McB custodial | **M4** | Nouveau pocket post-claim (à définir) |
| McB on-chain | **M5** | Wallet BEP20 lié (pattern `mcb-claim-service`) |

### Flow checkout unifié (`checkout-wallet-service`)

```
1. User initie achat / tip / abo / boost / ads
2. Choisit devise : [USDT] [CDF] [USD] [PI] (McB en M4+)
3. Prix affiché dans devise préférée user (conversion reference-rates)
4. Si solde insuffisant → quote swap inline → confirmation
5. Transaction DB : debit acheteur / annonceur, credit créateur (net commission)
6. insertWalletLedgerLines avec kind dédié
7. Entitlement (stream) ou confirmation campagne / boost
```

### Nouveaux kinds ledger wallet

| Kind | Description |
|------|-------------|
| `creator_purchase` | Achat œuvre |
| `creator_tip` | Pourboire créateur |
| `creator_subscription` | Abonnement mensuel créateur |
| `creator_boost` | Boost visibilité payant |
| `creator_payout` | Transfert earnings → wallet principal |
| `ad_campaign_debit` | Débit budget campagne annonceur |
| `ad_impression_credit` | Crédit créateur (part Creator Fund) |
| `creator_platform_fee` | Commission plateforme (contrepartie) |

### Split revenus créateur (défaut)

| Flux | Part créateur | Part plateforme |
|------|---------------|-----------------|
| Achat œuvre | 90 % | 10 % |
| Tip | 95 % | 5 % |
| Abonnement | 85 % | 15 % |
| Creator Fund (ads) | 100 % du pool attribué | Pool alimenté par revenus ads |

Configurable via env / `platform_settings` — documenter toute modification ici et dans `mcb-tokenomics-reference.md`.

---

## 8. Engagement communautaire & mise en avant

### Signaux d’intérêt sur les œuvres

| Signal | Poids score | Earn user (BP → McB) | Cap journalier suggéré |
|--------|-------------|----------------------|------------------------|
| Like / réaction | +1 | +2 BP (M2) → McB (M5) | 50 |
| Commentaire sur œuvre | +3 | +5 BP | 20 |
| Partage | +5 | +8 BP | 15 |
| Écoute preview complète (≥ 30 s) | +2 | +1 BP | 30 |
| Ajout favoris | +4 | — | — |
| Achat | +50 | +15 BP acheteur | 3/mois |
| Tip | +20 | — | — |
| Réécoute (acheteur) | +1 | — | — |

Les grants BP utilisent le moteur existant (`tryGrantRewardPoints`, plafond mensuel **4 000 BP** global). Nouveaux types à ajouter dans `reward-points-config.ts` :

- `creator_work_like`
- `creator_work_comment`
- `creator_work_share`
- `creator_work_preview_listen`
- `creator_work_purchase`

### Score œuvre `community_score`

```
score = (likes×1 + comments×3 + shares×5 + favorites×4
         + purchases×50 + tips×20 + preview_listens×2)
        × freshness_decay × creator_reputation_multiplier
```

`freshness_decay` : décroissance sur 7 jours (œuvres récentes favorisées).  
`creator_reputation_multiplier` : 1.0–1.5 selon historique (KYC, pas de signalements).

### Surfaces UI

| Zone | Critère d’affichage |
|------|---------------------|
| **Tendances créateurs** | Top `community_score` 24 h / 7 j par catégorie |
| **Apprécié par la communauté** | Carte hub Community — top 3 œuvres |
| **Pour vous** | Préférences user + genres + créateurs suivis |
| **Boost payant** | Slot sponsorisé 48 h (indépendant du score organique) |

### Personnalisation « Pour vous »

Données :

- Genres achetés / écoutés
- Créateurs suivis (`community_follows`)
- `countryCode` (priorité contenu CD)
- Historique réactions
- Locale app (FR/EN)

**MVP (M2) :** scoring pondéré SQL.  
**M5 :** collaborative filtering léger.

---

## 9. Monétisation contenu (modèle plateformes sociales)

### Flux revenus créateur

| # | Mécanisme | Phase | Paiement |
|---|-----------|-------|----------|
| 1 | **Vente directe** — album, vidéo, ebook, image | M1 | Wallet |
| 2 | **Tips** — pourboire sur œuvre ou profil | M1 | Wallet |
| 3 | **Abonnement créateur** — contenu exclusif mensuel | M3 | Wallet |
| 4 | **Creator Fund** — part des revenus publicitaires | M3 | Crédit earnings |
| 5 | **Boost visibilité** — créateur paie pour slot tendance | M2 | Wallet |
| 6 | **NFT édition limitée** — premium + certificat | M4 | Wallet + mint BSC |

### Creator Fund (simplifié)

- Pool mensuel = % des revenus ads plateforme (ex. 5 %)
- Répartition proportionnelle aux **vues qualifiées** (> 30 s, contenu approuvé, anti-fraude)
- Crédit sur `creator_earnings` → payout vers wallet principal (seuil min configurable)

### Comparaison références marché

| Référence | Équivalent McBuleli |
|-----------|---------------------|
| TikTok Creator Fund | Creator Fund (vues qualifiées) |
| Facebook Stars / Tips | Tips wallet multi-devise |
| X / Patreon abonnements | Abonnement créateur mensuel |
| TikTok Shop | Catalogue + bibliothèque acheteur |
| Meta Ads Manager | Module Ads entreprises (M3) |
| OpenSea / certificats | NFT BSC édition limitée (M4) |

---

## 10. Publicités entreprises (Ads)

### Formats

| Format | Emplacement | Modèle |
|--------|-------------|--------|
| Carte feed | Entre posts Community / créateurs | CPM |
| Bannière créateurs | Haut `/app/community/creators` | CPM fixe / enchère |
| Sponsoring œuvre | « Présenté par [Marque] » | Forfait wallet |
| Slot catalogue | Position fixe 7 j | Prix fixe wallet |

### Compte annonceur

- User KYC + flag `advertiser` ou compte créé par staff
- Budget campagne en wallet (USDT / USD / CDF en M3 ; McB en M5)
- Dashboard `/app/community/ads` + modération `/admin/ads`

### Ciblage MVP

- Pays (`countryCode`)
- Langue
- Catégorie contenu (musique, vidéo…)
- Intérêts dérivés des préférences user

---

## 11. NFT dans Community

### Rôle

Le NFT **ne remplace pas** l’achat digital pour consommer le contenu. Il sert de :

- Certificat d’authenticité (édition numérotée)
- Preuve on-chain de première acquisition
- Objet de collection / revente (M5)

### Collections prévues

| Collection | Source | Phase |
|------------|--------|-------|
| **McBuleli Creators** | Œuvres vendues (édition limitée) | M4 |
| **Academy Credentials** | `academy_credentials` | M4 |
| **Community Badges** | Réputation, Top Trader (spec G9) | M5 |

### Contrats BSC (chainId 56)

| Contrat | Rôle |
|---------|------|
| `McBuleliNFT.sol` | ERC-721, `MINTER_ROLE`, EIP-2981 royalties |
| `McBuleliMarketplace.sol` | Revente P2P (M5) |

Fulfillment mint : file admin (pattern `mcb_claims`) → bot minter multisig.

### UI

- `/app/community/nft` — galerie, collections, lien BscScan
- Fiche œuvre — lien token si minté
- Profil créateur — NFT émis

---

## 12. Trajectoire BP → McB

Aligné sur [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md).

| Phase | Engagement user (œuvres) | Monétisation créateur | McB |
|-------|--------------------------|----------------------|-----|
| **M1–M3** | — | 100 % wallet fiat/crypto | — |
| **M2–M3** | Earn **BP** sur réactions œuvres | Inchangé | — |
| **M4** | BP + option tip McB custodial | Payout wallet | Checkout McB ; tips McB |
| **M5** | **McB remplace BP** sur signaux créateurs | Frais −15 % si McB | Burn 30 % frais (Phase C tokenomics) |

**Règle :** pas de double earn BP + McB sur la même action. Annoncer la bascule avant M5.

Nouveaux sinks McB (M4+) :

- Boost visibilité −10 % si payé en McB
- Frais plateforme achat −15 % si acheteur paie en McB

---

## 13. Schéma base de données

Migration additive — préfixe suggéré `drizzle/00xx_community_creators.sql`.

```
creator_profiles
  — user_id, bio, genres[], social_links, verified_at, advertiser_flag

creator_works
  — id, creator_id, type (music|video|image|book|object)
  — title, description, status, price_usdt, price_cdf (nullable)
  — community_score, published_at, revoked_at

creator_work_media
  — work_id, kind (preview|full|cover)
  — r2_key, stream_id, mime, duration_sec, fingerprint_sha256

creator_work_verifications
  — work_id, level, fingerprint, reviewer_id, decision, notes, decided_at

creator_engagement_events
  — work_id, user_id, kind (like|comment|share|listen|favorite|purchase|tip)
  — meta jsonb, created_at

creator_work_scores
  — work_id, score, rank_24h, rank_7d, computed_at

creator_orders
  — work_id, buyer_id, payment_asset, gross_amount, platform_fee, net_creator
  — status, ledger_batch_id

creator_entitlements
  — user_id, work_id, order_id, granted_at, expires_at (null = permanent)

creator_tips
  — from_user_id, to_creator_id, work_id (nullable)
  — payment_asset, amount, ledger_batch_id

creator_subscriptions
  — subscriber_id, creator_id, payment_asset, monthly_amount, status, renew_at

creator_earnings
  — creator_id, asset, balance — agrégat avant payout

creator_payouts
  — creator_id, asset, amount, ledger_batch_id, status

creator_boosts
  — work_id, creator_id, payment_asset, amount, starts_at, ends_at

user_content_preferences
  — user_id, genres[], followed_creator_ids[], updated_at

ad_campaigns
  — advertiser_id, format, budget_asset, budget_total, spent, targeting jsonb, status

ad_impressions / ad_clicks
  — campaign_id, user_id (nullable), work_id (nullable), created_at

nft_collections
  — slug, name, contract_address, chain_id, kind, royalty_bps

nft_tokens
  — collection_id, token_id, work_id (nullable), owner_user_id
  — metadata_uri, mint_tx_hash, minted_at

nft_mint_requests
  — user_id, work_id, wallet_address, status, tx_hash (pattern mcb_claims)
```

Index recommandés : `(creator_works.status, community_score DESC)`, `(creator_orders.buyer_id)`, `(creator_entitlements.user_id)`.

---

## 14. APIs (plan)

| Route | Méthode | Phase | Description |
|-------|---------|-------|-------------|
| `/api/community/creators/profile` | GET/POST | M0 | Profil créateur |
| `/api/community/creators/works` | GET/POST | M0 | Liste / soumission œuvre |
| `/api/community/creators/works/[id]` | GET/PATCH | M0 | Détail / retrait |
| `/api/community/creators/works/[id]/engage` | POST | M2 | Like, favori, partage, listen |
| `/api/community/creators/works/[id]/purchase` | POST | M1 | Achat wallet |
| `/api/community/creators/works/[id]/tip` | POST | M1 | Tip wallet |
| `/api/community/creators/library` | GET | M1 | Entitlements acheteur |
| `/api/community/creators/stream/[id]` | GET | M1 | URL signée preview / full |
| `/api/community/creators/trending` | GET | M2 | Tendances |
| `/api/community/creators/for-you` | GET | M2 | Recommandations |
| `/api/community/creators/earnings` | GET | M3 | Solde créateur |
| `/api/community/creators/subscribe` | POST | M3 | Abonnement |
| `/api/community/creators/boost` | POST | M2 | Boost payant |
| `/api/community/ads/campaigns` | GET/POST | M3 | Campagnes annonceur |
| `/api/community/nft/collections` | GET | M4 | Collections |
| `/api/community/nft/tokens/me` | GET | M4 | Mes NFT |
| `/api/community/nft/mint` | POST | M4 | Demande mint |
| `/api/admin/creator/review` | GET/PATCH | M0 | File vérification |
| `/api/admin/ads` | GET/PATCH | M3 | Modération ads |
| `/api/admin/nft/mints` | GET/PATCH | M4 | Fulfillment mint |

Validation Zod sur tous les POST/PATCH — pattern existant Community.

---

## 15. Plan d’implémentation par phases

### Phase M0 — Fondations (3–4 semaines) `P0`

| # | Tâche | Livrable |
|---|-------|----------|
| M0.1 | Migration DB `creator_profiles`, `creator_works`, `creator_work_media`, `creator_work_verifications` | `drizzle/00xx_*.sql` |
| M0.2 | Nav Community : Créateurs, placeholder NFT | `nav-config.ts`, hub cards |
| M0.3 | Profil créateur + KYC gate `creator_publish` | `kyc-policy.ts` |
| M0.4 | Upload multi-média (R2 existant) + empreinte SHA-256 | `creators/media-service.ts` |
| M0.5 | Déclaration droits + submit → `pending_review` | API + UI upload |
| M0.6 | Admin `/admin/creator/review` | Approve / reject |
| M0.7 | `checkout-wallet-service` squelette | `src/lib/checkout-wallet-service.ts` |
| M0.8 | Feature flags env | `COMMUNITY_CREATORS_ENABLED` |

**KPI :** œuvres soumises, délai review médian < 48 h, 0 régression Community.

---

### Phase M1 — Vente + streaming + wallet (4–5 semaines) `P0`

| # | Tâche | Livrable |
|---|-------|----------|
| M1.1 | Catalogue `/app/community/creators` + fiche œuvre | UI browse |
| M1.2 | Preview engine (audio clip, trailer, watermark) | ffmpeg ou Stream clip |
| M1.3 | Achat wallet multi-devise + swap inline | `creator_orders`, ledger |
| M1.4 | `creator_entitlements` + bibliothèque | `/creators/library` |
| M1.5 | Player audio + vidéo (URLs signées) | Stream + R2 |
| M1.6 | Tips wallet | `creator_tips` |
| M1.7 | Post Community auto sur publication | Lien work → post |
| M1.8 | Notifications `creator_sale`, `creator_work_approved` | `notifications-service.ts` |

**KPI :** GMV wallet, conversion preview → achat, temps chargement player 3G.

---

### Phase M2 — Engagement + tendances + BP (3–4 semaines) `P0`

| # | Tâche | Livrable |
|---|-------|----------|
| M2.1 | `creator_engagement_events` + API engage | Like, favori, partage, listen |
| M2.2 | Cron `community_score` + `creator_work_scores` | Job Render cron |
| M2.3 | UI Tendances + « Apprécié par la communauté » | Hub + page créateurs |
| M2.4 | Grants BP créateurs dans `reward-points-config.ts` | 5 nouveaux types |
| M2.5 | Fil Pour vous créateurs (scoring MVP) | `/api/.../for-you` |
| M2.6 | Boost visibilité payant (wallet, 48 h) | `creator_boosts` |

**KPI :** % users avec ≥ 1 réaction sur œuvre ; BP earn créateurs / total BP.

---

### Phase M3 — Monétisation avancée + Ads (4–5 semaines) `P1`

| # | Tâche | Livrable |
|---|-------|----------|
| M3.1 | Abonnement créateur mensuel | `creator_subscriptions` |
| M3.2 | Creator Fund + répartition vues qualifiées | Cron + `creator_earnings` |
| M3.3 | Module Ads : campagnes, ciblage, débit wallet | `ad_campaigns` |
| M3.4 | Dashboard `/creators/earnings` + payout | Seuil min payout |
| M3.5 | Prix CDF par défaut pour `countryCode=CD` | UX locale |
| M3.6 | Admin modération ads | `/admin/ads` |

**KPI :** revenus ads, créateurs avec earnings > 0, ARPU, % ventes CDF.

---

### Phase M4 — NFT + McB custodial (4–5 semaines) `P2`

**Prérequis :** McB en circulation (`MCB_CLAIM_ENABLED`), liquidité, taux McB fiable.

| # | Tâche | Livrable |
|---|-------|----------|
| M4.1 | Deploy `McBuleliNFT.sol` BSC testnet → mainnet | BscScan verify |
| M4.2 | Tables `nft_*` + `/app/community/nft` | Galerie |
| M4.3 | Mint queue + `/admin/nft/mints` | Pattern mcb_claims |
| M4.4 | Mint à l’achat (éditions limitées) | work ↔ token |
| M4.5 | Pocket McB custodial dans checkout | Extension wallet |
| M4.6 | Tips / boost en McB (option) | −10 % boost McB |
| M4.7 | Pilote earn 50 % BP / 50 % McB sur réactions | Config |

**KPI :** mints complétés, achats en McB, taux rejet mint.

---

### Phase M5 — McB natif + revente NFT (6+ semaines) `P3`

| # | Tâche |
|---|-------|
| M5.1 | Earn engagement 100 % McB (fin BP créateurs) |
| M5.2 | Frais plateforme −15 % si payé en McB ; burn 30 % |
| M5.3 | `McBuleliMarketplace.sol` revente |
| M5.4 | Royalties créateur EIP-2981 on-chain |
| M5.5 | Recommandations collaborative filtering |

---

### Hors scope (reporté)

| Élément | Statut |
|---------|--------|
| Jeu Mining Congo | Reporté au-delà de M5 |
| Bridge crédits jeu → BP / McB | Non planifié |
| WalletConnect généralisé | M5 uniquement |
| ML recommandations | M5+ |

---

## 16. Variables d'environnement (nouvelles)

```env
# Feature flags
COMMUNITY_CREATORS_ENABLED=false
COMMUNITY_NFT_ENABLED=false
COMMUNITY_ADS_ENABLED=false

# Créateurs
CREATOR_PLATFORM_FEE_BPS=1000          # 10 % achat
CREATOR_TIP_PLATFORM_FEE_BPS=500       # 5 %
CREATOR_REVIEW_REQUIRED=true
CREATOR_MAX_AUDIO_MB=50
CREATOR_MAX_VIDEO_MB=500
CREATOR_PREVIEW_AUDIO_SEC=45

# Creator Fund
CREATOR_FUND_POOL_PCT=5                # % revenus ads → pool
CREATOR_FUND_MIN_VIEWS=100

# Ads
ADS_MIN_CAMPAIGN_USD=10
ADS_CPM_USD=2

# NFT (M4+)
NFT_CONTRACT_ADDRESS=
NFT_MINTER_PRIVATE_KEY=                # Render secret — multisig recommandé
NFT_MINT_AUTO_MAX_PER_DAY=50

# McB checkout (M4+)
MCB_WALLET_CHECKOUT_ENABLED=false
```

Réutiliser les variables R2 Community existantes (`COMMUNITY_R2_*`).

---

## 17. Sécurité & conformité

- KYC `creator_publish` pour soumettre ; KYC standard pour acheter (selon politique pays)
- Rate limiting : délai min entre soumissions, cap tips/jour
- URLs stream signées courtes durée — pas de lien permanent public pour contenu full
- Modération : signalement → `community_reports` étendu aux œuvres
- Utility token only — pas de promesse de prix NFT ou McB
- Messaging pays à risque : adapter selon règles Google/Meta pour crypto et NFT

---

## 18. Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Piratage / re-upload | Empreinte + review + signalement |
| Fraude vues Creator Fund | Vues qualifiées, caps device/IP |
| Complexité multi-devise | Checkout unifié + swap inline testé |
| Confusion BP / McB / McB jeu | Renommer crédits jeu ; bascule annoncée |
| Charge modération | Priorité audio/vidéo ; staff scope `creator_moderation` |
| Ads inappropriées | Review avant activation |
| Gas BNB mint NFT | Plateforme paie gas mint Academy/Creators pilote |

---

## 19. Fichiers de référence (existants)

| Domaine | Chemin |
|---------|--------|
| Community nav | `src/lib/community/nav-config.ts` |
| Community hub | `src/lib/community/home-service.ts` |
| Médias R2 | `src/lib/community/media-r2.ts` |
| Engagement | `src/lib/community/media-engagement-service.ts` |
| Wallet assets | `src/lib/wallet-types.ts` |
| Wallet ledger | `src/lib/wallet-ledger.ts` |
| Swap | `src/lib/wallet-swap.ts`, `wallet-convert.ts` |
| BP config | `src/lib/reward-points-config.ts` |
| McB claim | `src/lib/mcb-claim-service.ts` |
| KYC | `src/lib/kyc-guard.ts` |
| Contrat McB | `contracts/McBuleliToken.sol` |

### Fichiers à créer (M0+)

```
src/lib/community/creators/
  creator-profile-service.ts
  creator-work-service.ts
  creator-verification-service.ts
  creator-engagement-service.ts
  creator-streaming-service.ts
src/lib/checkout-wallet-service.ts
src/app/app/community/creators/
src/app/api/community/creators/
src/app/admin/creator/
docs/community-creators-master-plan.md  (ce document)
```

---

## 20. Parcours type — artiste Kinshasa

1. KYC approuvé → active **profil créateur** dans Community.
2. Upload morceau rumba + pochette + prix 1 500 CDF.
3. Vérification L0–L4 → approuvé en 48 h → **publié**.
4. Post auto dans le feed ; preview 45 s gratuite.
5. Fans likent et partagent → **score monte** → carte **« Apprécié par la communauté »**.
6. Fan achète avec solde **CDF** wallet → stream illimité + download.
7. Fan envoie **tip 0,5 USDT** (swap CDF→USDT si besoin).
8. Artiste consulte **earnings** → payout vers wallet principal.
9. Entreprise locale lance campagne **Ads** ciblant musique CD.
10. *(M4)* Édition 50 NFT — acheteur reçoit certificat #7 sur BSC.

---

## 21. Prochaines étapes

1. Valider ce document en équipe produit / juridique.
2. Créer ticket **M0.1** : migration DB + feature flag.
3. Étendre `nav-config.ts` (entrée Créateurs) sans activer en prod.
4. Implémenter file admin review avant ouverture publique upload.
5. Mesurer KPI M0 avant d’enchaîner M1 (vente wallet).

---

*Document maintenu par l'équipe produit McBuleli. Toute modification des frais, grants BP ou paramètres McB doit être reflétée dans `reward-points-config.ts`, `mcb-tokenomics-reference.md` et ce fichier.*
