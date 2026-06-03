# Campagne lancement McBuleli — Formation en ligne

## Dates

| Événement | Date |
|-----------|------|
| **Soirée de lancement** | 8 juin 2026 · **19h GMT+1** |
| **Formation gratuite** | 15–30 juin · chaque **samedi 18h30–20h00** (GMT+1) |

## URLs

- Inscription : **https://mcbuleli.org/formation**
- Academy (compte connecté) : **/app/academy**
- Admin inscriptions (super-admin) : **/admin/training-registrations**

## Homepage

Bannière pleine largeur (`LandingLaunchHero`) remplace la grille promos pendant la campagne.

Désactiver : `NEXT_PUBLIC_LAUNCH_CAMPAIGN=false`

## Broadcast Resend

```bash
npm run resend:export-broadcasts
```

Fichiers : `content/email-broadcasts/mcbuleli-launch_academy-fr.html` (et `.txt`, EN).

CTA : `https://mcbuleli.org/formation?utm_source=email&utm_medium=broadcast&utm_campaign=launch_academy`

### Ce que tu modifies dans Resend (broadcast)

1. [Resend](https://resend.com) → **Broadcasts** → **Create broadcast**
2. **Audience** : ta liste marketing
3. **From** : `Jeff Buleli — McBuleli <hi@mcbuleli.org>` (ou expéditeur validé)
4. **Subject** : `Lancement McBuleli — formation gratuite (Crypto, Trading, IA, P2P)`
5. **Body** : coller tout le HTML depuis `content/email-broadcasts/mcbuleli-launch_academy-fr.html`
6. **Preview** : vérifier bannière + logo + bouton inscription
7. **Send** ou planifier avant le 8 juin

Régénérer le HTML après changement de texte :

```bash
npm run resend:export-broadcasts
```

## Réseaux sociaux

**À publier : les PNG** (WhatsApp/Instagram n’affichent pas bien les SVG dans le fil).

```bash
npm run launch:generate-social
```

- **Page téléchargement** : https://mcbuleli.org/launch/assets
- `public/launch/hero-mobile.png` — bannière PWA (4:5, ne se coupe pas)
- `public/launch/social-square.png` — Instagram / Facebook
- `public/launch/social-landscape.png` — X / Facebook
- `public/launch/social-story.png` — WhatsApp / Stories
- SVG sources : `public/launch/social-*.svg` (édition Mac)

## Logo net (source 1024px)

- `public/brand/logo-1024.png` — master
- `public/brand/logo-512.png` — RS / print
- `public/brand/logo-256.png` — app & emails
- Remplacer `public/brand/logo.png` puis `npm run launch:generate-social`

## Migration prod

```bash
npm run db:migrate:render
# ou localement avec DATABASE_URL
```

Table : `training_registrations`

## Suggestion

Après le 8 juin, envoyer un rappel WhatsApp aux inscrits avec `whatsapp_opt_in = true` (export CSV admin).
