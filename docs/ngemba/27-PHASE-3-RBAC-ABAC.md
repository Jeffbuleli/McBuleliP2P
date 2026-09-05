# NGEMBA Phase 3 - RBAC / ABAC + accreditation bridge

> Date : **5 septembre 2026**  
> Statut : **implemente** (bridge tokens legacy)  
> Prealables : [25-PHASE-1](./25-PHASE-1-INCIDENT-CORE.md) · [26-PHASE-2](./26-PHASE-2-AI-TRIAGE.md)

---

## Objectif

Passer des tokens plats a un modele :

`User/Member → Organization → Accreditation → Role + Scopes + Territoire`

Sans casser le login ops actuel (tokens env).

---

## Livrables

| Element | Detail |
|---------|--------|
| Schema DB | `ng_organizations`, `ng_org_members`, `ng_accreditations`, `ng_audit_access_log` |
| Bridge | `resolveOpsActor(token)` → OpsActor + accreditation synthetique |
| ABAC | `decidePermission` / `decideIncidentAccess` |
| Scopes | operational · administrative · analytics · pii · evidence |
| Audit | dual-write JSON + PG · `GET /api/ops/audit` (admin) |
| Redaction | `sanitizeOpsSessionForActor` selon scopes |
| Media | download exige scope `evidence` |

---

## Scopes par role (bridge)

| Role | Scopes |
|------|--------|
| admin | operational, administrative, analytics, pii, evidence |
| ngo | operational, pii, evidence |
| security | operational, pii |
| partner | operational, analytics |
| school | operational, pii |

Admin systeme ≠ acces automatique hors mandate sans scope (scopes explicites).

---

## Compatibilite

- Tokens `NGEMBA_OPS_TOKEN_*` inchanges
- `requireOpsAuth` retourne aussi `actor`
- Visibilite file via `sessionVisibleToActor`
- Pas de MFA encore (Phase ulterieure)

---

## Deploy

```bash
cd services/ngemba
npm run db:push   # tables Phase 3
# rebuild + deploy-vps
```

Audit fonctionne meme sans PG (fichier `data/audit-access.json`).

---

## Prochaine etape

**Phase 4** - Organizations + Services directory en DB  
ou **commit + deploy-vps** Phases 1-3.

---

*Document v1.0*
