# Formation en ligne Nov 2026 (`/nov26`)

## URLs

- **Canonique (affiche, SEO)** : `https://mcbuleli.com/nov26` et `/nov26/espace`
- **Alias hackathon** : `/hackathon/nov26` et `/hackathon/nov26/espace` (même contenu, même seed slug `nov26`)

Inscription + Mobile Money : même tunnel que le hackathon (`hackathon_editions` slug `nov26`, 50 USD).

## Activation prod

1. Déployer le code (`main` → VPS prod **153.75.235.176**, voir [docs/vps-production-host.md](../vps-production-host.md)).
2. Sur le VPS (ou avec `DATABASE_URL` prod en local) :
   ```bash
   npx tsx scripts/seed-nov26-formation.ts
   ```
3. Ajouter dans `ops/vps/.env` :
   ```bash
   NOV26_GOOGLE_MEET_URL=https://meet.google.com/…
   ```
4. Seed édition :
   ```bash
   bash ops/vps/seed-nov26-formation.sh
   ```
5. Redémarrer l’app Docker si besoin (deploy le fait).

## Emails

Pour l’édition `nov26`, les e-mails réservation / rappel / confirmation utilisent le copy **formation** (Google Meet, `/nov26/espace`) — pas Silikin Village.

## Parcours participant

1. `/nov26#register` → **Pré-inscrire (gratuit)** → redirection `/nov26/espace` + rappels e-mail 24 h, **ou** **S'inscrire et payer** → MoMo → `/hackathon/payment/[ref]` → espace.
2. Compte existant : **Se connecter** (`/login?next=/nov26/espace`) puis espace si déjà inscrit.
3. Espace **réservé** : programme visible + bouton payer ; Meet après paiement.

## Ops

- Admin inscriptions hackathon : `/admin/hackathon` (filtrer édition `nov26` si UI le permet ; sinon SQL sur `edition_id`).
- Affiche source : `public/events/nov26/affiche.png` (copie de `599561.png`).
