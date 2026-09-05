import { createHash, createHmac } from "crypto";
import type { OpsRole } from "@/lib/ops/roles";
import { opsTokenForRole } from "@/lib/ops/auth-tokens";
import { resolveOpsContext } from "@/lib/partners/bind";
import { listPartners } from "@/lib/partners/directory";
import type {
  AccessScope,
  Accreditation,
  OpsActor,
} from "@/lib/access/types";

const ROLE_DEFAULT_SCOPES: Record<OpsRole, AccessScope[]> = {
  admin: ["operational", "administrative", "analytics", "pii", "evidence"],
  ngo: ["operational", "pii", "evidence"],
  security: ["operational", "pii"],
  partner: ["operational", "analytics"],
  school: ["operational", "pii"],
};

const ROLE_DEFAULT_LEVEL: Record<OpsRole, number> = {
  admin: 4,
  ngo: 2,
  security: 3,
  partner: 1,
  school: 2,
};

function actorIdFromToken(token: string, role: OpsRole): string {
  const secret =
    opsTokenForRole(role) || process.env.NGEMBA_OPS_TOKEN || "ngemba";
  return `legacy:${role}:${createHmac("sha256", secret)
    .update(token)
    .digest("hex")
    .slice(0, 12)}`;
}

function accreditationForLegacy(input: {
  role: OpsRole;
  organizationId: string;
  memberId: string;
  partnerCategories?: string[];
  provinceIds?: string[];
  communes?: string[];
}): Accreditation {
  const now = new Date().toISOString();
  return {
    id: `acc-${input.memberId}`,
    organizationId: input.organizationId,
    memberId: input.memberId,
    role: input.role,
    level: ROLE_DEFAULT_LEVEL[input.role],
    scopes: ROLE_DEFAULT_SCOPES[input.role],
    territoryProvinceIds: input.provinceIds ?? [],
    territoryCommunes: input.communes ?? [],
    categories: input.partnerCategories ?? [],
    status: "active",
    expiresAt: null,
    verifiedAt: now,
  };
}

/**
 * Bridge Phase 3 : tokens env → OpsActor + accreditation synthetique.
 * Remplacable plus tard par lecture DB ng_org_members / ng_accreditations.
 */
export function resolveOpsActor(
  token: string | null | undefined,
): OpsActor | null {
  if (!token) return null;
  const ctx = resolveOpsContext(token);
  if (!ctx.role) return null;

  const role = ctx.role;
  const partner = ctx.partner;
  const id = actorIdFromToken(token, role);

  if (partner) {
    return {
      id,
      displayName: partner.name,
      role,
      organizationId: partner.id,
      organizationName: partner.name,
      partner,
      accreditation: accreditationForLegacy({
        role,
        organizationId: partner.id,
        memberId: id,
        partnerCategories: partner.categories,
        provinceIds: partner.coverageProvinceIds,
        communes: partner.coverageCommunes,
      }),
      source: "legacy_token",
    };
  }

  const orgFromRole = listPartners().find((p) => p.opsRoles.includes(role));
  const organizationId = orgFromRole?.id ?? `role-${role}`;
  const organizationName = orgFromRole?.name ?? `NGEMBA ${role}`;

  return {
    id,
    displayName: organizationName,
    role,
    organizationId,
    organizationName,
    partner: orgFromRole ?? null,
    accreditation: accreditationForLegacy({
      role,
      organizationId,
      memberId: id,
      partnerCategories: orgFromRole?.categories,
      provinceIds: orgFromRole?.coverageProvinceIds,
      communes: orgFromRole?.coverageCommunes,
    }),
    source: "legacy_token",
  };
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function actorHasScope(actor: OpsActor, scope: AccessScope): boolean {
  return actor.accreditation.scopes.includes(scope);
}
