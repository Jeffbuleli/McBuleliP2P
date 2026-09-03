import { listPartners } from "@/lib/partners/directory";
import type { SessionRoutingMeta } from "@/lib/partners/types";
import {
  computeSlaDueAt,
  isSlaBreached,
  type SessionEscalation,
} from "@/lib/ops/sla";
import { emitOpsEvent } from "@/lib/ops/events";
import { notifyEscalation } from "@/lib/ops/notify-escalation";
import {
  getSession,
  listSessions,
  patchSessionSla,
  type AlertSessionRecord,
} from "@/lib/sessions/store";

function partnerCriticalSla(session: AlertSessionRecord): number | null {
  const ids = session.routingMeta?.matchedPartnerIds ?? [];
  let best: number | null = null;
  for (const id of ids) {
    const p = listPartners().find((x) => x.id === id);
    if (p?.slaMinutesCritical != null) {
      if (best == null || p.slaMinutesCritical < best) {
        best = p.slaMinutesCritical;
      }
    }
  }
  return best;
}

export function ensureSlaDueAt(
  session: AlertSessionRecord,
): AlertSessionRecord {
  if (session.slaDueAt) return session;
  const due = computeSlaDueAt(
    session.createdAt,
    session.urgency,
    partnerCriticalSla(session),
  );
  return (
    patchSessionSla(session.id, { slaDueAt: due }) ?? {
      ...session,
      slaDueAt: due,
    }
  );
}

function nationalFallbackPartners(category: string) {
  return listPartners().filter(
    (p) =>
      p.nationalFallback &&
      (p.categories.length === 0 || p.categories.includes(category)),
  );
}

/** Si SLA depasse et pas encore oriente → escalade vers fallback national. */
export function applySlaEscalationIfNeeded(
  session: AlertSessionRecord,
  now = Date.now(),
): AlertSessionRecord {
  let current = ensureSlaDueAt(session);

  if (
    current.status === "oriented" ||
    current.status === "closed" ||
    current.status === "cancelled"
  ) {
    return current;
  }

  if (current.escalation) return current;
  if (!isSlaBreached(current, now)) return current;

  // Deja national / unassigned : escalade admin (level 1) sans changer le bassin
  const fromScope = current.routingMeta?.scope ?? "unassigned";
  const fallbacks = nationalFallbackPartners(current.category);
  const existing = new Set(current.routingMeta?.matchedPartnerIds ?? []);
  const added = fallbacks
    .map((p) => p.id)
    .filter((id) => !existing.has(id));

  const escalation: SessionEscalation = {
    level: 1,
    escalatedAt: new Date(now).toISOString(),
    reason:
      fromScope === "local"
        ? "SLA local depasse sans prise en charge - escalade nationale"
        : "SLA depasse sans prise en charge - escalade admin / nationale",
    fromScope,
    addedPartnerIds: added,
  };

  let routingMeta: SessionRoutingMeta | null = current.routingMeta
    ? { ...current.routingMeta }
    : null;

  if (routingMeta) {
    const merged = [
      ...new Set([...routingMeta.matchedPartnerIds, ...added]),
    ];
    routingMeta = {
      ...routingMeta,
      matchedPartnerIds: merged,
      scope:
        fromScope === "local" ? "national_fallback" : routingMeta.scope,
      note:
        fromScope === "local"
          ? `Escalade SLA - ${escalation.reason}`
          : routingMeta.note,
    };
  }

  const updated = patchSessionSla(current.id, {
    escalation,
    routingMeta,
    historyNote: escalation.reason,
  });

  if (updated) {
    emitOpsEvent("alert_escalated", {
      id: updated.id,
      urgency: updated.urgency,
      fromScope,
      escalatedAt: escalation.escalatedAt,
    });
    void notifyEscalation(updated);
    return updated;
  }

  return current;
}

export function runSlaTick(limit = 80): {
  checked: number;
  escalated: number;
  ids: string[];
} {
  const rows = listSessions(limit);
  const ids: string[] = [];
  for (const row of rows) {
    const before = row.escalation;
    const after = applySlaEscalationIfNeeded(row);
    if (!before && after.escalation) ids.push(after.id);
  }
  return { checked: rows.length, escalated: ids.length, ids };
}

export function sessionWithSla(id: string): AlertSessionRecord | null {
  const s = getSession(id);
  if (!s) return null;
  return applySlaEscalationIfNeeded(s);
}
