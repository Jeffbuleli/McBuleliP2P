# AvadaPay — modèles d’e-mail partenariat (Resend)

Demande d’accès **API payouts** mobile money RDC pour McBuleli, avec branding transactionnel minimaliste (vert McBuleli).

Contact AvadaPay (public) : **info@avadapay.com** · [avadapay.com](https://avadapay.com/)

## Contexte produit (à mentionner)

| Service | Description pour compliance |
|---------|----------------------------|
| **Wallet** | Portefeuille custodial USDT / Pi, KYC |
| **P2P** | Marketplace avec séquestre ; mobile money hors plateforme entre utilisateurs |
| **AVEC** | Épargne collective digitale (trésorerie groupe USDT, cycles, gouvernance) |

Positionnement RDC : **fintech + mobile money**, pas promotion crypto. Les retraits fiat nécessitent un PSP avec **payouts** (PawaPay couvre partiellement les dépôts ; AvadaPay ciblé pour compléter les sorties).

## Modèles disponibles

| ID | Usage |
|----|--------|
| `avadapay_initial_fr` | **Premier e-mail** après appel — FR (recommandé) |
| `avadapay_initial_en` | Même contenu — EN |
| `avadapay_followup_fr` | Relance courte |
| `avadapay_followup_en` | Follow-up EN |

## Avant envoi — personnaliser

Éditer les placeholders dans `src/lib/email/partnership/avadapay-templates.ts` :

- Raison sociale, RCCM, nom/signataire, téléphone
- Volume estimé retraits/mois

Ou remplacer directement dans le tableau « Société » du rendu HTML.

## Prévisualiser (sans envoyer)

```bash
cd /Users/mac/Documents/McBuleliP2P
npx tsx scripts/send-avadapay-partnership-email.ts --list
npx tsx scripts/send-avadapay-partnership-email.ts --template avadapay_initial_fr --preview
open .tmp/avadapay-avadapay_initial_fr.html
```

## Envoyer via Resend

Depuis `hi@mcbuleli.org` (reply-to) · expéditeur `McBuleli <noreply@mcbuleli.org>`.

```bash
# .env : RESEND_API_KEY=re_...  RESEND_ALLOW_SEND=true
npx tsx scripts/send-avadapay-partnership-email.ts \
  --template avadapay_initial_fr \
  --to info@avadapay.com \
  --send
```

**Recommandation :** envoyer depuis **hi@mcbuleli.org** en mettant `Reply-To` identique (déjà configuré dans l’app). Objet professionnel, pas de pièce jointe lourde en premier mail — joindre RCCM / pitch PDF seulement si AvadaPay le demande.

## Copier-coller texte brut (FR)

**Objet :** Demande d’intégration API AvadaPay — retraits mobile money (McBuleli, RDC)

**Corps (version courte si formulaire web) :**

> Bonjour,  
> Suite à notre échange, nous formalisons notre demande d’intégration API AvadaPay pour les **payouts mobile money en RDC** (Orange, Airtel, M-Pesa).  
> **McBuleli** (mcbuleli.org) est une fintech : portefeuille KYC, marketplace **P2P** sous séquestre, et épargne collective **AVEC**. Nous positionnons nos flux comme infrastructure **mobile money** pour utilisateurs vérifiés.  
> Besoins : sandbox, API payouts (+ deposits si disponible), webhooks, réconciliation USD/CDF.  
> Merci d’indiquer la procédure d’onboarding et un contact technique.  
> Cordialement,  
> [Nom] — [Société] — hi@mcbuleli.org

## Après réponse AvadaPay

1. NDA / accord marchand  
2. Sandbox API + webhooks (aligner sur `src/lib/pawapay/` comme référence d’intégration)  
3. Tests payout RDC puis production  
4. Activer retraits fiat dans l’app (`wallet/fiat/withdraw`)
