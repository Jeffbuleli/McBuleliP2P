# NGEMBA — brief ops (qui, quoi, où, quand, pourquoi)

Retour Silikin Village : le dossier ops était trop chargé, le GPS s’ouvrait sur une autre page, et l’équipe partait sans les faits de la situation.

## Ops

En haut du dossier, bloc **Avant d’intervenir** :

- cinq lignes, uniquement des faits déjà connus (triage OpenAI / NVIDIA, sinon le message et le GPS) ;
- une ligne en ambre si le fait n’est pas dit ;
- la carte GPS **dans la page** (iframe) dès que `lat` / `lng` viennent du téléphone.

La ville IP n’est pas une carte. Partenaires, IP, chronologie et détail technique sont repliés.

Fichiers : `services/ngemba/src/lib/ops/situation-brief.ts`, `services/ngemba/src/components/ops-dossier.tsx`.

## Citoyen

Ngemba pose **une** question, celle du fait le plus utile. Le chat reprend cette question comme invite. Le texte sous l’orientation rappelle les cinq faits, sans demander de récit graphique, de nom, ni de preuve.

Le modèle reçoit les cinq briefs (`brief_who` … `brief_why`) et ne doit pas inventer un lieu ni une identité. Consigne : `TRIAGE_SYSTEM_PROMPT` et le prompt d’accompagnement dans `accompaniment-chat.ts`. OpenAI et NVIDIA passent par le même `chatText`.

## Limite

Un dossier déjà créé avant ce brief n’a souvent pas les cinq phrases IA : l’ops voit alors le message brut et « Non dit » là où le fait manque. Un nouveau message citoyen relance le triage.
