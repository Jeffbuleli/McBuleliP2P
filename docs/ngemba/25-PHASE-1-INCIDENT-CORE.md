# NGEMBA Phase 1 - Incident Core

> Date : **5 septembre 2026**  
> Statut : **implemente** (dual-write)  
> Audit : [SYSTEM-AUDIT-INFRASTRUCTURE.md](./SYSTEM-AUDIT-INFRASTRUCTURE.md)

---

## Objectif

Stabiliser le coeur incident sans casser l'API citoyen / mobile / ops.

- Postgres comme miroir (puis source de verite)
- Timeline `incident_events`
- Dual-write JSON + PG
- Flip lecture via `NGEMBA_SESSION_PRIMARY`

---

## Livrables

| Element | Detail |
|---------|--------|
| Schema | `alert_sessions` enrichi + `incident_events` |
| Store | `src/lib/sessions/store.ts` dual-write |
| PG layer | `src/lib/sessions/pg-store.ts` |
| API | `GET /api/alerts/:id/events` · events dans dossier ops |
| Health | `phase: "1"` + etat store |
| Migration | `npm run db:migrate-sessions` |

---

## Commandes

```bash
cd services/ngemba
npm run db:push
npm run db:migrate-sessions
```

Flip lecture Postgres (apres verification) :

```bash
# .env
NGEMBA_SESSION_PRIMARY=postgres
```

Defaut : `json` (lecture JSON, ecriture JSON + PG si `DATABASE_URL`).

---

## Compatibilite

- Chemins API inchanges (`POST/GET/PATCH /api/alerts...`)
- Mobile Expo inchange
- Si Postgres down : JSON continue de fonctionner
- Chronologie ops : events PG si presents, sinon `statusHistory`

---

## Hors Phase 1

- OperationalUnit / Dispatch Engine
- RBAC/ABAC users org
- Lifecycle ACK / EN_ROUTE
- Retrait du fichier JSON

---

## Prochaine etape

**Phase 2** - AI Triage v2 (module AI isole + schema enrichi)  
ou flip `NGEMBA_SESSION_PRIMARY=postgres` en staging puis prod.

---

*Document v1.0*
