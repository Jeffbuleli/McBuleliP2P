# McBuleli Hackathon - fiche partenariat (1 page)

Texte prêt à coller dans Word / Google Docs → exporter PDF.

Fichier généré aussi par :

```bash
npx tsx scripts/send-equity-hackathon-email.ts --preview
# → content/email-partnership/mcbuleli-hackathon-fiche-partenariat.txt
```

## E-mail EquityBCDC (HTML Resend)

```bash
# 1. Prévisualiser HTML
npx tsx scripts/send-equity-hackathon-email.ts --preview

# 2. Test interne
npx tsx scripts/send-equity-hackathon-email.ts --to hi@mcbuleli.org --send

# 3. Envoi Equity (après validation du test)
npx tsx scripts/send-equity-hackathon-email.ts --to marketing@equitybcdc.cd --send
```

Prérequis `.env` : `RESEND_API_KEY` + `RESEND_ALLOW_SEND=true`.  
Expéditeur par défaut : `McBuleli Team <hi@mcbuleli.org>` (surcharge possible via `PARTNERSHIP_EMAIL_FROM`).
