# ILOKWE GROUP × McBuleli Hackathon

- **Facebook** : https://www.facebook.com/profile.php?id=100065743382631
- **Contact** : ilokwegroup@gmail.com
- **Référent** : Mr Christian Ikwele · +243 990 044 150
- **Localisation** : Mont Ngafula, Kinshasa
- **Slogan** : *La valeur ajoutée du terroir*
- **Profil** : Production agricole · accompagnement d'investissements agricoles · solutions durables et rentables
- **Site web** : aucun (présence Facebook ~10K abonnés)
- **Logo** : `/partners/ilokwe-group-logo.png`
- **Sponsor** : **Gold (Or)**
- **Promo** : `ILOKWE` → lien via `partnerShareUrl("ILOKWE")`

## Rôle confirmé

**Partenaire Agriculture & AgriBusiness · Sponsor Or · Jury**

## Option retenue

Atelier court sur **rentabilité agricole**, exécution terrain et chaîne de valeur.

## Contributions confirmées

1. Atelier : rentabilité agricole, exécution terrain & chaîne de valeur
2. Mentorat des équipes sur le défi **AgroTech**
3. Référence terrain AgroTech : moderniser la chaîne de production (modèle ILOKWE)
4. **Siège Jury** sur les prototypes AgriTech
5. Naming du premier prix : **Prix ILOKWE**
6. Sponsor Or + visibilité (landing, badges, tickets)
7. Code promo **ILOKWE** (−10%, cashback 10 USD) · **2 places** partenaires (seuils 3 / 10)

## Défi AgroTech

Les équipes doivent proposer une solution capable de **moderniser la chaîne de production agricole** en RDC, en s'inspirant du modèle ILOKWE.

## Jury

- **Mr Christian Ikwele** · ILOKWE GROUP
- Titre : Jury · Agriculture & AgriBusiness
- Photo : à recevoir (placeholder initial en attendant)
- Config : `hackathonFeaturedJury()` dans `src/lib/hackathon/event-content.ts`

## Emails / scripts

- Proposition initiale : `content/email-partnership/vision-partners/ilokwe-group.{html,txt}`
- Fiche confirmation : `content/email-partnership/ilokwe-group-fiche-partenariat.{html,txt}`
- Script fiche (+ seed promo) : `npm run email:ilokwe-group-fiche`
- Test : `npm run email:ilokwe-group-fiche -- --to hi@mcbuleli.org --send`
- Prod : `npm run email:ilokwe-group-fiche -- --to ilokwegroup@gmail.com --send`

## Surfaces auto (logos partenaires)

Ajouter un partenaire dans `hackathonFeaturedPartners()` (`src/lib/hackathon/event-content.ts`) met à jour :
- landing `/hackathon`
- badges / tickets (`hackathon-pass-badge`)
