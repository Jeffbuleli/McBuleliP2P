# Builders perk economics (Gold vs Platinum)

> **Statut :** brouillon finance / produit — **ne pas publier** les % tant que finance n’a pas signé  
> **Dernière révision :** juillet 2026  
> **Liés :** [builders-program-spec.md](./builders-program-spec.md) · [builders-pricing-usd-anchor.md](./builders-pricing-usd-anchor.md) · [community-roles-map.md](./community-roles-map.md) · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md)

**Critique trésorerie :** ne jamais lier les remises frais à un sticker McB fixe.  
Catalogue = **USD** ; McB = quote au cours. Détail : [builders-pricing-usd-anchor.md](./builders-pricing-usd-anchor.md).

**Baselines live (code) :** fiat MM 5 % · swap 1 % / fiat→crypto 2,5 % · withdraw crypto 2 USDT · futures 5 bps/côté · boost Community 80 BP / 24 h.

**Règles :**
1. Remise = **% relatif** sur le taux de frais (pas sur le notional).
2. **Floor** absolu + **CAP annuel** de manque à gagner plateforme par membre.
3. Tous les perks **expirent** avec le badge (24 mois) ; historique / McB gardés.
4. **Gold+** = critère d’éligibilité Ambassadeur charte — **pas** un mandat.
5. Remises frais **OFF** si cours McB &lt; seuil min (`fee_perks_unlocked = false`).

---

## 1. Grille prix MBP (ancre USD)

| Tier | **USD** (24 mois) | McB | Posture frais | Posture soft |
|------|-------------------|-----|---------------|--------------|
| Bronze | **25** | f(cours) | Aucune / très mild | Badge + support standard+ |
| Silver | **75** | f(cours) | Soft swap / P2P | Early soft |
| **Gold** | **200** | f(cours) | Significatif, plafonné | Salon · boost · Academy soft · priorité |
| Diamond | **500** | f(cours) | Caps plus hauts + beta | Beta SUG · events |
| **Platinum** | **1 250** | f(cours) | Max rentable | Concierge · conseil soft · early ads |

Legacy 100/300/800/2000/5000 McB ≈ ces USD à **0,25 $/McB** — ne plus vendre comme montant fixe.

---

## 2. Focus Gold vs Platinum (frais)

| Ligne | Baseline | Gold (−15 % rel.) | Platinum (−25 % rel.) | Floor cible plateforme |
|-------|----------|-------------------|------------------------|-------------------------|
| Fiat MM | 5 % | **4,25 %** | **3,75 %** | ≥ 3,5 % |
| Swap standard | 1 % | **0,85 %** | **0,75 %** | ≥ 0,70 % |
| Swap fiat→crypto | 2,5 % | **2,125 %** | **1,875 %** | ≥ 1,75 % |
| Withdraw crypto | 2 USDT | **1,75** | **1,50** | ≥ 1,50 USDT |
| Futures / côté | 5 bps | **4 bps** | **3 bps** | ≥ 3 bps |

| | Gold | Platinum |
|--|------|----------|
| **CAP annuel** manque à gagner frais | ~**90–120 USD** / membre | ~**350–450 USD** / membre |
| **Budget soft** (OPEX estimé) | ~40–60 USD équiv. / an | ~120–180 USD équiv. / an |
| Après CAP atteint | Tarifs **baseline** pour le reste de l’année | Idem |

Le CAP évite qu’un power user « vide » la marge malgré un badge payé.

---

## 3. Soft perks (expirent avec le badge)

| Perk | Bronze | Silver | Gold | Diamond | Platinum |
|------|--------|--------|------|---------|----------|
| Badge profil + anneau | oui | oui | oui | oui | oui |
| File support | standard+ | standard+ | **priority** | priority | **concierge** |
| Salon / espace tier | - | - | **Salon Gold** | Salon+ | Salon Platinum |
| Boost Community / jour | 3 (défaut) | 3 | **5** | 6 | **8** |
| Boost actifs simultanés | 1 | 1 | **2** | 2 | **3** |
| Academy soft (accès limité) | - | - | **oui** | oui | oui + guest pass |
| Beta SUG / features | - | - | - | **oui** | oui |
| Events privés | - | - | invite soft | oui | oui |
| Early ads créateur | - | - | - | soft | **oui** |
| Conseil Builders (voix soft) | - | - | - | - | **oui** |
| Éligibilité Ambassadeur charte | non | non | **oui** | oui | oui |

---

## 4. Bronze / Silver / Diamond (bref)

| Tier | Remises frais proposées | CAP frais / an | Soft |
|------|-------------------------|----------------|------|
| Bronze | Optionnel −5 % rel. swap std seulement (→ 0,95 %) | ~8–12 USD | Badge |
| Silver | Swap −10 % rel. ; MM −5 % rel. ; pas withdraw/futures | ~25–40 USD | Mild early |
| Diamond | Comme Gold +1 cran (ex. −20 % rel. frais, floors ≥ Platinum floors) ; CAP ~200–280 USD | Beta + events |

---

## 5. Ce qui tombe à 24 mois vs ce qui reste

| Expire (non renouvelé) | Conservé |
|------------------------|----------|
| Toutes remises frais | Historique tier / dates |
| Salon, quotas boost, Academy soft, beta, events, early ads, concierge, siège conseil | McB déjà claimés / achetés |
| Éligibilité soft Ambassadeur (re-prouver Gold+) | BP, badges earned (Pillier, mentor…) |
| | Mandats charte déjà accordés → **réévaluation séparée** (pas auto-coupés par le badge) |

---

## 6. Garde-fous avant go-live perks

1. Finance signe floors + CAP (USD) et règle burn vs lock McB à l’achat MBP.
2. Prix McB marché inconnu → valider que **coût max perks ≪ valeur perçue / sink McB** à un prix DEX prudent.
3. Ne **pas** mettre les % dans whitepaper / marketing tant que non signés (Constitution : pas de tables discount TBD publiques).
4. Implémentation code : couche `buildersPerksForTier(tier)` + application dans quote frais — **après** signature.
5. P2P fee bps souvent à 0 en env : ne promettre une remise P2P que si `P2P_FEE_BPS > 0`.

---

## 7. Prochaine étape produit

1. Revue finance (valider ou ajuster −15 % / −25 % et CAP).  
2. Brancher perks soft non monétaires d’abord (salon, badge, éligibilité Ambassadeur) — faible risque marge.  
3. Puis remises frais avec CAP.  
4. Charte Ambassadeur (Gold+ requis).

*Brouillon interne. Toute publication externe nécessite validation finance + conformité.*
