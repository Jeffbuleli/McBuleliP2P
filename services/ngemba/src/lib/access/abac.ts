import {
  roleHasPermission,
  sessionMatchesRoleMandate,
  type OpsPermission,
} from "@/lib/ops/roles";
import { sessionInRoleCoverage } from "@/lib/partners/match";
import type { SessionRoutingMeta } from "@/lib/partners/types";
import { actorHasScope } from "@/lib/access/bridge";
import type {
  AccessDecision,
  AccessScope,
  OpsActor,
} from "@/lib/access/types";

function accreditationActive(actor: OpsActor, now = Date.now()): boolean {
  const acc = actor.accreditation;
  if (acc.status === "revoked" || acc.status === "suspended") return false;
  if (acc.status === "pending") return false;
  if (acc.expiresAt) {
    const exp = Date.parse(acc.expiresAt);
    if (Number.isFinite(exp) && exp < now) return false;
  }
  return acc.status === "active";
}

export type IncidentAccessSubject = {
  urgency: string;
  category: string;
  routingQueue: string;
  commune?: string | null;
  locationLabel?: string | null;
  routingMeta?: SessionRoutingMeta | null;
};

/** Permission RBAC + accreditation active. */
export function decidePermission(
  actor: OpsActor,
  permission: OpsPermission,
): AccessDecision {
  if (!accreditationActive(actor)) {
    return { allowed: false, reason: "accreditation_inactive" };
  }
  if (!roleHasPermission(actor.role, permission)) {
    return { allowed: false, reason: "permission_denied" };
  }
  if (
    (permission === "observatory.view" ||
      permission === "observatory.export") &&
    !actorHasScope(actor, "analytics")
  ) {
    return {
      allowed: false,
      reason: "scope_analytics_required",
      missingScopes: ["analytics"],
    };
  }
  return { allowed: true, reason: "ok" };
}

/**
 * ABAC incident : mandat + territoire + scope demande.
 * Admin national (level>=4, org mcbuleli) voit tout en operational.
 */
export function decideIncidentAccess(
  actor: OpsActor,
  session: IncidentAccessSubject,
  need: AccessScope = "operational",
): AccessDecision {
  if (!accreditationActive(actor)) {
    return { allowed: false, reason: "accreditation_inactive" };
  }

  if (!actorHasScope(actor, need)) {
    return {
      allowed: false,
      reason: `scope_${need}_required`,
      missingScopes: [need],
    };
  }

  const acc = actor.accreditation;

  // Mandat categories accreditation prioritaire, sinon role mandate
  if (actor.role !== "admin") {
    if (acc.categories.length) {
      const inMandate =
        acc.categories.includes(session.category) ||
        ["operator_urgent", "school_referent"].includes(session.routingQueue);
      if (!inMandate && !sessionMatchesRoleMandate(actor.role, session)) {
        return { allowed: false, reason: "mandate_category" };
      }
    } else if (!sessionMatchesRoleMandate(actor.role, session)) {
      return { allowed: false, reason: "mandate_role" };
    }
  }

  // Territoire accreditation : si defini, doit matcher (sauf admin)
  if (
    actor.role !== "admin" &&
    (acc.territoryProvinceIds.length > 0 || acc.territoryCommunes.length > 0)
  ) {
    const provinceId = session.routingMeta?.provinceId ?? null;
    const commune =
      session.routingMeta?.commune ?? session.commune ?? null;
    const provinceOk =
      !acc.territoryProvinceIds.length ||
      (provinceId != null && acc.territoryProvinceIds.includes(provinceId));
    const communeOk =
      !acc.territoryCommunes.length ||
      (commune != null &&
        acc.territoryCommunes.some(
          (c) => c.toLowerCase() === commune.toLowerCase(),
        ));
    // Si les deux listes non vides : OR (province OU commune)
    const geoOk =
      acc.territoryProvinceIds.length && acc.territoryCommunes.length
        ? provinceOk || communeOk
        : provinceOk && communeOk;
    if (!geoOk) {
      // Fallback couverture partenaires (legacy)
      const covered = sessionInRoleCoverage(
        actor.role,
        {
          commune: session.commune ?? null,
          locationLabel: session.locationLabel ?? null,
          category: session.category,
          routingMeta: session.routingMeta ?? null,
        },
        actor.partner?.id ?? null,
      );
      if (!covered) {
        return { allowed: false, reason: "territory" };
      }
    }
    return { allowed: true, reason: "ok_territory_acc" };
  }

  const covered = sessionInRoleCoverage(
    actor.role,
    {
      commune: session.commune ?? null,
      locationLabel: session.locationLabel ?? null,
      category: session.category,
      routingMeta: session.routingMeta ?? null,
    },
    actor.partner?.id ?? null,
  );
  if (!covered) {
    return { allowed: false, reason: "coverage" };
  }

  return { allowed: true, reason: "ok" };
}
