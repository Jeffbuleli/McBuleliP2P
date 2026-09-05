# NGEMBA Phase 5 - Operational Units

> Date : **5 septembre 2026**  
> Statut : **implemente** (seed + matching + soft-assign)  
> Prealables : Phases 1-4

---

## Objectif

Entite **OperationalUnit** pour preparer le dispatch (Phase 6) :

- disponibilite
- competences
- zone / position
- ETA estimee
- soft-assign manuel

Pas de moteur de dispatch automatique.

---

## Statuts

AVAILABLE · ASSIGNED · EN_ROUTE · ON_SCENE · BUSY · OFFLINE · UNAVAILABLE

## Types

patrol · ambulance · medical_team · firefighter · rescue · security · ngo_team · community · school · other

---

## Livrables

| Element | Detail |
|---------|--------|
| Schema | `ng_operational_units` |
| Module | `src/lib/units/` |
| Persist | `data/units.json` (+ PG si uuid) |
| API | `GET/PATCH /api/ops/units` |
| Matching | `matchUnitsForIncident` (score distance/zone/competences) |
| Ops UI | compteurs file + panel unites sur dossier |
| Soft-assign | PATCH `softAssignSessionId` |
| Health | `phase: "5"` |

---

## Flux

```
Incident + required_services
  → matchUnitsForIncident (AVAILABLE only)
  → suggestion ops
  → soft-assign manuel (status ASSIGNED)
```

---

## Hors Phase 5

- Dispatch Engine auto / timeout / reassign (Phase 6)
- Heartbeat GPS live mobile agents
- Carte ops unites temps reel (Phase 7-8)

---

## Deploy

```bash
cd services/ngemba
npm run db:push
# rebuild + deploy-vps
```

---

## Prochaine etape

**Phase 6** - Dispatch Engine  
ou **commit + deploy-vps** Phases 1-5.

---

*Document v1.0*
