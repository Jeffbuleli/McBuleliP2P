import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { alertSessions, incidentEvents } from "@/db/schema";
import type {
  AlertSessionRecord,
  IncidentEventRecord,
  IncidentEventType,
  StatusHistoryEntry,
} from "@/lib/sessions/types";
import type { TriageResult } from "@/lib/ai/triage-schema";

function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === "string") return d;
  return d.toISOString();
}

function numStr(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  return String(n);
}

function parseNum(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function isPgSessionsEnabled(): boolean {
  return Boolean(db);
}

export function recordToRow(record: AlertSessionRecord) {
  return {
    id: record.id,
    status: record.status,
    source: record.source,
    anonymousToken: record.citizenToken,
    urgency: record.urgency,
    category: record.category,
    immediateDanger: record.immediateDanger,
    lat: numStr(record.lat),
    lng: numStr(record.lng),
    locationLabel: record.locationLabel,
    commune: record.commune,
    locationSource: record.locationSource,
    locationConsentAt: record.locationConsentAt
      ? new Date(record.locationConsentAt)
      : null,
    message: record.message,
    aiSummary: record.aiSummary,
    aiConfidence: numStr(record.aiConfidence),
    aiPayload: record.aiPayload,
    routingQueue: record.routingQueue,
    autoRoute: record.autoRoute,
    provider: record.provider,
    aiMode: record.aiMode,
    assignedTo: record.assignedTo,
    operatorNotes: record.operatorNotes,
    locale: record.locale,
    clientIp: record.clientIp,
    userAgent: record.userAgent,
    discreteMode: record.discreteMode,
    trustedContacts: record.trustedContacts,
    schoolContext: record.schoolContext,
    routingMeta: record.routingMeta,
    statusHistory: record.statusHistory,
    media: record.media,
    chatMessages: record.chatMessages,
    slaDueAt: record.slaDueAt ? new Date(record.slaDueAt) : null,
    escalation: record.escalation,
    recordJson: record,
    createdAt: new Date(record.createdAt),
    orientedAt: record.orientedAt ? new Date(record.orientedAt) : null,
    closedAt: record.closedAt ? new Date(record.closedAt) : null,
    updatedAt: new Date(),
  };
}

export function rowToRecord(
  row: typeof alertSessions.$inferSelect,
): AlertSessionRecord {
  const mirrored = row.recordJson as AlertSessionRecord | null;
  if (mirrored && mirrored.id === row.id && mirrored.statusHistory) {
    return {
      ...mirrored,
      status: row.status,
      assignedTo: row.assignedTo ?? mirrored.assignedTo,
      operatorNotes: row.operatorNotes ?? mirrored.operatorNotes,
      media: (row.media as AlertSessionRecord["media"]) ?? mirrored.media ?? [],
      chatMessages:
        (row.chatMessages as AlertSessionRecord["chatMessages"]) ??
        mirrored.chatMessages ??
        [],
      slaDueAt: iso(row.slaDueAt) ?? mirrored.slaDueAt,
      escalation:
        (row.escalation as AlertSessionRecord["escalation"]) ??
        mirrored.escalation,
      routingMeta:
        (row.routingMeta as AlertSessionRecord["routingMeta"]) ??
        mirrored.routingMeta,
      statusHistory:
        (row.statusHistory as StatusHistoryEntry[]) ?? mirrored.statusHistory,
    };
  }

    const aiPayload = (row.aiPayload ?? {
      category: (row.category as TriageResult["category"]) || "unknown",
      urgency: row.urgency,
      immediate_danger: row.immediateDanger,
      summary_fr: row.aiSummary || "",
      summary_user_locale: row.aiSummary || "",
      missing_info: [],
      routing_hint: "operator_required",
      confidence: parseNum(row.aiConfidence) ?? 0.3,
      follow_up_questions: [],
      ai_disclaimer: "",
      witness_safety_reminder: "",
      people_at_risk: [],
      location_hints: [],
      required_services: [],
      recommended_actions: [],
      schema_version: "2",
    }) as TriageResult;

  return {
    id: row.id,
    status: row.status,
    source: row.source,
    locale: row.locale,
    message: row.message || "",
    urgency: row.urgency,
    category: (row.category as AlertSessionRecord["category"]) || "unknown",
    immediateDanger: row.immediateDanger,
    lat: parseNum(row.lat),
    lng: parseNum(row.lng),
    locationLabel: row.locationLabel,
    commune: row.commune,
    locationSource: row.locationSource,
    locationConsentAt: iso(row.locationConsentAt),
    aiSummary: row.aiSummary || "",
    aiConfidence: parseNum(row.aiConfidence) ?? 0,
    aiPayload,
    routingQueue: (row.routingQueue as AlertSessionRecord["routingQueue"]) ||
      "operator_standard",
    autoRoute: row.autoRoute,
    provider: (row.provider as AlertSessionRecord["provider"]) || "local",
    aiMode: row.aiMode || "local",
    operatorNotes: row.operatorNotes,
    assignedTo: row.assignedTo,
    statusHistory: (row.statusHistory as StatusHistoryEntry[]) || [],
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    orientedAt: iso(row.orientedAt),
    closedAt: iso(row.closedAt),
    citizenToken: row.anonymousToken,
    clientIp: row.clientIp,
    userAgent: row.userAgent,
    discreteMode: row.discreteMode,
    trustedContacts:
      (row.trustedContacts as AlertSessionRecord["trustedContacts"]) || [],
    schoolContext:
      (row.schoolContext as AlertSessionRecord["schoolContext"]) || null,
    routingMeta: (row.routingMeta as AlertSessionRecord["routingMeta"]) || null,
    slaDueAt: iso(row.slaDueAt),
    escalation: (row.escalation as AlertSessionRecord["escalation"]) || null,
    media: (row.media as AlertSessionRecord["media"]) || [],
    chatMessages:
      (row.chatMessages as AlertSessionRecord["chatMessages"]) || [],
  };
}

export async function pgUpsertSession(
  record: AlertSessionRecord,
): Promise<boolean> {
  if (!db) return false;
  try {
    const row = recordToRow(record);
    const { id: _id, createdAt: _createdAt, ...updatable } = row;
    await db
      .insert(alertSessions)
      .values(row)
      .onConflictDoUpdate({
        target: alertSessions.id,
        set: {
          ...updatable,
          updatedAt: new Date(),
        },
      });
    return true;
  } catch (err) {
    console.warn("[ngemba] pg upsert session failed", err);
    return false;
  }
}

export async function pgGetSession(
  id: string,
): Promise<AlertSessionRecord | null> {
  if (!db) return null;
  try {
    const rows = await db
      .select()
      .from(alertSessions)
      .where(eq(alertSessions.id, id))
      .limit(1);
    const row = rows[0];
    return row ? rowToRecord(row) : null;
  } catch (err) {
    console.warn("[ngemba] pg get session failed", err);
    return null;
  }
}

export async function pgListSessions(
  limit = 50,
): Promise<AlertSessionRecord[]> {
  if (!db) return [];
  try {
    const rows = await db
      .select()
      .from(alertSessions)
      .orderBy(desc(alertSessions.createdAt))
      .limit(limit);
    return rows.map(rowToRecord);
  } catch (err) {
    console.warn("[ngemba] pg list sessions failed", err);
    return [];
  }
}

export async function pgListSessionsByCitizen(
  citizenToken: string,
  limit = 20,
): Promise<AlertSessionRecord[]> {
  if (!db) return [];
  try {
    const rows = await db
      .select()
      .from(alertSessions)
      .where(eq(alertSessions.anonymousToken, citizenToken))
      .orderBy(desc(alertSessions.createdAt))
      .limit(limit);
    return rows.map(rowToRecord);
  } catch (err) {
    console.warn("[ngemba] pg list by citizen failed", err);
    return [];
  }
}

export async function pgAppendIncidentEvent(input: {
  sessionId: string;
  eventType: IncidentEventType | string;
  status?: string | null;
  actor?: string | null;
  note?: string | null;
  payload?: unknown;
  at?: string;
}): Promise<IncidentEventRecord | null> {
  if (!db) return null;
  try {
    const id = randomUUID();
    const at = input.at ? new Date(input.at) : new Date();
    await db.insert(incidentEvents).values({
      id,
      sessionId: input.sessionId,
      at,
      eventType: input.eventType,
      status: input.status ?? null,
      actor: input.actor ?? null,
      note: input.note ?? null,
      payload: input.payload ?? null,
    });
    return {
      id,
      sessionId: input.sessionId,
      at: at.toISOString(),
      eventType: input.eventType,
      status: input.status ?? null,
      actor: input.actor ?? null,
      note: input.note ?? null,
      payload: input.payload ?? null,
    };
  } catch (err) {
    console.warn("[ngemba] pg append incident event failed", err);
    return null;
  }
}

export async function pgListIncidentEvents(
  sessionId: string,
  limit = 100,
): Promise<IncidentEventRecord[]> {
  if (!db) return [];
  try {
    const rows = await db
      .select()
      .from(incidentEvents)
      .where(eq(incidentEvents.sessionId, sessionId))
      .orderBy(desc(incidentEvents.at))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      at: iso(r.at) || new Date().toISOString(),
      eventType: r.eventType,
      status: r.status,
      actor: r.actor,
      note: r.note,
      payload: r.payload,
    }));
  } catch (err) {
    console.warn("[ngemba] pg list incident events failed", err);
    return [];
  }
}

/** Prefer Postgres when available and non-empty; else null (caller uses JSON). */
export async function pgCountSessions(): Promise<number | null> {
  if (!db) return null;
  try {
    const rows = await db.select({ id: alertSessions.id }).from(alertSessions).limit(1);
    // Cheap presence check - full count expensive; use list length when needed
    return rows.length;
  } catch {
    return null;
  }
}
