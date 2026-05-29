# Épargne McBuleli (Staking)

## Produit actif : Staking

- **USDT** : 30 j (6 %), 90 j (9 %), 180 j (12 %) — défauts code, surcharge via `STAKING_USDT_TERMS`
- **Pi** : 30 j (4 %), 90 j (6,5 %), 180 j (9 %)
- Intérêt simple, crédit principal + intérêts à maturité
- UI : `/app/wallet/staking`

## Pool de liquidité — fermé aux nouveaux dépôts

Par défaut `POOL_ENABLED` est **absent / false** :

- Promo wallet et landing masquées
- `POST /api/pool/positions` → `pool_new_deposits_disabled`
- Page `/app/wallet/pool` : positions existantes + retrait rewards ; bandeau + lien Staking
- Prêts garantis pool : `loan_new_disabled` si `POOL_ENABLED` false

Réactiver : `POOL_ENABLED=true` sur le **Web** (et cron pool daily si utilisé).

## Roadmap rendement (hors scope code actuel)

Pistes évoquées pour mieux rémunérer les épargnants :

1. **P2P** — liquidité côté grands vendeurs / marchands vérifiés
2. **AVEC / groupes** — parts ou rendements liés à la trésorerie collective

Le Staking reste le produit fixe et transparent en attendant ces programmes.
