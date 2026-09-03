export type SlaUrgency =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info";

export type SessionEscalation = {
  level: number;
  escalatedAt: string;
  reason: string;
  fromScope: string;
  /** Partenaires ajoutes pour la file nationale */
  addedPartnerIds: string[];
};

/** Minutes SLA par defaut (protocole ops). Override env NGEMBA_SLA_*_MIN. */
export function defaultSlaMinutes(urgency: string): number {
  const envKey: Record<string, string> = {
    critical: "NGEMBA_SLA_CRITICAL_MIN",
    high: "NGEMBA_SLA_HIGH_MIN",
    medium: "NGEMBA_SLA_MEDIUM_MIN",
    low: "NGEMBA_SLA_LOW_MIN",
    info: "NGEMBA_SLA_INFO_MIN",
  };
  const key = envKey[urgency];
  if (key) {
    const raw = Number(process.env[key] || "");
    if (Number.isFinite(raw) && raw > 0) return Math.min(7 * 24 * 60, raw);
  }
  const defaults: Record<string, number> = {
    critical: 5,
    high: 20,
    medium: 60,
    low: 240,
    info: 1440,
  };
  return defaults[urgency] ?? 60;
}

export function computeSlaDueAt(
  createdAtIso: string,
  urgency: string,
  partnerSlaCriticalMin?: number | null,
): string {
  let minutes = defaultSlaMinutes(urgency);
  if (
    urgency === "critical" &&
    partnerSlaCriticalMin != null &&
    Number.isFinite(partnerSlaCriticalMin) &&
    partnerSlaCriticalMin > 0
  ) {
    minutes = Math.min(minutes, partnerSlaCriticalMin);
  }
  const created = Date.parse(createdAtIso);
  const base = Number.isFinite(created) ? created : Date.now();
  return new Date(base + minutes * 60_000).toISOString();
}

export function slaRemainingMs(
  slaDueAt: string | null | undefined,
  now = Date.now(),
): number | null {
  if (!slaDueAt) return null;
  const due = Date.parse(slaDueAt);
  if (!Number.isFinite(due)) return null;
  return due - now;
}

export function isSlaBreached(
  session: {
    status: string;
    slaDueAt?: string | null;
    escalation?: SessionEscalation | null;
  },
  now = Date.now(),
): boolean {
  if (session.status === "oriented" || session.status === "closed" || session.status === "cancelled") {
    return false;
  }
  const remaining = slaRemainingMs(session.slaDueAt, now);
  if (remaining == null) return false;
  return remaining <= 0;
}

export type SlaUiState = {
  dueAt: string | null;
  minutesTotal: number;
  remainingMs: number | null;
  breached: boolean;
  escalated: boolean;
  label: string;
};

export function slaUiState(
  session: {
    status: string;
    urgency: string;
    createdAt: string;
    slaDueAt?: string | null;
    escalation?: SessionEscalation | null;
  },
  now = Date.now(),
): SlaUiState {
  const dueAt =
    session.slaDueAt ??
    computeSlaDueAt(session.createdAt, session.urgency);
  const minutesTotal = defaultSlaMinutes(session.urgency);
  const remainingMs = slaRemainingMs(dueAt, now);
  const done =
    session.status === "oriented" ||
    session.status === "closed" ||
    session.status === "cancelled";
  const escalated = Boolean(session.escalation);
  const breached = !done && remainingMs != null && remainingMs <= 0;

  let label = "SLA ok";
  if (done) label = "Pris en charge";
  else if (escalated) label = "Escalade nationale";
  else if (breached) label = "SLA depasse";
  else if (remainingMs != null && remainingMs < 5 * 60_000) label = "SLA serre";
  else label = `SLA ${Math.ceil((remainingMs ?? 0) / 60_000)} min`;

  return {
    dueAt,
    minutesTotal,
    remainingMs,
    breached,
    escalated,
    label,
  };
}
