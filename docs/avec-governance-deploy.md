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
| Retrait caisse **&lt; 500 USDT** | Approbation **2/3** gestionnaires |
| Retrait **≥ 500 USDT** | Vote collectif (48 h + 24 h délai) |
| Prêt **≥ 100 USDT** | Vote collectif (72 h) |
| Co-admins, fonds social, taux, révocation admin | Vote collectif (72 h) — **pas de changement direct** |
| Clôture de cycle | Vote collectif (96 h, quorum 80 %, majorité 66 %) |
| Initiateur | Ne vote / n’approuve pas sa propre proposition |

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
