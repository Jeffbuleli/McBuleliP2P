# NGEMBA - Phase 4 (Ecole & Jeunesse)

> **Statut :** v0.2 - role referent ecole + mobile + contenu enrichi

---

## Livre (v0.2)

| Module | Route | Detail |
|--------|-------|--------|
| **Safe School** | `/school` | Signalement eleve protege · file `school_referent` |
| **McBuleli Jeunesse** | `/jeunesse` | 10 scenarios interactifs IA |
| **Scenarios** | `/jeunesse/[id]` | Chat educatif · redirect SOS si danger |
| **Accueil** | `/` | Tuiles Ecole + Jeunesse |
| **Ops school** | `/ops` | Role `school` · token `NGEMBA_OPS_TOKEN_SCHOOL` |
| **Mobile** | Expo | Tuiles Ecole + Jeunesse + chat scenarios |
| **i18n** | 6 langues | FR EN LN SW LU KG |

---

## Safe School

- Source alerte : `school`
- Contexte : type (harcelement, violence, abus, cyber, autre) + etablissement optionnel
- Protocole mineur : badge ops **Safe School - mineur**
- File dediee : `school_referent` (separee des dossiers adultes)
- Role ops **school** : voit uniquement file ecole / child_danger

### Parcours citoyen

1. Choisir le type de situation
2. Etablissement optionnel
3. Recit + voix
4. Lieu (GPS ou province) - jamais obligatoire

---

## McBuleli Jeunesse - 10 scenarios

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

API : `POST /api/youth/chat`

---

## Contenu pedagogique

Pages `/prevent` et `/resources` enrichies (FR/EN) :
- Safe School / mineurs
- Module Jeunesse
- Prevention ecole + consentement / corruption

---

## Ops

- Email ops : ligne Safe School + etablissement si present
- Dossier ops : badge + champs referent ecole
- Role ONG : voit file `school_referent`
- Role **school** : file dediee uniquement

---

## Prochain (Phase 4.3 / Phase 5)

1. Partenariat ecole pilote Kinshasa (humain)
2. Heatmap / observatoire citoyen (Phase 5)
3. EAS Build APK mobile

---

*Document v0.2*
