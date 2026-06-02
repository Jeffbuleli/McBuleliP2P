# Campagne lancement McBuleli — Formation en ligne

## Dates

| Événement | Date |
|-----------|------|
| **Soirée de lancement** | 8 juin 2026 · **19h GMT+1** |
| **Formation gratuite** | 15–30 juin · chaque **samedi 18h30–20h00** (GMT+1) |

## URLs

- Inscription : **https://mcbuleli.org/formation**
- Admin inscriptions (super-admin) : **/admin/training-registrations**

## Homepage

Bannière pleine largeur (`LandingLaunchHero`) remplace la grille promos pendant la campagne.

Désactiver : `NEXT_PUBLIC_LAUNCH_CAMPAIGN=false`

## Broadcast Resend

```bash
npm run resend:export-broadcasts
```

Fichiers : `content/email-broadcasts/mcbuleli-launch_academy-fr.html` (et `.txt`, EN).

CTA pointe vers `/formation?utm_source=email&utm_medium=broadcast&utm_campaign=launch_academy`

## Réseaux sociaux

Assets SVG (à exporter en PNG depuis Figma/browser si besoin) :

- `public/launch/social-square.svg` — Instagram / Facebook carré
- `public/launch/social-landscape.svg` — X / Facebook lien
- `public/launch/social-story.svg` — WhatsApp / Stories
- Portrait : `public/launch/jeff-portrait.png`

## Migration prod

```bash
npm run db:migrate:render
# ou localement avec DATABASE_URL
```

Table : `training_registrations`

## Suggestion

Après le 8 juin, envoyer un rappel WhatsApp aux inscrits avec `whatsapp_opt_in = true` (export CSV admin).
