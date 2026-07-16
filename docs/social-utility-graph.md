# McBuleli Social Utility Graph (SUG)

> **Statut :** vision produit & économique - référence interne  
> **Dernière révision :** juillet 2026  
> **Slogan du modèle :** Attention utile (Useful Attention Economy)  
> **Documents liés :** [mcbuleli-constitution-outline.md](./mcbuleli-constitution-outline.md) · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md) · [community-hub-master-plan.md](./community-hub-master-plan.md) · [builders-program-spec.md](./builders-program-spec.md) · [social-utility-horizon-a.md](./social-utility-horizon-a.md) · [social-utility-ads-mcb.md](./social-utility-ads-mcb.md)

---

## 1. Idée en une phrase

Pas un TikTok crypto. Un **réseau social d'utilité financière africaine** où chaque interaction utile (créer, apprendre, aider, trader équitablement) produit de la **réputation mesurable (BP)**, convertible en **McB**, et où les entreprises achètent de la **visibilité réelle** en McB - avec l'**IA McBuleli** comme juge de qualité anti-spam, pas comme feed addictif.

Compatible Constitution : utility only, pas d'ICO, pas de promesse de prix.

---

## 2. Différenciation vs géants

| Réseau | Ce qu'on prend | Ce qu'on refuse |
|--------|----------------|-----------------|
| TikTok | Format court, ranking IA | Addiction / farm engagement vide |
| Instagram | Profils créateurs, ads marques | Pay-to-play opaque |
| X | Threads, débat temps réel | Spam bots, pub invasive |
| Facebook | Groupes locaux | Harvest data, fatigue |
| Telegram | Canaux, bots, faible data | Monétisation créateur absente |
| Discord | Rôles, réputation | Fermé desktop-first |

**Différence radicale :** chez eux l'attention paie Meta/ByteDance. Chez McBuleli, l'attention utile **finance l'utilisateur et le créateur** via BP→McB ; l'entreprise **paie le réseau en McB** (sink token) pour une audience KYC/réelle.

---

## 3. Trois boucles économiques

```
Création (post, live, signal, blog, Q&A)
        │
        ▼
  Quality Score IA (0-100)
        │
        ▼
  BP (off-chain, plafonds) ──► Réputation / MBP
        │
        ├── spend (boost, tips, perks)
        └── claim KYC ──► McB (BEP-20)
                              │
                    Ads entreprises (McB)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Creator Fund      Burn partiel     Ops McBuleli
```

| Instrument | Rôle | Ne pas confondre avec |
|------------|------|------------------------|
| **BP** | Réputation & engagement off-chain | Cash, salaire |
| **McB** | Utilité, ads, perks, claim | Promesse de prix |
| **USDT / PI** | Valeur stable (tips abo, P2P, staking) | Token social |

**Claim pool 40 % / post-claim BP / demande DEX :** voir [mcb-tokenomics-reference.md §6.1–6.5](./mcb-tokenomics-reference.md).  
**MBP :** paliers Bronze→Platinum **payés en McB** (pas BP) - [builders-program-spec.md](./builders-program-spec.md).  
BP = gratuit / facile ; McB = noblesse / services premium. Sans sinks payants (MBP, ads, fees McB), le claim seul ne crée pas de valeur marché.

---

## 4. Quatre piliers SUG

### 4.1 Contenu = preuve d'utilité

Chaque contenu porte un **Utility Tag** (obligatoire ou IA-suggéré) :

`learn` · `trade_edu` · `avec` · `p2p` · `local` · `create` · `signal`

Feed cible : **Pour toi, utile** - ranking = qualité × pertinence locale × fraîcheur × anti-spam. Pas un For You addictif.

### 4.2 Identité progressive

| Niveau | Accès | Exigence |
|--------|-------|----------|
| Guest | Lecture limitée | - |
| Member | Poster / commenter | Email vérifié |
| Verified | Earn BP convertibles, tip | KYC Didit |
| Builder | Badges MBP, early access | Seuils MBP |
| Official / Brand | Ads, page entreprise | KYC + contrat |

