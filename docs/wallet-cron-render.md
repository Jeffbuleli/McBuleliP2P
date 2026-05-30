# Crons wallet USDT sur Render

Trois **Cron Jobs** appellent l’API web McBuleli :

| Service Render | Script | Schedule |
|----------------|--------|----------|
| `mcbuleli-wallet-deposit-scan` | `cron-wallet-deposit-scan.mjs` | */2 min |
| `mcbuleli-wallet-withdraw-worker` | `cron-wallet-withdraw-worker.mjs` | */1 min |
| `mcbuleli-wallet-retry-jobs` | `cron-wallet-retry-failed-jobs.mjs` | */15 min |

## Erreur « missing CRON_SECRET »

Le cron **n’hérite pas** automatiquement des variables du service Web. Chaque cron doit avoir les mêmes secrets, définis à la main.

### 1. Service Web (McBuleli Next.js)

**Environment** :

| Variable | Exemple |
|----------|---------|
| `CRON_SECRET` | `openssl rand -base64 24` (≥ 12 caractères) |
| `WALLET_AUTOMATION_ENABLED` | `1` |

### 2. Chaque cron wallet (les 3)

**Environment** (valeurs **identiques** au Web pour le secret) :

| Variable | Valeur |
|----------|--------|
| `CRON_SECRET` | **Même chaîne** que sur le Web |
| `MCBULELI_API_URL` | `https://mcbuleli.org` |

Optionnel : `WALLET_CRON_SECRET` au lieu de `CRON_SECRET` (même valeur).

### 3. Vérification

Dans Render → cron → **Logs**, après la prochaine exécution vous devez voir du JSON (succès), pas `missing CRON_SECRET`.

Test manuel :

```bash
curl -s -X POST "https://mcbuleli.org/api/internal/wallet/retry-failed-jobs" \
  -H "x-cron-secret: VOTRE_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Réponse attendue : `200` avec un corps JSON (pas `401`).

## Astuce Render : variables sur chaque cron

Chaque cron wallet déclare `CRON_SECRET` + `MCBULELI_API_URL` dans `render.yaml` (comme `mcbuleli-bots-tick`). Dans le Dashboard Render, renseignez les **mêmes valeurs** que sur le service Web — une seule fois par cron si vous n’utilisez pas de Blueprint sync.

## Email « service unavailable » à chaque deploy

Render envoie cet email quand le **dernier run du cron a échoué** (exit 1). Corriger `CRON_SECRET` sur le cron stoppe les échecs et ces alertes.
