import { actorHasScope } from "@/lib/access/bridge";
import type { OpsActor } from "@/lib/access/types";
import type { AlertSessionRecord } from "@/lib/sessions/store";

/** Vue citoyenne : jamais IP / UA / token / proches / routing interne. */
export function sanitizeCitizenSession(session: AlertSessionRecord) {
  const {
    trustedContacts: _tc,
    routingMeta: _rm,
    citizenToken: _tok,
    clientIp: _ip,
    userAgent: _ua,
    ...rest
  } = session;
  return {
    ...rest,
    trustedContacts: [] as AlertSessionRecord["trustedContacts"],
    routingMeta: null,
    citizenToken: null,
    clientIp: null,
    userAgent: null,
  };
}

/** Vue OPS : IP/UA visibles pour investigation, token anonymise (pas expose). */
export function sanitizeOpsSession(session: AlertSessionRecord) {
  const { citizenToken: _tok, ...rest } = session;
  return {
    ...rest,
    citizenToken: null,
  };
}

/**
 * Phase 3 - redaction selon scopes ABAC.
 * Sans scope pii : pas IP/UA/proches.
 * Sans scope evidence : medias vides (liste).
 */
export function sanitizeOpsSessionForActor(
  session: AlertSessionRecord,
  actor: OpsActor,
) {
  const base = sanitizeOpsSession(session);
  const hasPii = actorHasScope(actor, "pii");
  const hasEvidence = actorHasScope(actor, "evidence");

  return {
    ...base,
    clientIp: hasPii ? base.clientIp : null,
    userAgent: hasPii ? base.userAgent : null,
    trustedContacts: hasPii ? base.trustedContacts : [],
    media: hasEvidence ? base.media : [],
    access: {
      scopes: actor.accreditation.scopes,
      level: actor.accreditation.level,
      organizationId: actor.organizationId,
      accreditationStatus: actor.accreditation.status,
    },
  };
}

export type RelatedAlertSummary = {
  id: string;
  status: AlertSessionRecord["status"];
  urgency: AlertSessionRecord["urgency"];
  createdAt: string;
  source: AlertSessionRecord["source"];
};
