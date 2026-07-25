# Portail échange partenaires (`/hackathon/chat`)

Espace commun pour les organisations du McBuleli Hackathon.

## Accès

1. Ouvrir https://mcbuleli.org/hackathon/chat
2. Connexion compte McBuleli (staff agent/super_admin → McBuleli ; partenaire si email = contact org)
3. Pas d'OTP

## Onglets

- **Vue** - KPIs + barres % cohérentes (confirmés / en cours / indéterminés)
- **Membres** - tableau roster + légende badges SVG
- **Dialogue** - salle commune (poll ~5s), texte + image R2
- **Participants** - inscrits édition (style dashboard ambassadeur)

## Statuts seed (sync à chaque chargement)

Confirmés : ILOKWE, Silikin, pawaPay, Binance, KIMIA, RDPI, Kilelo, TYTS, IA Académie  
En cours : e-COM SAS, César Group

## Admin

`/admin/hackathon` → onglet **Échange / Chat** - patch statut org.

## Tables

- `hackathon_partner_orgs`
- `hackathon_partner_chat_messages` (+ `image_url`)

Migrations : `0116_hackathon_partner_chat.sql`, `0117_hackathon_partner_chat_image.sql`
