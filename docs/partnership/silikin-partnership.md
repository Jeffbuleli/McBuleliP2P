# Silikin Village — e-mail partenariat (Resend)

Contact : **M. Jessy Kanda** — j.kanda@texaf-rdc.com · +243 834 685 575  
Hub : [silikinvillage.com](https://www.silikinvillage.com/) · commercial@silikinvillage.com

Programme cible : **[Grandir & Faire Grandir](https://www.silikinvillage.com/nos-programmes-asbl/#gfg)** (fintech / edtech).

## Modèle disponible

| ID | Usage |
|----|--------|
| `silikin_initial_fr` | **Premier e-mail** — partenariat + candidature G&FG (CEO Jeff Buleli) |

## Documents légaux (RCCM, ID NAT)

Voir **`content/legal-private/README.md`** — copier les scans en local, jamais dans git.

```bash
npm run email:partnership -- --list-legal
```

## Prévisualiser (sans envoyer)

```bash
cd /Users/mac/Documents/McBuleliP2P
npm run email:partnership -- --template silikin_initial_fr --preview --attach-legal
open .tmp/partnership-silikin_initial_fr.html
```

## Envoyer via Resend (ceo@mcbuleli.org)

```bash
# .env :
# RESEND_API_KEY=re_...
# RESEND_ALLOW_SEND=true

npm run email:partnership -- \
  --template silikin_initial_fr \
  --to j.kanda@texaf-rdc.com \
  --attach-legal \
  --send
```

Optionnel — Cc canal officiel Silikin : relancer manuellement ou ajouter un second envoi vers `commercial@silikinvillage.com`.

**Vérifier** Resend → **Emails** (logs) et que `ceo@mcbuleli.org` est autorisé comme expéditeur sur le domaine `mcbuleli.org`.

## Après l’envoi

1. Candidature en ligne : [Grandir & Faire Grandir](https://www.silikinvillage.com/nos-programmes-asbl/)
2. Relance WhatsApp +243 834 685 575 (48 h après)
3. Préparer pitch deck / one-pager si demandé

## Personnaliser le texte

Éditer `src/lib/email/partnership/silikin-templates.ts` et les placeholders partagés dans `partnership-placeholders.ts` (RCCM, téléphone, etc.).
