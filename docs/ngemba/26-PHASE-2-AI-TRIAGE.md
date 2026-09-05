# NGEMBA Phase 2 - AI Triage v2 + Response Engine

> Date : **5 septembre 2026**  
> Statut : **implemente**  
> Prealable : [25-PHASE-1-INCIDENT-CORE.md](./25-PHASE-1-INCIDENT-CORE.md)

---

## Objectif

Separer clairement :

- **Ngemba AI** - comprendre, classer, recommander
- **Response Engine** - appliquer les regles ops autorisees

L'IA ne decide plus seule la file. Le moteur decide. L'humain reste requis pour urgences / VBG / ecole.

---

## Livrables

| Element | Chemin |
|---------|--------|
| Response Engine | `src/lib/response-engine/` |
| Schema triage v2 | `src/lib/ai/triage-schema.ts` (`TRIAGE_PROMPT_VERSION=2.0.0`) |
| Pipeline | `runTriage` → `evaluateResponse` |
| Local triage | services + people_at_risk |
| Ops UI | services / personnes / raison moteur |
| Health | `phase: "2"` |

### Champs triage ajoutes (compat v1)

- `people_at_risk`
- `location_hints`
- `required_services`
- `recommended_actions`
- `schema_version`
- `prompt_version` / `engine_policy_version` / `engine_reason` / `engine_human_required`

### Politique moteur

`RESPONSE_POLICY_VERSION = 2.0.0`

Files : `operator_urgent` | `operator_standard` | `self_service` | `aggregated_report` | `school_referent`

---

## Compatibilite

- API `POST /api/alerts` inchangee pour le citoyen / mobile
- Payloads AI v1 normalises via `normalizeTriageResult`
- `RoutingQueue` vit dans `response-engine` (re-export type depuis triage-schema deprecated)

---

## Hors Phase 2

- Dispatch unites / ETA
- RBAC/ABAC users
- Changement lifecycle ACK / EN_ROUTE

---

## Deploy

Sur VPS (meme git McBuleli) apres commit :

```bash
# depuis monorepo - workflow habituel deploy-vps / script ngemba
cd services/ngemba && npm run build
```

Pas de migration DB obligatoire pour Phase 2 (champs dans `ai_payload` jsonb).

---

## Prochaine etape

**Phase 3** - RBAC/ABAC (users org + accreditation)  
ou **commit + deploy-vps** Phase 1+2.

---

*Document v1.0*
