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

export type RelatedAlertSummary = {
  id: string;
  status: AlertSessionRecord["status"];
  urgency: AlertSessionRecord["urgency"];
  createdAt: string;
  source: AlertSessionRecord["source"];
};
