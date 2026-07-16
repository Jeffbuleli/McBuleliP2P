# SUG Horizon A - Spec produit (0-3 mois)

> **Statut :** A1/A2/A4 en code. A5 pending.  
> **Parent :** [social-utility-graph.md](./social-utility-graph.md)  
> **Dernière révision :** juillet 2026  
> **Objectif :** Social Utility MVP - qualité > volume, sinks BP immédiats, base créateur

Migration : `0099_sug_horizon_a.sql` + `0100_community_post_boost.sql`  
Config tags : `src/lib/community/utility-tags.ts`  
Score : `src/lib/community/quality-score.ts`  
Boost : `src/lib/community/boost-service.ts` (80 BP / 24h)
---

## 1. Périmètre Horizon A

| # | Livrable | Priorité |
|---|----------|----------|
| A1 | Utility Tags sur posts feed | P0 |
| A2 | Quality Score v0 (règles + light IA) | P0 |
| A3 | Recalibrage grants BP community (multiplicateur qualité) | P0 |
| A4 | Boost post 24h payé en BP | P1 |
| A5 | Profil créateur public enrichi (stats BP) | P1 |

Hors scope A : ads McB, Creator Fund, tips McB, abonnements USDT, short video (→ Horizon B/C).

---

## 2. Utility Tags (A1)

### 2.1 Taxonomie

| Code | Label FR | Label EN | Mapping composer actuel |
|------|----------|----------|-------------------------|
| `learn` | Apprendre | Learn | analysis, article, formation |
| `trade_edu` | Trading (éducatif) | Trade (edu) | analysis, signal |
| `avec` | AVEC | Group savings | experience (si tag manuel) |
| `p2p` | P2P | P2P | experience |
| `local` | Vie locale | Local life | news, discussion |
| `create` | Création | Create | news, discussion |
| `signal` | Signal | Signal | signal (redirect) |

Un post feed a **exactement un** `utility_tag` obligatoire à la publication.

### 2.2 Schéma

Sur `community_posts` :

```sql
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS utility_tag varchar(16) NOT NULL DEFAULT 'create';
CREATE INDEX IF NOT EXISTS community_posts_utility_tag_idx
  ON community_posts (utility_tag, published_at);
```

Default `create` pour rétrocompat ; migration backfill heuristique depuis `content_kind` :

| content_kind | utility_tag défaut |
|--------------|-------------------|
| news | local |
| discussion | create |
| analysis | trade_edu |
| experience | p2p |
| (autres) | create |

### 2.3 UI

- Composer : sélecteur de tag (chips) sous le kind existant (`composer-config.ts`)
- Feed : filtre optionnel par tag + badge discret sur carte post
- IA (optionnel A1.b) : suggestion de tag à la saisie (non bloquante)

### 2.4 Fichiers cibles

- [`src/lib/community/composer-config.ts`](../src/lib/community/composer-config.ts)
- [`src/lib/community/post-types.ts`](../src/lib/community/post-types.ts)
- [`src/db/schema.ts`](../src/db/schema.ts) - `communityPosts`
- APIs `POST /api/community/feed` (+ validation Zod)
- Feed UI composants community

---

## 3. Quality Score v0 (A2)

### 3.1 Score 0-100

