# McBuleli — emails transactionnels (Resend)

Provider : [Resend](https://resend.com) · domaine `mcbuleli.org` · expéditeur `McBuleli <noreply@mcbuleli.org>` · reply-to `hi@mcbuleli.org`

## Quota Free (transactionnel)

| Limite | Valeur |
|--------|--------|
| Mensuel | 3 000 emails |
| Quotidien | 100 emails |

**Compte dans le quota** : tout envoi réel via l’API Resend **ou** le bouton **Send test** du dashboard Resend (y compris un mail intitulé « TEST »).

**Ne compte pas** :

- Prévisualisation HTML dans l’éditeur Resend (sans envoi)
- App en **dev** sans `RESEND_ALLOW_SEND=true` (log console uniquement)
- `npm run resend:sync-templates` (création de templates, pas d’envoi utilisateur)

---

## Inventaire — 11 flux × 2 langues = 22 templates

### Auth & sécurité (5 flux)

| # | Flux | Déclencheur | Template (alias) | Variables |
|---|------|-------------|------------------|-----------|
| 1 | Vérification email | Inscription, renvoi | `mcbuleli-verify-fr` / `-en` | `ACTION_URL` |
| 2 | Mot de passe oublié | Forgot password | `mcbuleli-reset-fr` / `-en` | `ACTION_URL` |
| 3 | Confirmer nouvel email | Changement email | `mcbuleli-email-change-fr` / `-en` | `ACTION_URL` |
| 4 | Alerte changement email | Changement email (ancienne adresse) | `mcbuleli-email-alert-fr` / `-en` | `ACTION_URL`, `NEW_EMAIL` |
| 5 | Mot de passe modifié | Security settings | `mcbuleli-password-changed-fr` / `-en` | `ACTION_URL` |

### Crypto portefeuille (6 flux)

| # | Flux | Déclencheur (code) | Template (alias) | Variables |
|---|------|-------------------|------------------|-----------|
| 6 | Dépôt USDT crédité | `applyConfirmedDeposit` (USDT) | `mcbuleli-deposit-usdt-fr` / `-en` | `ACTION_URL`, `AMOUNT`, `ASSET`, `NETWORK`, `TXID` |
| 7 | Dépôt Pi crédité | `applyConfirmedDeposit` (PI) | `mcbuleli-deposit-pi-fr` / `-en` | idem |
| 8 | Retrait USDT envoyé | Worker auto / admin complete | `mcbuleli-withdraw-usdt-fr` / `-en` | `ACTION_URL`, `AMOUNT`, `ASSET`, `NETWORK`, `FEE`, `TOTAL`, `ADDRESS`, `TXID` |
| 9 | Retrait Pi envoyé | Admin complete (PI) | `mcbuleli-withdraw-pi-fr` / `-en` | idem |
| 10 | Retrait USDT en file | `POST /api/withdrawals` | `mcbuleli-withdraw-queued-usdt-fr` / `-en` | sans `TXID` |
| 11 | Retrait Pi en file | `POST /api/withdrawals` (PI) | `mcbuleli-withdraw-queued-pi-fr` / `-en` | sans `TXID` |

Fichiers source :

- Définitions : `src/lib/email/template-definitions.ts`
- Textes FR/EN : `src/lib/email/copy.ts`
- Envoi auth : `src/lib/email/send-transactional.ts`
- Envoi crypto : `src/lib/email/send-wallet-crypto.ts` · hooks : `src/lib/email/wallet-crypto-notify.ts`
- Illustrations : `public/email/email-*.png` · logo : `public/brand/logo.png`

---

## Images (logo & illustrations)

**Envois réels (prod)** : images en pièces jointes **CID** Resend (`cid:mcbuleli-logo`, `cid:mcbuleli-illus-*`) — compatible Gmail, Outlook et mobile. Les `data:` base64 et les templates Resend seuls **ne s’affichent pas** dans la plupart des boîtes mail.

**Dashboard Resend (sync)** : HTML avec URLs `https://mcbuleli.org/email/*.png` pour l’aperçu éditeur uniquement.

```bash
npm run resend:sync-templates   # optimise PNG + publie les 22 templates (aperçu)
```

Sur Render : **`RESEND_USE_TEMPLATES` absent ou `false`** (défaut). Ne pas forcer `true` sauf tests variables seules (sans images).

`NEXT_PUBLIC_APP_URL` = liens CTA · `EMAIL_ASSET_BASE_URL` = optionnel pour sync (défaut `https://mcbuleli.org`).

---

## Variables d’environnement

| Variable | Local dev | Production |
|----------|-----------|------------|
| `RESEND_API_KEY` | Optionnel (sync) | **Obligatoire** |
| `RESEND_ALLOW_SEND` | absent / `false` | absent / `true` |
| `RESEND_USE_TEMPLATES` | `false` ou absent | **`false` ou absent** (CID inline) |
| `AUTH_EMAIL_FROM` | `McBuleli <noreply@mcbuleli.org>` | idem |
| `AUTH_EMAIL_REPLY_TO` | `hi@mcbuleli.org` | idem |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://mcbuleli.org` |

---

## Commandes

```bash
# Publier / mettre à jour les 22 templates (ne consomme pas le quota transactionnel)
npm run resend:sync-templates
```

---

## Bonnes pratiques quota

1. Ne pas abuser de « Send test » dans Resend — aperçu intégré + un test réel avant prod.
2. En local : pas de `RESEND_ALLOW_SEND=true` sauf test volontaire.
3. Changement d’email = 2 emails ; retrait = email « en file » + email « envoyé ».
4. Surveiller **Settings → Usage** sur [resend.com](https://resend.com).
