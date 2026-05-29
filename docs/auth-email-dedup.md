# Auth — anti-doublons email & KYC

## Incident typique

Deux comptes : `user@gmail.com` et `user@gmail.coom` (faute dans le domaine).  
L’inscription ne bloquait pas car l’unicité était **exacte** sur `email`, alors que le login utilisait parfois `lower()`.

## Protections (depuis migration `0050`)

| Couche | Comportement |
|--------|----------------|
| **Normalisation** | trim + lowercase à l’inscription / login / changement d’email |
| **`email_canonical`** | Clé unique : Gmail sans points ni `+alias`, domaines corrigés (`gmail.coom` → `gmail.com`) |
| **Typos domaine** | Refus si même local-part + domaine proche (Levenshtein / liste connue) |
| **Login** | `findUserByAuthEmail` — canonical puis `lower(email)` |
| **KYC** | Même `document_number` sur un autre compte actif → `manual_review` |

## Déploiement prod

```bash
# 1. Migration (adds column)
npm run db:migrate:render

# 2. Backfill canonical values + unique index (if no duplicates)
npm run db:backfill-email-canonical
```

Si le backfill échoue avec `42703`, la colonne n’existait pas : relancer `db:migrate:render` puis le backfill (le script crée aussi la colonne si besoin).

Si le backfill affiche `DUPLICATE canonical`, fusionner à la main :

```bash
node scripts/admin-user-account.cjs lookup user@gmail.com
node scripts/admin-user-account.cjs lookup user@gmail.coom
node scripts/admin-user-account.cjs retire <uuid_doublon> --confirm
# ou transfer-kyc si KYC sur le mauvais compte — voir docs/kyc-account-merge.md
```

## Codes API (client)

| Code | Signification |
|------|----------------|
| `auth_email_taken` | Email déjà enregistré |
| `auth_email_typo_duplicate` | Typo domaine / canonical identique — champ `suggestedEmail` |
| `auth_email_blocked` | Email système (`@pi.local`, `retired+…`) |

## Fichiers

- `src/lib/auth/email-normalize.ts`
- `src/lib/auth/email-uniqueness.ts`
- `src/lib/auth/kyc-document-uniqueness.ts`
