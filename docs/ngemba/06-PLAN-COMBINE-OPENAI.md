# Plan combiné NGEMBA - McBuleli + OpenAI

> Date : 2 sept. 2026 · Domaine : `ngemba-rdc.org`  
> Sources : plan maître McBuleli + contribution OpenAI (gpt-4o-mini) + brief produit

---

## Vision figée

NGEMBA = solution de **sécurité et de paix** pour la RDC.  
**McBuleli IA** (OpenAI) au centre : la personne parle ou écrit dans sa langue - le système comprend et oriente.

Langues prioritaires :

- Français (`fr`)
- English (`en`)
- Lingala (`ln`)
- Swahili (`sw`)
- Tshiluba (`lua`)
- Kikongo (`kg`)

Règles UI :

- Poppins · `#06402b` · `#882364` · SOS `#c41e3a`
- **SVG uniquement** (pas d'emoji)
- **Peu de texte**
- Tirets **`-`** uniquement (pas `-` / `·`)

---

## Ce qu'on garde de notre plan

- 3 piliers : Protéger / Vigiler / Prévenir
- Session d'alerte (`opened` - `active` - `oriented` - `closed`)
- GPS jamais obligatoire
- IA = triage, jamais verdict judiciaire
- Humain dans la boucle pour urgence
- Isolation `services/ngemba/` · VPS CyberAlert · DB dédiée
- Phases 0-5 réalistes (pas 4 semaines "tout MVP" trop agressif)

---

## Ce qu'on adopte d'OpenAI

| Idée OpenAI | Décision |
|-------------|----------|
| SOS en priorité visuelle absolue | **Oui** - centre + pulse |
| Microcopy ultra-courte | **Oui** |
| Sélecteur langue rapide | **Oui** - 6 codes visibles |
| Champ vocal sur signalement | **Oui** - Phase 1 |
| Confirmation + suivi alerte | **Oui** - Phase 1 |
| NLP par langue | **Adapté** - un modèle OpenAI multilingue + détection locale, pas 6 modèles séparés |
| Filtres abus + vérif humaine critiques | **Oui** (déjà dans plan maître) |
| Alertes communautaires | **Phase 2+** (témoin) |
| Carte incidents | **Phase 5** - agrégée seulement |
| Modules éducation sécurité | **Phase 4** Jeunesse |
| Partenariats ONG locaux | **Phase 0** - bloquant |
| Auto-évaluation sécurité | **Plus tard** - hors MVP |

---

## Architecture IA (combinée)

```
Voix / texte (fr|en|ln|sw|lua|kg)
        |
   détection langue + Whisper si audio
        |
   McBuleli IA (OpenAI structured JSON)
        |
   règles métier (urgence, routing)
        |
   file humaine si critical/high
```

Garde-fous :

- Pas de certification "preuve"
- Pas de verdict de culpabilité
- Pas d'incitation à la confrontation
- Fallback hors ligne : enregistrer alerte + numéros d'urgence

---

## Roadmap réaliste (ajustée vs 4 semaines OpenAI)

| Semaine | Livrable |
|---------|----------|
| S1 (maintenant) | UI home pro · i18n 6 langues · SVG · health · docs |
| S2 | Parcours SOS (texte) · consentement GPS · session DB |
| S3 | Triage OpenAI · dashboard ONG minimal |
| S4 | Voix (Whisper / Web Speech) · confirmation + suivi |
| Ensuite | Témoin · médias · alerte discrète · carte agrégée |

OpenAI proposait recherche utilisateur + wireframes + NLP + lancement en 4 semaines.  
**Combiné :** on shippe UI + fondations tout de suite, puis SOS+IA+ONG en 3-4 semaines - pas le produit complet.

---

## Différenciateurs "sécurité et paix" (priorisés)

1. **Comprendre sans formulaire** - récit naturel multilingue
2. **Orientation humaine rapide** - ONG / acteurs locaux
3. **Témoin sans danger** - signaler, ne pas intervenir
4. **Prévention** - scénarios / ressources (plus tard)
5. **Observatoire agrégé** - où prévenir, pas où exposer les victimes

---

## Risques (fusion)

| Risque | Mitigation |
|--------|------------|
| Faible adoption | Campagnes + partenaires de confiance + UX 30s |
| Confidentialité | Minimisation · audit accès · politique claire |
| Panne IA | Queue locale + numéros d'urgence toujours visibles |
| RAM VPS 1.6 GiB | DB partagée · prune Docker · upgrade recommandé |
| Abus | Vérif progressive · jamais bloquer une urgence |

---

## Prochaine execution

1. Home + SOS + GPS + triage local/hybrid - **fait**
2. Persist sessions + `/ops` + voix + temoin - **fait**
3. **Suivant :** hybrid OpenAI en prod (optionnel) · medias · alerte discrete
4. **Live :** https://ngemba-rdc.org
