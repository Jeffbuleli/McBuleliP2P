# Portail échange partenaires (`/hackathon/chat`)

Espace commun pour les organisations du McBuleli Hackathon.

## Accès

1. Ouvrir https://mcbuleli.org/hackathon/chat
2. Créer / connecter un compte McBuleli avec l'**email principal** du partenaire
3. Staff McBuleli (agent / super_admin) → entrée automatique en tant que McBuleli
4. Pas d'OTP

## Étapes membres affiliés (dans l'UI)

1. Vue + Membres - état des partenariats
2. Dialogue - se présenter (texte / image R2)
3. Participants - liste paginée (10 / 20 / 30)

## Onglets

- **Vue** - KPIs + barres % cohérentes (confirmés / en cours / indéterminés)
- **Membres** - tableau roster + légende badges SVG
- **Dialogue** - salle commune (poll ~5s), texte + image R2
- **Participants** - inscrits édition (style dashboard ambassadeur)

## Statuts seed (sync à chaque chargement)

Confirmés : ILOKWE, pawaPay, Binance, KIMIA, SanJa, RDPI, Kilelo, TYTS, IA Académie  
En cours : Silikin, e-COM SAS, César Group

## Admin

`/admin/hackathon` → onglet **Échange / Chat** - patch statut org.

## Tables

- `hackathon_partner_orgs`
- `hackathon_partner_chat_messages` (+ `image_url`)

Migrations : `0116_hackathon_partner_chat.sql`, `0117_hackathon_partner_chat_image.sql`