| Facteur | Poids v0 | Source |
|---------|----------|--------|
| Longueur / structure (min chars déjà en composer) | 15 | Règles |
| Pas de liens scam / mots interdits | 25 | Règles + liste |
| Auteur KYC ou email vérifié | 15 | users / KYC |
| Pas de doublon récent (similarité basique) | 20 | Hash / trigram léger |
| Signal IA (spam / conseil d'investissement toxique) | 25 | OpenAI light (async) |

**v0 synchrone :** facteurs règles seuls → score provisoire 40-85.  
**v0 async :** job / after() met à jour `quality_score` + ajuste ledger si besoin (ou applique seulement aux grants futurs).

Recommandation produit v0 : **appliquer le multiplicateur au grant au moment du credit**, avec score règles synchrone ; IA affine le score pour le ranking feed (pas de clawback BP sauf fraude).

### 3.2 Schéma

```sql
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS quality_score smallint NOT NULL DEFAULT 50;
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS quality_source varchar(16) NOT NULL DEFAULT 'rules';
-- quality_source: rules | ai | hybrid
```

### 3.3 Formule grant

```
BP_grant = floor(base_action × (0.3 + 0.7 × quality_score/100))
```

Exemple : post texte base 25 BP, quality 80 → `floor(25 × 0.86) = 21`.  
Quality 30 → `floor(25 × 0.51) = 12`.

Toujours soumis à `COMMUNITY_REWARD_DAILY_CAPS` et `REWARD_MONTHLY_EARN_CAP` (4000).

### 3.4 Fichiers cibles

- Nouveau : `src/lib/community/quality-score.ts`
- [`src/lib/community/rewards-service.ts`](../src/lib/community/rewards-service.ts)
- [`src/lib/reward-points-config.ts`](../src/lib/reward-points-config.ts) (doc formule)
- Assistant / OpenAI client existant pour scorer async (réutiliser patterns Academy tutor)

### 3.5 Garde-fous Constitution

- Pas de conseil d'investissement personnalisé → score bas + éventuel soft reject
- Contenu éducatif signal OK si disclaimer présent

---

## 4. Recalibrage BP community (A3)

| Action | Base actuelle | Changement Horizon A |
|--------|---------------|----------------------|
| Post texte / image / vidéo | 25 / 40 / 60 | × multiplicateur qualité |
| Commentaire | 8 | × qualité commentaire simplifiée (longueur + non-spam) ou fixe 8 si coût trop élevé |
| Like donné | 3 | **Baisser à 1** ou garder cap strict (anti-farm) |
| Like reçu | 5 | Garder, plafonné |
| Blog | 100 | × qualité (min score 50 pour grant plein) |
| Q&A accept | 50 | Garder (déjà "utile") |

Documenter les nouvelles bases dans `reward-points-config.ts` + ce fichier le même jour.

**Consommation utile (nouveaux grants, P1) :**

| Action | BP | Note |
|--------|-----|------|
| Live Academy completed (attendance confirmée) | brancher `community_live_join` 35 | Lacune G1 tokenomics |
| Quiz passed | déjà 60 | OK |

---

## 5. Boost post 24h en BP (A4)

### 5.1 Produit

- Coût : **80 BP** (aligné ordre de grandeur P2P fee perk)
- Durée : **24 heures**
- Effet : `boosted_until = now() + 24h` ; feed trie boosted d'abord (puis quality × time)
- Limite : 1 boost actif par user ; max 3 boosts / jour
- KYC : **non requis** pour spender BP (déjà earned) ; claim McB reste KYC

### 5.2 Schéma

Réutiliser pattern perks ou colonnes post :

```sql
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS boosted_until timestamptz;
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS boost_bp_spent integer;
```

Ledger : debit BP via `reward_point_grants` négatif ou table spends existante (`reward_point_perks` / spend API).

Étendre `REWARD_SPEND` :

```ts
POST_BOOST_24H: {
  perkType: "community_post_boost_24h",
  costBp: 80,
  validHours: 24,
}
```

### 5.3 API / UI

- `POST /api/community/feed/[id]/boost` - auth, solde BP, ownership (auteur d'abord)
- Menu propriétaire sur carte post → Booster
- Badge "Boosté" discret jusqu'à expiration

### 5.4 Fichiers

- [`src/lib/reward-points-config.ts`](../src/lib/reward-points-config.ts)
- Nouveau service `src/lib/community/boost-service.ts`
- Feed query order : `boosted_until > now()` DESC, puis trending existant

---

## 6. Profil créateur (A5)

### 6.1 Existant

Table `community_user_profiles` : handle, displayName, bio, reputationScore, postsCount, showKycBadge, verifiedBlue.

Route prévue : `/app/community/u/[handle]` (Phase 2 hub).

### 6.2 Enrichissements Horizon A

| Champ / metric | Source |
|----------------|--------|
| BP earned (community, 30j) | agrégat `reward_point_grants` types community_* |
| Posts count / likes received | déjà / agregats |
| Top utility tags | DISTINCT utility_tag counts |
| Builder badge | MBP quand live (lien placeholder) |
| CTA | Tip (disabled Horizon A) / Follow trader si applicable |

### 6.3 API

- Étendre `GET /api/community/profiles/[handle]` avec `stats: { bpEarned30d, posts, likesReceived, tags[] }`
- Pas d'exposition de solde BP total wallet (privacy) - seulement earned community window

### 6.4 UI

- Page profil : hero handle, bio, KYC badge, grille stats, derniers posts
- Lien depuis auteur sur feed

---

## 7. Ordre d'implémentation recommandé

1. Migration `utility_tag` + `quality_score` + backfill
2. Composer + API validation tags
3. `quality-score.ts` règles + branchement rewards-service
4. Boost BP + feed sort
5. Profil stats + page `/u/[handle]` si pas encore shippée

---

## 8. Critères de done Horizon A

- [ ] Tout nouveau post feed a un utility_tag
- [ ] Grants community appliquent la formule qualité (tests unitaires)
- [ ] Boost 24h débite 80 BP et remonte le post
- [ ] Profil public affiche stats BP community 30j
- [ ] Caps anti-farm toujours respectés
- [ ] Aucune promesse de prix McB dans l'UI

---

## 9. Tickets suggérés (engineering)

| ID | Titre |
|----|-------|
| SUG-A1 | Migration + utility_tag composer/API |
| SUG-A2 | quality-score rules + rewards multiplier |
| SUG-A3 | Lower like-given BP + docs config |
| SUG-A4 | Post boost 24h spend BP |
| SUG-A5 | Creator profile stats endpoint + page |
| SUG-A6 | Branch community_live_join on Academy attendance |

---

*Après validation produit de A, passer à [social-utility-ads-mcb.md](./social-utility-ads-mcb.md) (Horizon B).*
