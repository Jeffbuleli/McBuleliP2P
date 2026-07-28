# Kilelo × McBuleli Hackathon

- **Site** : https://kileloapp.com
- **Contact** : support@kileloapp.com
- **Référent** : Jeancy Kabangu - Founder & CEO
- **Produit** : marketplace qui connecte clients et travailleurs locaux à Kinshasa
- **Logo** : `/partners/kilelo-logo.png` (horizontal wordmark - principal) · mark `/partners/kilelo-logo-mark.png`
- **Blurb (site)** : « Kilelo connecte les clients avec des travailleurs locaux qualifiés à Kinshasa… »

## Statut

**Accepté** - partenaire confirmé (talk + mentorat) - logo sur landing Hackathon.

## Rôle

Partenaire Marketplace Services Locaux (matching / confiance / avis).

## RDV McBuleli Meet

- Landing : https://mcbuleli.org/meet/kilelo-partenariat
- Hôte : ceo@mcbuleli.org
- Seed : `npx tsx scripts/seed-kilelo-partner-meet.ts`
- Doc flux : [partner-meet.md](./partner-meet.md)

**Ne jamais envoyer** `live.mcbuleli.org/…` nu - uniquement `/meet/kilelo-partenariat`.

## Dates hackathon (lieu en attente Silikin)

- 12 août 2026 - Jour 1 Bootcamp (08h00-13h30)
- 13 août 2026 - Jour 2 Build Day (08h00-13h30)
- 14 août 2026 - Jour 3 Demo Day (08h00-13h30)

## Emails

Fiche partenaire : `content/email-partnership/kilelo-fiche-partenariat.html`

Réponse RDV Meet : `content/email-partnership/kilelo-meet-reply.html`

```bash
# Preview réponse (avant envoi Jeancy)
npm run email:kilelo-meet-reply -- --to hi@mcbuleli.org --send

# Prod (après validation)
npm run email:kilelo-meet-reply -- --to support@kileloapp.com --send
```
