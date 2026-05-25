# Déploiement gouvernance AVEC — checklist ops

> Sprint 1 livré. Ce document liste **ce que vous devez faire** côté infra / Render / Neon.

---

## 1. Migration base de données (obligatoire)

Exécuter sur la base **production** (Neon SQL Editor ou `psql`) :

```bash
psql "$DATABASE_URL" -f drizzle/0043_avec_governance.sql
```

Vérification :

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'group_savings_groups' AND column_name = 'governance_mode';

SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'group_proposals';
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

Vérifier que le déploiement inclut le commit avec :
- `scripts/cron-governance-tick.mjs`
- UI Settings → onglet **Gouvernance**
- `PATCH /api/groups/[id]/governance`

---

## 4. Activer la gouvernance sur un groupe pilote

**Dans l’app** (recommandé) :

1. Connexion en tant qu’**admin** du groupe AVEC.
2. **Wallet → Groupes → [votre AVEC] → Paramètres**.
3. Onglet **Gouvernance** → mode **Hybride** → Enregistrer.

**Ou en SQL** :

```sql
UPDATE group_savings_groups
SET governance_mode = 'hybrid'
WHERE id = '<uuid-du-groupe>';
```

### Tester le flux

1. Proposer un payout **> 500 USDT** (Caisse) → une carte de vote apparaît dans **Dialogue**.
2. Les membres (sauf l’initiateur) votent Oui / Non / Abstention.
3. Après 48 h (ou manuellement via le cron tick), le vote se clôture.
4. Si adopté : **24 h de délai** puis exécution automatique au prochain tick cron.

---

## 5. Ce que vous n’avez pas à faire

- Pas de nouvelle variable d’env sur le **Web** (sauf `CRON_SECRET` déjà présent).
- Pas de changement Didit / KYC / billing.
- Les groupes restent en **`legacy` par défaut** tant que vous n’activez pas hybrid/full.

---

## 6. Prochain sprint dev (côté code — pas bloquant pour vous)

- Clôture de cycle via vote collectif
- Rôle comité + votes niveau B (prêts moyens, fonds social)
- Relance automatique des votes expirés

---

*Réf. architecture : [avec-governance-architecture.md](./avec-governance-architecture.md)*
