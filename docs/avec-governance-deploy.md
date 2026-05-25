# Déploiement gouvernance AVEC — checklist ops

> Stack cible : **PostgreSQL 16** (base de données) + **Render** (Web + crons).  
> Aucun Neon, aucun service DB tiers requis.

---

## 1. Migration base de données (obligatoire)

La migration `0043_avec_governance.sql` doit être appliquée sur **votre Postgres 16 de prod** (souvent **Render PostgreSQL** lié au service Web).

### Récupérer l’URL (Render)

1. Render Dashboard → votre base **PostgreSQL** (ou onglet **Environment** du service Web si la DB est liée).
2. Copier **External Database URL** (pour lancer `psql` depuis votre Mac) — format :
   `postgresql://user:pass@host:5432/dbname`
3. Si Render exige SSL, ajouter `?sslmode=require` à la fin de l’URL si ce n’est pas déjà présent.

### Option A — `psql` (recommandé, une migration)

Depuis la racine du repo :

```bash
export DATABASE_URL='postgresql://...'   # External URL Render PG 16
psql "$DATABASE_URL" -f drizzle/0043_avec_governance.sql
```

Sans variable d’env :

```bash
psql -h VOTRE_HOTE.render.com -p 5432 -U VOTRE_USER -d VOTRE_BASE \
  -f drizzle/0043_avec_governance.sql
```

### Option B — script npm (toutes les migrations en attente)

Si vous utilisez déjà `.env.render` avec `DATABASE_URL` (comme pour Didit / migrations précédentes) :

```bash
# .env.render contient DATABASE_URL=postgresql://... (External URL Render)
npm run db:migrate:render
```

Cela applique **tous** les fichiers `drizzle/*.sql` pas encore journalisés, dont `0043`.

### Option C — client SQL

Coller le contenu de `drizzle/0043_avec_governance.sql` dans pgAdmin, DBeaver, TablePlus, etc., connecté à votre PG 16.

Le fichier est **idempotent** (`IF NOT EXISTS`) — le relancer ne casse rien.

Vérification :

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'group_savings_groups' AND column_name = 'governance_mode';

SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'group_proposals';
-- attendu : 1
```

Sans cette étape, le mode gouvernance et les votes **échoueront** au runtime.

### Sprint 2 (comité + relances)

```bash
psql "$DATABASE_URL" -f drizzle/0044_governance_sprint2.sql
```

Ajoute `vote_audience`, `retry_count`, `parent_proposal_id` sur `group_proposals`.

### Sprint 3 (aide solidarité démocratique)

```bash
psql "$DATABASE_URL" -f drizzle/0045_social_fund_requests.sql
```

Crée la table `group_social_fund_requests` (demandes d’aide, lien vote, statuts).

| Montant aide | Vote |
|--------------|------|
| **&lt; 50 USDT** | Comité (24 h) |
| **≥ 50 USDT** | Tous les membres (48 h) |

Plafonds applicatifs : 200 USDT / membre / demande, 500 USDT / groupe / mois, 30 j entre deux demandes du même membre. Paiement **uniquement** depuis le fonds solidarité.

UI : onglet **Trésorerie** → panneau **Aide solidarité** ; votes et cartes dans **Dialogue**.

### Sprint 4 (poches pénalités / intérêts + taux pénalité voté)

Pas de migration SQL — extension du ledger par `meta.bucket` et types d’écriture :

- Remboursement prêt → **épargne** (principal), **intérêts**, **pénalités** (3 lignes si besoin).
- Proposition `change_penalty_rate` (vote membres 72 h, comme le taux d’intérêt).
- Trésorerie / Vue : affichage des poches **Pénalités** et **Intérêts**.

### Sprint 5 (rôles granulaires)

```bash
psql "$DATABASE_URL" -f drizzle/0046_granular_roles.sql
```

Ajoute `granular_roles` (jsonb) sur `group_savings_memberships`.

| Rôle fonctionnel | Capacités |
|------------------|-----------|
| **Trésorier** (`treasurer`) | Proposer retraits collectifs (palier B/C) |
| **Crédit** (`credit_officer`) | Proposer des prêts internes |
| **Secrétaire** (`secretary`) | Rôle affiché (modération PV — évolution) |

Attribution via **Paramètres → Gouvernance → Rôles fonctionnels** → vote membres 72 h (`set_granular_roles`).

### Sprint 6 (dialogue secrétaire + badge confiance)

Pas de migration SQL.

| Fonctionnalité | Détail |
|----------------|--------|
| **Secrétaire** | Masquer / rétablir messages chat ; publier **PV** (`minutes`) dans Dialogue |
| **Membres** | Rôles fonctionnels affichés ; badge **Nouveau / Actif / Engagé** (informatif, 1 voix = 1 membre) |
| **Wallet** | Bannières marketing `public/ads/` sur cartes Staking / Pool / AVEC |

Test : attribuer rôle secrétaire → vote → publier un PV ; masquer un message hors sujet.

### Sprint 7 (exclusion membre + transfert poches)

Pas de migration SQL.

| Fonctionnalité | Détail |
|----------------|--------|
| **Exclusion membre** | Plus de révocation directe — vote `revoke_member` 72 h (admin propose) |
| **Transfert poches** | Vote `transfer_fund_bucket` : pénalités/intérêts → solidarité, réserve ou épargne |

UI : **Membres** → « Proposer exclusion » · **Trésorerie** → bloc transfert (si pénalités/intérêts &gt; 0).

### Sprint 8 (bureau, crédit, plafond journalier, landing ads)

Pas de migration SQL.

| Fonctionnalité | Détail |
|----------------|--------|
| **Nomination admin** | Vote `appoint_admin` 72 h — l’admin actuel devient co-admin, la cible devient admin |
| **Révocation co-admin** | Vote `revoke_admin` — UI **Membres** → bloc « Direction (vote collectif) » |
| **Poche crédit** | `creditUsdt` = encours prêts (`lentUsdt`) affiché en Trésorerie / Vue |
| **Plafond journalier** | Max **2000 USDT / 24 h** (retraits + aide solidarité) — `group_gov_daily_outflow_cap` |
| **Landing** | Bannières `public/ads/` (Wallet, P2P, Futures, AVEC) sous le hero |

### Sprint 9 (prêts B/C, plafond visible, UX votes)

Pas de migration SQL.

| Fonctionnalité | Détail |
|----------------|--------|
| **Demandes prêt ≥ 50 USDT** | Acceptation manager → vote comité (B) ou membres (C), plus de file 2/3 seule |
| **Prêts proposés** | Retour UI « vote dans Dialogue » (comme clôture / retraits) |
| **Plafond 24 h** | Inclut **décaissements prêts** ; jauge dans **Trésorerie** |
| **Landing** | + Staking et Bots sur la grille promo |

### Sprint 10 (scénarios cahier des charges — complétion)

Pas de migration SQL.

| Fonctionnalité | Détail |
|----------------|--------|
| **Dissolution** | Vote `dissolve_group` (96 h, 80 % / 66 %) — groupe → statut `closed` |
| **Règles réunion** | Vote `change_meeting_rules` (parts max, cycle, intervalle) |
| **Charte publique** | Vote `change_charter` (profil public du groupe) |
| **Annulation vote** | Auteur ou admin peut annuler une proposition `voting` |
| **Snapshot électeurs** | Membre approuvé **après** `voteOpensAt` ne vote pas |
| **Quorum plancher** | Minimum **3** participants si le groupe le permet |
| **Hub gouvernance** | Vue d’ensemble : votes ouverts + lien Dialogue |

#### Matrice scénarios métier (architecture §16–18)

| Scénario | Statut système |
|----------|----------------|
| S1 Gros retrait (≥ 500 USDT) | `payout_critical` + délai 24 h + plafond journalier |
| S2 Révocation co-admin | `revoke_admin` + UI Membres |
| S3 Aide sociale (décès, etc.) | `social_aid_*` + limites + fonds social |
| S4 Taux intérêt / pénalité | `change_interest_rate` / `change_penalty_rate` |
| Clôture de cycle | `cycle_closure` (96 h) — prêts dus bloquants |
| Dissolution groupe | `dissolve_group` (96 h) — prêts / retraits bloquants |
| Exclusion membre | `revoke_member` |
| Nomination admin | `appoint_admin` |
| Transfert poches | `transfer_fund_bucket` |
| Prêt ≥ 100 / 50–99 | `loan_critical` / `loan_medium` (y compris acceptation demande) |
| Comité / co-admins / rôles | `set_committee`, `set_co_admins`, `set_granular_roles` |
| Quorum absent | `expired` + relance auto (max 3) |
| Groupe suspendu | Gouvernance gelée (`assertGroupReady`) |
| Collusion 2/3 (gros montants) | Contourné par votes B/C obligatoires |

---

## 2. Cron Render — clôture votes + exécution payouts

Le blueprint `render.yaml` inclut **`mcbuleli-governance-tick`** (toutes les 10 min).

### Si vous utilisez le Blueprint Render

1. Dashboard Render → **Blueprints** → sync / apply le blueprint mis à jour.
2. Vérifier que le cron **`mcbuleli-governance-tick`** existe.

### Variables d’environnement du cron (identiques aux autres crons)

| Variable | Valeur |
|----------|--------|
| `MCBULELI_API_URL` | `https://mcbuleli.org` (sans slash final) |
| `CRON_SECRET` | **Même valeur** que sur le service Web |

