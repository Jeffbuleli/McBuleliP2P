# Builders pricing — ancre USD (anti-catastrophe trésorerie)

> **Statut :** règle produit obligatoire avant remises de frais  
> **Dernière révision :** juillet 2026  
> **Liés :** [builders-perks-economics.md](./builders-perks-economics.md) · [builders-program-spec.md](./builders-program-spec.md) · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md)

## Problème

Un prix fixe en McB (ex. Gold = **800 McB**) est sûr **seulement** si 1 McB ≈ 0,25 USD.  
Au lancement on-chain, 1 USD peut acheter **beaucoup** de McB. Alors 800 McB ≈ quelques cents, mais le badge ouvrirait des remises off-chain (MM, swap, withdraw) alors que McBuleli paie toujours agrégateurs et frais on-chain → **trou de trésorerie**.

## Règle

| Concept | Rôle |
|---------|------|
| **Prix catalogue** | **USD** pour 24 mois (ancre économique) |
| **Paiement** | Montant **McB** = `ceil(USD / cours_McB_USD)` |
| **Cours** | TWAP / `MCB_USD_RATE` (admin), jamais sous `BUILDERS_MCB_USD_FLOOR` |
| **Remises frais** | Uniquement si cours ≥ `BUILDERS_FEE_PERKS_MIN_MCB_USD` **et** USD payé ≥ 95 % du catalogue |

```
McB_requis = ceil( prix_USD_tier / max(TWAP, FLOOR) )
```

Exemple Gold **200 USD** :

| Cours McB | McB à envoyer | Remises frais |
|-----------|---------------|---------------|
| 0,00002 USD | **10 000 000** McB | OFF si &lt; 0,01 |
| 0,01 USD | **20 000** McB | ON (seuil min) |
| 0,25 USD | **800** McB | ON (ancien sticker) |

## Catalogue USD proposé (24 mois)

| Tier | USD | Logique |
|------|-----|---------|
| Bronze | 25 | Badge / statut |
| Silver | 75 | Soft |
| **Gold** | **200** | Couvre CAP frais ~90–120 USD/an + soft (ordre de grandeur) |
| Diamond | 500 | Caps plus hauts |
| **Platinum** | **1 250** | Couvre CAP ~350–450 USD/an + concierge |

Les anciens stickers 100/300/800/2000/5000 McB = **legacy** (≈ catalogue à 0,25 USD/McB) — plus le prix économique.

## Phases

1. **Sans cours** (`MCB_USD_RATE` absent) → pas d’achat (erreur `builders_mcb_rate_unavailable`).
2. **Cours bas** (&lt; 0,01 USD/McB) → achat possible si rate set, **fee perks OFF** (badge soft seulement).
3. **Cours mature** → fee perks ON + CAP annuel inchangé.

## Code

| Fichier | Rôle |
|---------|------|
| `src/lib/builders/builders-pricing.ts` | USD, quote McB, gates |
| `src/lib/builders/builders-config.ts` | Catalogue public |
| `drizzle/0103_builders_usd_anchor.sql` | `paid_usd_notional`, `mcb_usd_rate`, `fee_perks_unlocked` |
| Env | `MCB_USD_RATE` ou `MCB_USD_TWAP` ou `BUILDERS_MCB_USD_RATE` |

## Ops

1. Avant d’ouvrir les achats : publier un cours admin / brancher TWAP Pancake.  
2. Migrer `0103` en prod.  
3. Ne brancher les remises frais qu’avec `fee_perks_unlocked` + CAP.  
4. Recaler les USD catalogue si les CAP frais changent (finance).

*Constitution : pas de promesse de prix McB — le catalogue USD est un prix de **service**, pas une valorisation du token.*
