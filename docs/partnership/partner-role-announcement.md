# Annonce rôle partenaire + liens d'accès

Email personnalisé par organisation : rôle (confirmé ou en discussion) + ce qui lui revient + liens selon accréditation.

## Accès principal

Pour tous : https://mcbuleli.org/hackathon/chat  
(compte McBuleli = email principal de l'org)

## Liens secondaires selon rôle

| Accréditation | Lien |
|---------------|------|
| Jury | https://mcbuleli.org/hackathon/jury |
| Live | https://mcbuleli.org/hackathon/live |
| Page | https://mcbuleli.org/hackathon |
| Ambassadeur (hors org) | https://mcbuleli.org/hackathon/ambassadeur |

## Commandes

```bash
# Preview + écrit content/email-partnership/partner-role-announcement/
npm run email:partner-role-announcement -- --preview

# TEST : toutes les variantes vers hi@
npm run email:partner-role-announcement -- --to hi@mcbuleli.org --send

# TEST une org
npm run email:partner-role-announcement -- --to hi@mcbuleli.org --partner=ilokwe --send

# PROD confirmés uniquement
npm run email:partner-role-announcement -- --confirmed --all --send
```

## Roster (`partner-role-announcement-email.ts`)

Confirmés : ILOKWE, RDPI, KIMIA, SanJa, Kilelo, IA Académie, TYTS  
En cours : Silikin, e-COM SAS, César Group