### Test manuel

```bash
curl -s -X POST \
  -H "x-cron-secret: VOTRE_CRON_SECRET" \
  https://mcbuleli.org/api/internal/governance/tick
```

Réponse attendue : `{"ok":true,"closed":0,"executed":0,"errors":[]}`

---

## 3. Déployer le code Web

Après push sur `main`, Render redéploie le service Web automatiquement (si branch connectée).

Vérifier que le déploiement inclut `scripts/cron-governance-tick.mjs` et le blocage des raccourcis admin (co-admins, fonds social, etc.).

---

## 4. Règles McBuleli (modèle unique)

| Action | Règle |
|--------|--------|
| Retrait / prêt **&lt; 50 USDT** | **2/3** gestionnaires |
| Retrait **50–499** ou prêt **50–99 USDT** | **Vote comité** (24 h, 50 % quorum) |
| Retrait **≥ 500 USDT** | Vote membres (48 h + 24 h délai) |
| Prêt **≥ 100 USDT** | Vote membres (72 h) |
| Comité, co-admins, **taux** fonds social (réunion), taux | Vote membres (72 h) |
| **Aide solidarité** (paiement) &lt; 50 USDT | Vote comité (24 h) |
| **Aide solidarité** ≥ 50 USDT | Vote membres (48 h) |
| **Taux intérêt / pénalité** prêts | Vote membres (72 h) |
| **Rôles fonctionnels** (trésorier, crédit, …) | Vote membres (72 h) |
| **PV de réunion** (secrétaire / gestionnaires) | Publication Dialogue |
| **Exclusion d’un membre** | Vote membres (72 h) |
| **Transfert pénalités / intérêts** | Vote membres (72 h) |
| **Nomination administrateur** | Vote membres (72 h) |
| **Révocation co-admin** | Vote membres (72 h) |
| **Sorties trésorerie** | Plafond **2000 USDT / 24 h** (retraits + aide + prêts) |
| **Prêt ≥ 100 USDT** (demande acceptée) | Vote membres (72 h) |
| **Prêt 50–99 USDT** (demande acceptée) | Vote comité (24 h) |
| **Dissolution du groupe** | Vote membres (96 h, 80 % / 66 %) |
| **Règles de réunion / charte** | Vote membres (72 h) |
| **Annulation d’un vote ouvert** | Auteur ou admin |
| Clôture de cycle | Vote membres (96 h, 80 % / 66 %) |
| Quorum absent | Relance auto (max 3) |
| Initiateur | Ne vote pas sa propre proposition |

### Tester

1. Payout **≥ 500 USDT** → vote dans **Dialogue**.
2. Co-admins (Paramètres) ou fonds social (Réunion) → vote, pas d’effet immédiat.
3. Tick cron : `POST /api/internal/governance/tick` avec `CRON_SECRET`.

---

## 5. Ce que vous n’avez pas à faire

- Pas de nouvelle variable d’env Web (sauf `CRON_SECRET` déjà présent).
- Pas d’activation `governance_mode` en SQL (colonne ignorée par l’app).

---

*Réf. architecture : [avec-governance-architecture.md](./avec-governance-architecture.md)*