### 4.3 IA McBuleli = infrastructure sociale

| Rôle | Fonction |
|------|----------|
| Modérateur | Spam, arnaques P2P, hate - avant pub ou shadow-limit |
| Éditeur | Résumés, traduction FR/EN/SW, Data Saver |
| Matchmaker | Q&A ↔ Academy ↔ marchand P2P |
| Scorer | Quality Score pour BP |
| Curateur ads | Refuse ads trompeuses / pump |

### 4.4 Monétisation multi-rail

| Rail | Qui gagne | Instrument |
|------|-----------|------------|
| Ads marques | McBuleli + Creator Fund | McB spend |
| Tips / boost | Créateur | BP puis McB |
| Abo canal | Créateur | USDT (+ perk McB) |
| Affiliate P2P / Academy | Créateur vérifié | USDT + BP |
| Creator Fund mensuel | Top utility creators | Pool ads McB |

---

## 5. Formule BP (cible)

```
BP_grant = floor(base_action × (0.3 + 0.7 × quality/100))
```

Puis application des plafonds journaliers / mensuels (`REWARD_MONTHLY_EARN_CAP`, `COMMUNITY_REWARD_DAILY_CAPS`).

Consommation utile récompensée (exemples) : finir un live Academy, quiz réussi, réponse Q&A acceptée - **pas** le scroll infini.

---

## 6. Ancrage code (juillet 2026)

| Brique | État | Fichiers / routes |
|--------|------|-------------------|
| Feed, likes, comments | Live | `/app/community/feed`, `community_posts` |
| Blogs, Q&A, signaux | Partiel / live | `/app/community/*` |
| BP community | Live | `rewards-service.ts`, `reward-points-config.ts` |
| Profils publics | Schéma prêt | `community_user_profiles` (handle, reputationScore) |
| Composer kinds | Live | `composer-config.ts` (news, discussion, analysis, experience) |
| Claim McB | Portal | `/app/wallet/points`, `mcb-claim-service` |
| Builders / ads / Creator Fund | Spec only | Voir horizons A/B |

---

## 7. Roadmap

| Horizon | Fenêtre | Focus | Spec |
|---------|---------|-------|------|
| **A** | 0-3 mois | Utility Tags, Quality Score v0, Boost BP, profil créateur | [social-utility-horizon-a.md](./social-utility-horizon-a.md) |
| **B** | 3-9 mois | Ads McB, Creator Fund, tips, canaux locaux, IA modération | [social-utility-ads-mcb.md](./social-utility-ads-mcb.md) |
| **C** | 9-24 mois | Abo USDT, ranking mature, gouvernance légère, NFT certificats optionnels | À rédiger quand B démarre |

---

## 8. Risques & garde-fous

| Risque | Garde-fou |
|--------|-----------|
| Farm BP / spam | Caps + Quality Score + KYC pour claim |
| Social token spéculatif | Constitution : utility, ads = sink |
| Créateurs payés en McB illiquide | Creator Fund mix USDT+McB ; tips USDT possibles |
| Ads trompeuses | Revue IA + policy refuse pump |
| Coût vidéo type TikTok | Texte/image/live Jitsi d'abord ; short video Phase B+ |
| Régulation | Ads ≠ offre de titres ; disclaimer éducatif |

---

## 9. Test Constitution

Avant toute feature SUG :

> Est-ce conforme à la vision, à l'architecture Capital→…→Conformité, et aux principes utility-only du Whitepaper ?

Si non : redesign ou abandon.

---

*Document maintenu par l'équipe produit McBuleli. Toute modification des % Creator Fund / burn doit mettre à jour [social-utility-ads-mcb.md](./social-utility-ads-mcb.md) et la tokenomics en même temps.*
