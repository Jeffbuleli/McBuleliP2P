/** Revue du 6 novembre 2026. */
export { resolveOpsActor, actorHasScope, hashIp } from "@/lib/access/bridge";
export {
  decidePermission,
  decideIncidentAccess,
  type IncidentAccessSubject,
} from "@/lib/access/abac";
export { logAccess, listAuditAccess, listAuditForResource } from "@/lib/access/audit";
export type {
  AccessDecision,
  AccessScope,
  Accreditation,
  AuditAccessEntry,
  OpsActor,
} from "@/lib/access/types";
