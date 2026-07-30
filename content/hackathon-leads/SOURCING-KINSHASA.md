# Sourcing prospects Kinshasa - HACKATHON AI

Objectif : trouver des **profils réels** (LinkedIn, X, Facebook, communautés), les exporter en CSV, les importer dans Admin → Leads, puis générer les emails (pack 31 juil. 09h).

## Règles

- Ne jamais inventer un email ou une compétence.
- Privilégier le consentement / contacts publics professionnels.
- Localisation : Kinshasa (ou RDC claire).
- Cibles utiles : développeurs, IA/data, design/product, founders/CTO.

## Communautés à prospecter (publiques)

- GDG Kinshasa - https://gdg.community.dev/gdg-kinshasa/
- Congo Tech Pamoja (IA) - LinkedIn company
- Congo Developers Club - https://congodevelopers.com/
- The Developers Congo - LinkedIn
- Silikin Village / écosystème innovation Kinshasa
- Groupes Facebook tech / startups Kinshasa (recherche locale)
- X : hashtags `#KinshasaTech` `#BuildInPublic` `#GDGKinshasa`

## Requêtes LinkedIn (exemples)

```
"Software Engineer" OR Developer OR "Full Stack" Kinshasa
"Data Scientist" OR "Machine Learning" OR GenAI Kinshasa
"Product Designer" OR "UI/UX" Kinshasa
Founder OR CTO OR "Startup" Kinshasa
```

Filtres : Localisation Kinshasa · Ouvert aux opportunités si dispo.

## Colonnes CSV (import admin)

Voir `prospects-template.csv` :

`firstName,lastName,email,phone,company,jobTitle,location,skills,experience,source,notes,linkedin`

- `location` : idéalement `Kinshasa`
- `source` : `linkedin` | `community` | `facebook` | `x` | `university` | `ambassador`
- `notes` : faits vérifiés seulement (ex. "membre GDG", "poste public")

## Workflow

1. Remplir le CSV (emails vérifiés uniquement).
2. Admin → Hackathon → **Leads** → Aperçu → Confirmer.
3. Scores + segments (auto à l'import).
4. Admin → **Campagnes** → **Préparer pack 31 juil. 09h (dry-run)**.
5. Demain 31 juil. après reset quota Resend : Approuver + lancer (Phase 7–8).

## Important Resend

Quota journalier atteint aujourd'hui → **aucun envoi masse**.  
Planification : **31 juillet 2026 · 09h00 Africa/Kinshasa** · `dryRun=true` jusqu'à validation.
