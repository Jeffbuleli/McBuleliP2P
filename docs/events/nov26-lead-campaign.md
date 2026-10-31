# Campagne e-mail leads · Formation nov26

Cible : base **hackathon_leads** (édition Kinshasa / lead-gen), message **formation en ligne** `https://mcbuleli.com/nov26` — distinct du hackathon présentiel.

## Quota Resend

- Compte ~**100 e-mails / jour** → lots de **80/j** (marge tests / ops).
- Fenêtre **31 oct. → 26 nov. 2026** ≈ 26 × 80 → **~2 080** envois max si file suffisante.

## Priorité des domaines

1. **Gmail** (+ iCloud / me.com / mac.com) tant qu’il reste des PENDING `@gmail`.
2. Puis **e-mails professionnels** (domaines hors freemail).

(`--domainMode=gmail_icloud_first` dans le script batch.)

## Personnalisation

- Module : `src/lib/hackathon/leads/nov26-formation-personalize.ts`
- Signature : **Mme Patty B.** (même pied que hackathon)
- PJ : `public/events/nov26/affiche.png`
- Copy FR avec tirets **"-"** (pas de tirets cadratins)

## Commandes

Test visuel + Resend :

```bash
npx tsx scripts/send-nov26-formation-lead-test-email.ts --send
```

Préparer la file (DB locale ou prod via SSH + docker) :

```bash
npx tsx scripts/prepare-nov26-formation-lead-campaign.ts
# puis pour activer l’envoi réel :
npx tsx scripts/prepare-nov26-formation-lead-campaign.ts --approve
```

Envoi du jour (80 max) :

```bash
npx tsx scripts/send-lead-campaign-daily-batch.ts \
  --editionId=8e431de4-f539-4d77-a7d4-ee5d939889ca \
  --send --limit=80 --domainMode=gmail_icloud_first --minCategory=UNQUALIFIED
```

Variable optionnelle : `HACKATHON_LEADS_EDITION_ID` si l’UUID édition leads diffère.

## Admin

Prévisualisation destinataires : `/admin/hackathon` → onglet campagnes (édition leads).
