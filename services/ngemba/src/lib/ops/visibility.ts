import { sessionInRoleCoverage } from "@/lib/partners/match";
import type { SessionRoutingMeta } from "@/lib/partners/types";
import {
  type OpsRole,
  sessionMatchesRoleMandate,
} from "@/lib/ops/roles";

/** Filtre file : mandat role + couverture partenaires (serveur uniquement). */
export function sessionVisibleToRole(
  role: OpsRole,
  session: {
    urgency: string;
    category: string;
    routingQueue: string;
    commune?: string | null;
    locationLabel?: string | null;
    routingMeta?: SessionRoutingMeta | null;
  },
  boundPartnerId?: string | null,
): boolean {
  if (!sessionMatchesRoleMandate(role, session)) return false;
  return sessionInRoleCoverage(
    role,
    {
      commune: session.commune ?? null,
      locationLabel: session.locationLabel ?? null,
      category: session.category,
      routingMeta: session.routingMeta ?? null,
    },
    boundPartnerId,
  );
}
