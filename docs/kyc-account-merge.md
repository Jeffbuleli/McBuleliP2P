# Fusionner deux comptes (Gmail vs e-mail pro) + KYC

## Pourquoi le KYC part sur Gmail ?

Didit est lié au **compte connecté** (`vendor_data` = UUID utilisateur de la session). Si vous étiez connecté avec **Gmail** au moment de lancer la vérification, c’est ce compte-là qui reçoit le statut KYC — pas l’e-mail professionnel.

**Toujours vous connecter avec le compte que vous voulez garder** avant de lancer KYC.

## Votre cas (typique)

| Compte | E-mail | KYC | Action |
|--------|--------|-----|--------|
| **À garder** | pro@… | déjà approuvé | Réinitialiser le mot de passe |
| **À retirer** | gmail@… | en cours / doublons | Retirer après vérif solde = 0 |

> **Important :** retirez toujours le compte **sans** `kyc_status = approved`. Si le KYC approuvé est sur Gmail et le pro n’est pas approuvé, **ne retirez pas Gmail** — transférez le KYC vers le pro (voir ci‑dessous).

## Étapes (super-admin, prod)

### 1. Identifier les deux comptes

Depuis la racine du repo, avec `.env.render` (URL Postgres **External** Render) :

```bash
node scripts/admin-user-account.cjs lookup votre@gmail.com
node scripts/admin-user-account.cjs lookup pro@votre-entreprise.com
```

Notez les `id` (UUID) et `kyc_status` de chaque ligne.

### 2. Réinitialiser le mot de passe du compte KYC (pro)

Choisissez un mot de passe fort **que vous seul connaissez** :

```bash
node scripts/admin-user-account.cjs set-password <UUID_COMPTE_PRO> 'VotreNouveauMotDePasse!'
```

Puis connexion sur https://mcbuleli.org/login avec l’e-mail pro.

### 3. Retirer le compte Gmail doublon

Uniquement si :
- solde USDT / Pi / fiat = **0**
- ce compte **n’est pas** celui avec `kyc_status = approved`

```bash
node scripts/admin-user-account.cjs retire <UUID_COMPTE_GMAIL> --confirm
```

Cela renomme l’e-mail en `retired+<uuid>@deleted.mcbuleli.org` et invalide la session (pas de suppression destructive des historiques liés).

### 4. Cas réel : PRO a l’argent, Gmail avait le KYC (solde 0)

| Compte | KYC | Solde | Action |
|--------|-----|-------|--------|
| **Gmail** (retiré) | était approuvé | **0** | Source du `transfer-kyc` — ne pas essayer de le « réactiver » |
| **PRO** | pas approuvé | **> 0** | **Cible** — garder ce compte, y déplacer le KYC |

Le script `retire` ne touche **pas** aux soldes du compte PRO. `transfer-kyc` ne déplace **pas** l’argent : seulement le statut KYC + historique Didit + identité légale.

**Ne retirez jamais le compte PRO** tant qu’il a un solde (le script le refuse de toute façon).

Le `retire` sur Gmail remet seulement `kyc_status` à `none` sur cette ligne ; l’historique Didit (`kyc_sessions`, `kyc_results`) et souvent les champs légaux restent sur l’**UUID** Gmail (`retired+<uuid>@deleted.mcbuleli.org`).

**Récupération :**

```bash
# 0) Si vous n’avez plus l’UUID Gmail (e-mail = retired+<uuid>@deleted…)
node scripts/admin-user-account.cjs find-retired-kyc

# 1) UUID du compte Gmail retiré (affiché lors du retire, ou lookup-id si vous l’avez noté)
node scripts/admin-user-account.cjs lookup-id <UUID_COMPTE_GMAIL_RETIRE>

# 2) UUID du compte pro
node scripts/admin-user-account.cjs lookup pro@votre-entreprise.com

# 3) Transférer le KYC approuvé Gmail → pro
node scripts/admin-user-account.cjs transfer-kyc <UUID_GMAIL> <UUID_PRO> --confirm

# 4) Mot de passe sur le compte pro
node scripts/admin-user-account.cjs set-password <UUID_PRO> 'VotreNouveauMotDePasse!'
```

Connexion : **e-mail pro** uniquement (le Gmail reste retiré ; c’est normal).

### 5. Si l’e-mail pro est sur le mauvais compte

Contactez **hi@mcbuleli.org** avec les deux UUID — un changement d’e-mail manuel en base peut être fait une fois (contrainte `unique` sur `email`).

### 6. Récupération mot de passe (après déploiement)

Si l’e-mail pro est vérifié : `/forgot-password` → lien par e-mail.  
Sinon : étape 2 (script admin) ou WhatsApp si numéro lié dans **Profil → Sécurité**.

## Notifications KYC en double

Corrigé côté app : une même alerte KYC n’est plus recréée pendant 1 h si le statut n’a pas changé. Les anciennes notifications restent visibles ; vous pouvez les ignorer.

## Support

- hi@mcbuleli.org  
- WhatsApp : wa.me/mcbuleli · +243 997 366 736  
- X : x.com/McBuleli  
