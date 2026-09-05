# NGEMBA Phase 4 - Organizations + Services + Referral

> Date : **5 septembre 2026**  
> Statut : **implemente** (seed directory + referral engine)  
> Prealables : Phases 1-3

---

## Objectif

Annuaire intelligent des services :

competence + localisation + disponibilite (seed) + mandat

Sans dispatch auto (Phase 6). Orientation / referral seulement.

---

## Livrables

| Element | Detail |
|---------|--------|
| Schema | `ng_services`, `ng_referrals` |
| Module | `src/lib/directory/` |
| Referral Engine | `buildReferrals(required_services + lieu)` |
| Persist | `data/referrals.json` + PG optionnel |
| API | `GET /api/ops/directory` · partners enrichis |
| Ops UI | panel Referral sur dossier |
| Health | `phase: "4"` + counts directory |

---

## Flux

```
Triage IA / Response Engine
  → required_services[]
  → buildReferrals (score local > national)
  → saveReferrals(sessionId)
  → ops dossier affiche matches
```

---

## Compatibilite

- `listPartners()` / routing zone inchanges
- Services derives du seed partenaires
- Pas de dispatch unites
- Pas d'appel police auto

---

## Deploy

```bash
cd services/ngemba
npm run db:push
# rebuild + deploy-vps
```

---

## Prochaine etape

**Phase 5** - Operational Units  
ou **commit + deploy-vps** Phases 1-4.

---

*Document v1.0*
