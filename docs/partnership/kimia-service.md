# KIMIA Service × McBuleli Hackathon

- **Contact** : kimiaservice896@gmail.com
- **Facebook** : https://www.facebook.com/profile.php?id=61560600003901
- **Rôle proposé** : Partenaire Services & Talents

## Historique

1. Proposition initiale (lot ecosystem-batch) :
   `content/email-partnership/ecosystem-batch/kimia-service.{html,txt}`
2. Réponse KIMIA : demande dossier, partenaires confirmés, engagements, avantages
3. Réponse McBuleli :
   `content/email-partnership/kimia-service-reply.{html,txt}`

## RDV

- Lien Meet : https://mcbuleli.org/meet/kimia-partenariat
- Créneau demandé : **mardi 28 juillet 2026**, entre **10h00 et 15h00** (Kinshasa)
- Seed : `npx tsx scripts/seed-kimia-partner-meet.ts`

## Envoi

```bash
# TEST
npm run email:kimia-service-reply -- --to hi@mcbuleli.org --send

# PROD
npm run email:kimia-service-reply -- --to kimiaservice896@gmail.com --send
```
