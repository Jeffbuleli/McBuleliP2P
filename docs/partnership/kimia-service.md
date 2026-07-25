# KIMIA Service × McBuleli Hackathon

- **Contact** : kimiaservice896@gmail.com
- **Facebook** : https://www.facebook.com/profile.php?id=61560600003901
- **Rôle** : Partenaire Services & Talents
- **Statut** : **Intérêt confirmé** - en attente logo + coordonnées du représentant avant suite

## Historique

1. Proposition initiale (lot ecosystem-batch) :
   `content/email-partnership/ecosystem-batch/kimia-service.{html,txt}`
2. Réponse KIMIA : demande dossier, partenaires confirmés, engagements, avantages
3. Réponse McBuleli :
   `content/email-partnership/kimia-service-reply.{html,txt}`
4. **Confirmation KIMIA** (reçue) :
   `content/email-partnership/kimia-service-confirmation.txt`

## Confirmation KIMIA (extrait)

Intérêt confirmé en tant que partenaire (sous réserve de finalisation de l'organisation). Contributions proposées :

- Mentorat : professionnalisation, employabilité, développement des services
- Mise en relation talents ↔ opportunités / entreprises partenaires
- Diffusion auprès de leur réseau professionnel

**À recevoir avant suite McBuleli :**

- [ ] Coordonnées du représentant
- [ ] Logo officiel (format demandé)
- [ ] Échange modalités pratiques (optionnel - Meet déjà proposé)

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
