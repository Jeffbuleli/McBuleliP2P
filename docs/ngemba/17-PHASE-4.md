# NGEMBA - Phase 4 (Ecole & Jeunesse)

> **Statut :** v0.1 MVP web

---

## Livre (v0.1)

| Module | Route | Detail |
|--------|-------|--------|
| **Safe School** | `/school` | Signalement eleve protege · file `school_referent` |
| **McBuleli Jeunesse** | `/jeunesse` | 10 scenarios interactifs IA |
| **Scenarios** | `/jeunesse/[id]` | Chat educatif · redirect SOS si danger |
| **Accueil** | `/` | Tuiles Ecole + Jeunesse |
| **i18n** | 6 langues | FR EN LN SW LU KG |

---

## Safe School

- Source alerte : `school`
- Contexte : type (harcelement, violence, abus, cyber, autre) + etablissement optionnel
- Protocole mineur : badge ops **Safe School · mineur**
- File dediee : `school_referent` (separee des dossiers adultes)
- Pas de melange automatique avec VBG adulte sans revue ops

### Parcours citoyen

1. Choisir le type de situation
2. Etablissement optionnel
3. Recit + voix
4. Lieu (GPS ou province) — jamais obligatoire

---

## McBuleli Jeunesse — 10 scenarios

| # | ID | Theme |
|---|-----|-------|
| 1 | consent | Consentement |
| 2 | cyberbullying | Cyberharcelement |
| 3 | corruption | Corruption scolaire |
| 4 | bullying | Moqueries |
| 5 | violence | Bagarre cour |
| 6 | discrimination | Exclusion |
| 7 | sextortion | Chantage photo |
| 8 | peer_pressure | Pression groupe |
| 9 | abuse | Comportement inapproprie |
| 10 | friend_sos | Ami en danger |

API : `POST /api/youth/chat` — prompt NGEMBA Jeunesse (voir `03-PROMPTS-IA-DRAFT.md`).

---

## Ops

- Email ops : ligne Safe School + etablissement si present
- Dossier ops : badge + champs referent ecole
- Role ONG : voit file `school_referent`

---

## Prochain (Phase 4.2)

1. Compte referent ecole dedie (role ops `school`)
2. Contenu prevent enrichi pages `/prevent` et `/resources`
3. Mobile Expo : tuiles Ecole + Jeunesse
4. Partenariat ecole pilote Kinshasa

---

*Document v0.1*
