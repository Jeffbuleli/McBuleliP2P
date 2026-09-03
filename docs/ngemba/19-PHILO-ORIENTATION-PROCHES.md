# NGEMBA - Philosophie orientation & proches

> Statut : **principe produit** (avant routing multi-partenaires national)  
> Date : 2026-09-03

---

## 1. Objectif

Trouver **le plus vite possible un service competent capable d'aider**, en priorisant ce qui est **proche de la victime** (geographie + mandate), pas une diffusion nationale aveugle.

Exemple a eviter : alerte Beni → chef de police Boma.

---

## 2. Deux cercles distincts

| Cercle | Qui | Role |
|--------|-----|------|
| **A - Service competent** | Partenaire ops (ONG, referent ecole, securite locale, mairie…) | Prendre en charge / orienter l'alerte |
| **B - Proches de confiance** | Famille / amis saisis par le citoyen | Aider le dossier ou joindre la victime - **pas** le dispatch primaire |

Ne pas confondre : les proches **ne remplacent pas** le service competent.

---

## 3. Cercle A - orientation par proximite (cible)

### Principes

1. **Lieu d'abord** - province / commune / GPS (si consent) determinent le bassin de partenaires eligibles.
2. **Mandate ensuite** - VBG → partenaire VBG de la zone ; ecole → referent ecole ; etc.
3. **File locale** - l'alerte arrive d'abord aux operateurs dont `coverage_zones` couvre le lieu.
4. **Fallback** - si aucun partenaire local actif → file nationale / pilote (ex. JGL) avec mention claire « hors zone ».
5. **Pas de dispatch police auto** - NGEMBA informe et oriente ; l'appel aux forces de l'ordre reste humain / protocole partenaire (sauf accord institutionnel explicite).

### Evolution technique (par etapes)

| Etape | Contenu |
|-------|---------|
| **Fait** | File unique / roles + lieu sur dossier |
| **Fait (v2)** | Annuaire partenaires par zone + filtrage file ops |
| **Fait (v3)** | SLA local + escalation nationale si pas de prise en charge |

---

## 4. Cercle B - proches de confiance (philosophie)

### A quoi ca sert

Les coordonnees des proches aident les **services competents** a :

- joindre la victime si elle **n'est plus joignable** ;
- identifier un soutien pour **faire avancer le dossier** (abri, accompagement, info) ;
- contacter un proche **uniquement quand c'est utile et sur** (protocole ops).

### Ce que ce n'est PAS

- **Pas** un appel / WhatsApp / SMS automatique a chaque alerte (risque agresseur, stigmatisation, faux positifs).
- **Pas** un remplacement du partenaire ops.
- **Pas** obligatoire pour envoyer un SOS (l'alerte reste possible sans proches).

### Donnees a collecter (cible UX)

| Champ | Usage |
|-------|--------|
| Nom | Identification |
| Telephone | Normalise RDC → lien `https://wa.me/243XXXXXXXXX` + appel |
| Email | Contact asynchrone |
| Adresse / quartier (optionnel) | Contexte pour ops (pas affiche publiquement) |
| Lien / relation (optionnel) | Mere, ami, voisin… |

Limite actuelle : **1-3** contacts (rester leger, consentement citoyen).

### Quand contacter un proche (protocole)

L'operateur (ou le systeme sur action ops explicite) peut contacter un proche **seulement si** :

1. la victime l'a autorise (contacts enregistres = consentement de base), **et**
2. au moins une condition :
   - victime injoignable apres tentatives ;
   - danger / suivi dossier necessite un soutien ;
   - victime demande explicitement qu'on appelle X ;
3. **et** pas de risque agresseur evident (sinon mode discret : ne pas SMS/appeler sans relecture).

Par defaut produit : **pas de notify auto a l'ouverture** - contacts visibles sur le dossier ops avec boutons `Appeler` / `WhatsApp` / `Email`.

Alignement code (2026-09-03) : notify auto retire de `notifyNewAlert` ; bloc ops + `wa.me` actifs.

---

## 5. Experience citoyen (ordre)

1. SOS / message / lieu (prioritaire).
2. Option : « Personnes de confiance » (noms, tel, email, adresse).
3. Confirmation : « Ces infos aident les services si vous n'etes plus joignable. Elles ne sont pas diffusees a chaque alerte. »

---

## 6. Experience ops (dossier)

Sur `/ops/[id]` :

- Lieu + suggestion « bassin » (province / commune).
- File / partenaire cible (quand annuaire zone pret).
- Bloc **Proches** : nom, tel, `wa.me`, email, adresse - actions manuelles.
- Journal : « Contact proche X via WhatsApp a HH:MM » (audit).

---

## 7. Decision produit (validee comme direction)

1. **Priorite aide = service competent le plus proche / pertinent**, pas diffusion nationale.
2. **Proches = ressource dossier**, pas canal d'alerte primaire automatique.
3. On **evolue d'abord** sur cette philosophie (UX + protocole + modele partenaires par zone), avant d'empiler d'autres modules.

---

*Document v0.1*
