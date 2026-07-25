# Portail échange partenaires (`/hackathon/chat`)

Espace commun pour les organisations du McBuleli Hackathon.

## Accès (sans OTP)

1. Ouvrir https://mcbuleli.org/hackathon/chat
2. **Se connecter** avec un compte McBuleli
3. **Admin / agent** → entrée directe comme `McBuleli`
4. **Compte partenaire** → email du compte = email principal de l'org (ou email promo partenaire actif) → entrée `Prénom/Org`
5. Sinon → message « accès non autorisé »

## Onglets

- **Vue** - KPIs confirmés / en cours / indéterminés
- **Membres** - tableau roster + légende badges SVG
- **Dialogue** - salle commune (poll 4s)

## Admin

`/admin/hackathon` → onglet **Échange / Chat** - patch statut org.

## Tables

- `hackathon_partner_orgs`
- `hackathon_partner_chat_messages`

Migration : `drizzle/0116_hackathon_partner_chat.sql`
