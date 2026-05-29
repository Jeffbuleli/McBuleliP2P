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

## Inventaire officiel — 5 flux × 2 langues = 10 templates

| # | Flux | Déclencheur (code) | Destinataire | Template Resend (alias) | Variables |
|---|------|-------------------|--------------|------------------------|-----------|
| 1 | Vérification email | Inscription, renvoi sécurité | Email du compte | `mcbuleli-verify-fr` / `mcbuleli-verify-en` | `ACTION_URL` |
| 2 | Mot de passe oublié | `POST /api/auth/forgot-password` | Email du compte | `mcbuleli-reset-fr` / `mcbuleli-reset-en` | `ACTION_URL` |
| 3 | Confirmer nouvel email | Changement email (sécurité) | **Nouvelle** adresse | `mcbuleli-email-change-fr` / `-en` | `ACTION_URL` |
| 4 | Alerte changement email | Changement email (sécurité) | **Ancienne** adresse | `mcbuleli-email-alert-fr` / `-en` | `ACTION_URL`, `NEW_EMAIL` |
| 5 | Mot de passe modifié | `POST /api/account/security` (mot de passe) | Email du compte | `mcbuleli-password-changed-fr` / `-en` | `ACTION_URL` |

Fichiers source :

- Définitions : `src/lib/email/template-definitions.ts`
- Textes FR/EN : `src/lib/email/copy.ts`
- Envoi : `src/lib/email/send-transactional.ts`

---

## Sujets (aperçu)

| Flux | FR | EN |
|------|----|----|
| Vérification | McBuleli — Confirmez votre email | McBuleli — Confirm your email |
| Reset MDP | McBuleli — Réinitialiser votre mot de passe | McBuleli — Reset your password |
| Nouvel email | McBuleli — Confirmer votre nouvel email | McBuleli — Confirm your new email |
| Alerte email | McBuleli — Changement d'email demandé | McBuleli — Email change requested |
| MDP modifié | McBuleli — Mot de passe modifié | McBuleli — Password changed |

---

## Hors périmètre Resend (pas de quota McBuleli email)

| Canal | Usage |
|-------|--------|
| Notifications in-app | Retraits, dépôts, P2P, KYC… (`notifications-service`) |
| WhatsApp (OpenWA) | OTP récupération compte |
| Emails marketing Resend | Onglet Marketing / Broadcasts (quota contacts séparé) |

---

## Variables d’environnement

| Variable | Local dev | Production |
|----------|-----------|------------|
| `RESEND_API_KEY` | Optionnel (sync templates) | **Obligatoire** |
| `RESEND_ALLOW_SEND` | `false` ou absent (pas d’envoi réel) | `true` ou absent (envoi actif) |
| `RESEND_USE_TEMPLATES` | `true` après sync | `true` |
| `AUTH_EMAIL_FROM` | `McBuleli <noreply@mcbuleli.org>` | idem |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://mcbuleli.org` |

---

## Commandes

```bash
# Publier / mettre à jour les 10 templates sur Resend (ne consomme pas le quota transactionnel)
npm run resend:sync-templates

# Tester un flux sans consommer le quota (local)
# → pas de RESEND_ALLOW_SEND dans .env, lancer l’app et déclencher le flux (log console)
```

---

## Bonnes pratiques quota

1. **Ne pas utiliser « Send test »** dans Resend pour chaque modification — utiliser l’aperçu intégré, puis un seul test réel avant prod.
2. En local : **ne pas** mettre `RESEND_ALLOW_SEND=true` sauf pour un test volontaire.
3. En prod : chaque inscription / reset / changement email = **1 email** (parfois 2 pour changement d’email : alerte + confirmation).
4. Surveiller **Settings → Usage** sur [resend.com](https://resend.com).
