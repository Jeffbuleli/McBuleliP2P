import type { OpsPermission, OpsRole } from "@/lib/ops/roles";
import type { PartnerOrg } from "@/lib/partners/types";

/** Separation des acces - un role superieur n'implique pas tout. */
export type AccessScope =
  | "operational"
  | "administrative"
  | "analytics"
  | "pii"
  | "evidence";

export type AccreditationStatus =
  | "active"
  | "suspended"
  | "expired"
  | "revoked"
  | "pending";

export type Accreditation = {
  id: string;
  organizationId: string;
  memberId: string;
  role: OpsRole;
  /** 1 = base ops · 5 = national sensitive (pas auto PII). */
  level: number;
  scopes: AccessScope[];
  territoryProvinceIds: string[];
  territoryCommunes: string[];
  /** Vide = mandat role par defaut. */
  categories: string[];
  status: AccreditationStatus;
  expiresAt: string | null;
  verifiedAt: string | null;
};

export type OpsActor = {
  id: string;
  displayName: string;
  role: OpsRole;
  organizationId: string | null;
  organizationName: string | null;
  partner: PartnerOrg | null;
  accreditation: Accreditation;
  source: "legacy_token" | "db_member";
};

export type AccessDecision = {
  allowed: boolean;
  reason: string;
  missingScopes?: AccessScope[];
};

export type AuditAccessEntry = {
  id: string;
  at: string;
  actorId: string;
  actorLabel: string | null;
  organizationId: string | null;
  role: string | null;
  resourceType: string;
  resourceId: string;
  action: string;
  scope: AccessScope | string | null;
  allowed: boolean;
  reason: string | null;
  ipHash: string | null;
  meta?: unknown;
};

export type PermissionCheck = OpsPermission;
