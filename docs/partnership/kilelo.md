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

- Landing partenariat : https://mcbuleli.org/meet/kilelo-partenariat
- **Hackathon talk visio (28 août 10h00)** : https://mcbuleli.org/meet/kilelo-hackathon-live
- Hôte : ceo@mcbuleli.org
- Seed partenariat : `npx tsx scripts/seed-kilelo-partner-meet.ts`
- Seed hackathon visio : `npm run seed:kilelo-hackathon-meet`
- Doc flux : [partner-meet.md](./partner-meet.md)

**Ne jamais envoyer** `live.mcbuleli.org/…` nu - uniquement `/meet/{slug}`.

### Talk à distance · Live

- **Jeancy** rejoint : `/meet/kilelo-hackathon-live` (compte `support@kileloapp.com`)
- **Ops salle** : `/meet/kilelo-hackathon-live/host` sur laptop → enceintes (+ HDMI projecteur si besoin)
- **Public** : `/hackathon/live` reste en mode MC (carte Kilelo + voix McBuleli AI + chrono)
- Email programme : `npm run email:kilelo-hackathon-remote -- --to hi@mcbuleli.org --send`

## Dates hackathon

- **28 août 2026** - Jour unique · Silikin Village · 08h00-17h00
- Talk Kilelo : **10h00 - 10h10** (visio)

## Emails

Fiche partenaire : `content/email-partnership/kilelo-fiche-partenariat.html`

Réponse RDV Meet : `content/email-partnership/kilelo-meet-reply.html`

Programme + visio hackathon : `content/email-partnership/kilelo-hackathon-remote.html`

```bash
# Test programme visio
npm run email:kilelo-hackathon-remote -- --to hi@mcbuleli.org --send

# Prod Jeancy
npm run email:kilelo-hackathon-remote -- --to support@kileloapp.com --send
```
