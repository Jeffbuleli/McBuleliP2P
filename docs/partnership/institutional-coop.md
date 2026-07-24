# Institutional coop × McBuleli Hackathon

Lot de 8 organisations (coopération / développement / tech) — emails sur mesure, esprit KIMIA (où on en est + partenaires confirmés) + focus impact IA.

## Destinataires

| ID | Org | Rôle proposé | To | CC |
|----|-----|--------------|----|-----|
| `eeas-delegation` | Délégation UE en RDC | **Sponsor & Partenaire principal** | delegation-dem-rep-of-congo@eeas.europa.eu | — |
| `enabel` | Enabel | Compétences numériques & emploi jeunes | drcongo@enabel.be | — |
| `swiss-coop` | Coopération suisse | Développement & Innovation jeunesse | kinshasa.cc@eda.admin.ch | kinshasa@eda.admin.ch |
| `odc-orange` | Orange Digital Center (ODC) RDC | Formation digitale & talents IA | marc.tshibasu@orange.com | — |
| `unicef-genu` | UNICEF · GenU | Jeunesse & compétences pour l'avenir | nssona@unicef.org | jsimon@unicef.org, cfofana@unicef.org |
| `congo-tech` | Congo Tech | Tech locale & innovation | info@congo-tech.com | — |
| `undp-com` | PNUD RDC (Communication) | Communication & Impact développement | clarisse.museme@undp.org | — |
| `giz-rdc` | GIZ RDC | Transformation digitale & compétences | giz-kongo-rdc@giz.de | — |

## Message commun

- Impact de la maîtrise de l'IA pour accélérer la croissance de la communauté
- État d'avancement (dates 28–29 août 2026, Silikin, partenaires confirmés)
- Rôle sur mesure + ce que l'événement gagne s'ils en font partie

## Envoi

```bash
# Générer les fiches HTML/TXT
npm run email:institutional-coop -- --partner all --preview

# TEST obligatoire avant prod
npm run email:institutional-coop -- --partner all --to hi@mcbuleli.org --send

# Prod (tous)
npm run email:institutional-coop -- --partner all --send

# Un seul
npm run email:institutional-coop -- --partner eeas-delegation --send
```

Fiches : `content/email-partnership/institutional-coop/`
