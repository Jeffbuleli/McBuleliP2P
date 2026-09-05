import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { MediaAttachment } from "@/lib/media/types";
import type { ChatMessage } from "@/lib/sessions/chat";
import type { SchoolContext } from "@/lib/school/types";
import type { SessionRoutingMeta } from "@/lib/partners/types";
import type { SessionEscalation } from "@/lib/ops/sla";
import type { TrustedContact } from "@/lib/trusted-contacts/types";
import {
  isPgSessionsEnabled,
  pgAppendIncidentEvent,
  pgGetSession,
  pgListIncidentEvents,
  pgListSessions,
  pgListSessionsByCitizen,
  pgUpsertSession,
} from "@/lib/sessions/pg-store";
import type {
  AlertSessionRecord,
  IncidentEventRecord,
  StatusHistoryEntry,
} from "@/lib/sessions/types";

export type { ChatMessage, AlertSessionRecord, StatusHistoryEntry, IncidentEventRecord };

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "sessions.json");

const g = globalThis as unknown as {
  __ngembaSessions?: Map<string, AlertSessionRecord>;
  __ngembaSessionsLoaded?: boolean;
};

/** json (default) | postgres - read primary after dual-write. */
function sessionPrimary(): "json" | "postgres" {
  const raw = (process.env.NGEMBA_SESSION_PRIMARY || "").toLowerCase();
  if (raw === "postgres" && isPgSessionsEnabled()) return "postgres";
  return "json";
}

function normalizeRecord(row: AlertSessionRecord): AlertSessionRecord {
  const base = {
    ...row,
    citizenToken: row.citizenToken ?? null,
    clientIp: row.clientIp ?? null,
    userAgent: row.userAgent ?? null,
    discreteMode: row.discreteMode ?? false,
    trustedContacts: row.trustedContacts ?? [],
    schoolContext: row.schoolContext ?? null,
    routingMeta: row.routingMeta ?? null,
    slaDueAt: row.slaDueAt ?? null,
    escalation: row.escalation ?? null,
    media: row.media ?? [],
    chatMessages: row.chatMessages ?? [],
  };
  if (base.statusHistory?.length) return base;
  return {
    ...base,
    statusHistory: [
      {
        at: base.createdAt,
        status: base.status,
        actor: null,
        note: "Alerte creee",
      },
    ],
  };
}

function ensureLoaded() {
  if (!g.__ngembaSessions) g.__ngembaSessions = new Map();
  if (g.__ngembaSessionsLoaded) return g.__ngembaSessions;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8"),
      ) as AlertSessionRecord[];
      for (const row of raw) {
        g.__ngembaSessions.set(row.id, normalizeRecord(row));
      }
    }
  } catch {
    // empty store
  }
  g.__ngembaSessionsLoaded = true;
  return g.__ngembaSessions;
}

function persist() {
  const map = ensureLoaded();
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const rows = [...map.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    fs.writeFileSync(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch (err) {
    console.warn("[ngemba] persist sessions failed", err);
  }
}

function dualWrite(record: AlertSessionRecord) {
  void pgUpsertSession(record);
}

function emitEvent(input: {
  sessionId: string;
  eventType: string;
  status?: string | null;
  actor?: string | null;
  note?: string | null;
  payload?: unknown;
  at?: string;
}) {
  void pgAppendIncidentEvent(input);
}

export function createSession(
  input: Omit<
    AlertSessionRecord,
    | "id"
    | "createdAt"
    | "status"
    | "operatorNotes"
    | "assignedTo"
    | "statusHistory"
    | "orientedAt"
    | "closedAt"
    | "media"
    | "chatMessages"
    | "citizenToken"
    | "clientIp"
    | "userAgent"
    | "discreteMode"
    | "trustedContacts"
    | "schoolContext"
    | "routingMeta"
    | "slaDueAt"
    | "escalation"
  > & {
    status?: AlertSessionRecord["status"];
    citizenToken?: string | null;
    clientIp?: string | null;
    userAgent?: string | null;
    discreteMode?: boolean;
    trustedContacts?: TrustedContact[];
    schoolContext?: SchoolContext | null;
    routingMeta?: SessionRoutingMeta | null;
    slaDueAt?: string | null;
    escalation?: SessionEscalation | null;
    media?: MediaAttachment[];
    chatMessages?: ChatMessage[];
  },
): AlertSessionRecord {
  const map = ensureLoaded();
  const createdAt = new Date().toISOString();
  const status = input.status ?? "active";
  const record: AlertSessionRecord = {
    id: randomUUID(),
    createdAt,
    status,
    operatorNotes: null,
    assignedTo: null,
    orientedAt: null,
    closedAt: null,
    statusHistory: [
      { at: createdAt, status, actor: null, note: "Alerte creee" },
    ],
    ...input,
    citizenToken: input.citizenToken ?? null,
    clientIp: input.clientIp ?? null,
    userAgent: input.userAgent ?? null,
    discreteMode: input.discreteMode ?? false,
    trustedContacts: input.trustedContacts ?? [],
    schoolContext: input.schoolContext ?? null,
    routingMeta: input.routingMeta ?? null,
    slaDueAt: input.slaDueAt ?? null,
    escalation: input.escalation ?? null,
    media: input.media ?? [],
    chatMessages: input.chatMessages ?? [],
  };
  map.set(record.id, record);
  persist();
  dualWrite(record);
  emitEvent({
    sessionId: record.id,
    eventType: "created",
    status: record.status,
    actor: null,
    note: "Alerte creee",
    at: createdAt,
    payload: {
      source: record.source,
      urgency: record.urgency,
      category: record.category,
      routingQueue: record.routingQueue,
    },
  });
  return record;
}

export function getSession(id: string): AlertSessionRecord | null {
  if (sessionPrimary() === "postgres") {
    // Sync path cannot await - warm from JSON; async helper for routes
    const local = ensureLoaded().get(id);
    if (local) return normalizeRecord(local);
  }
  const row = ensureLoaded().get(id);
  return row ? normalizeRecord(row) : null;
}

/** Async get - prefers Postgres when NGEMBA_SESSION_PRIMARY=postgres. */
export async function getSessionAsync(
  id: string,
): Promise<AlertSessionRecord | null> {
  if (sessionPrimary() === "postgres") {
    const fromPg = await pgGetSession(id);
    if (fromPg) {
      ensureLoaded().set(id, fromPg);
      return fromPg;
    }
  }
  return getSession(id);
}

export function listSessions(limit = 50): AlertSessionRecord[] {
  return [...ensureLoaded().values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(normalizeRecord);
}

export async function listSessionsAsync(
  limit = 50,
): Promise<AlertSessionRecord[]> {
  if (sessionPrimary() === "postgres") {
    const rows = await pgListSessions(limit);
    if (rows.length) {
      const map = ensureLoaded();
      for (const row of rows) map.set(row.id, row);
      return rows;
    }
  }
  return listSessions(limit);
}

export function listSessionsByCitizen(
  citizenToken: string,
  limit = 20,
): AlertSessionRecord[] {
  return [...ensureLoaded().values()]
    .filter((s) => s.citizenToken === citizenToken)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(normalizeRecord);
}

export async function listSessionsByCitizenAsync(
  citizenToken: string,
  limit = 20,
): Promise<AlertSessionRecord[]> {
  if (sessionPrimary() === "postgres") {
    const rows = await pgListSessionsByCitizen(citizenToken, limit);
    if (rows.length) return rows;
  }
  return listSessionsByCitizen(citizenToken, limit);
}

export function addSessionMedia(
  id: string,
  attachment: MediaAttachment,
): AlertSessionRecord | null {
  const current = getSession(id);
  if (!current) return null;
  const media = [...current.media, attachment];
  const next = updateSessionRaw(id, { media });
  if (next) {
    emitEvent({
      sessionId: id,
      eventType: "media",
      status: next.status,
      note: `Media ${attachment.kind}`,
      payload: { mediaId: attachment.id, kind: attachment.kind },
    });
  }
  return next;
}

export function setMediaTranscription(
  id: string,
  mediaId: string,
  transcription: string,
): AlertSessionRecord | null {
  const current = getSession(id);
  if (!current) return null;
  const media = current.media.map((m) =>
    m.id === mediaId ? { ...m, transcription } : m,
  );
  return updateSessionRaw(id, { media });
}

export function addSessionChatMessage(
  id: string,
  message: ChatMessage,
): AlertSessionRecord | null {
  const current = getSession(id);
  if (!current) return null;
  const chatMessages = [...current.chatMessages, message];
  const next = updateSessionRaw(id, { chatMessages });
  if (next) {
    emitEvent({
      sessionId: id,
      eventType: "chat",
      status: next.status,
      actor: message.actor ?? message.role,
      note: "Message chat",
      payload: { messageId: message.id, role: message.role },
    });
  }
  return next;
}

function updateSessionRaw(
  id: string,
  patch: Partial<Pick<AlertSessionRecord, "media" | "chatMessages">>,
): AlertSessionRecord | null {
  const map = ensureLoaded();
  const current = map.get(id);
  if (!current) return null;
  const next = { ...normalizeRecord(current), ...patch };
  map.set(id, next);
  persist();
  dualWrite(next);
  return next;
}

export function updateSession(
  id: string,
  patch: Partial<
    Pick<
      AlertSessionRecord,
      | "status"
      | "operatorNotes"
      | "assignedTo"
      | "orientedAt"
      | "closedAt"
      | "routingQueue"
    >
  >,
  meta?: { actor?: string | null; note?: string },
): AlertSessionRecord | null {
  const map = ensureLoaded();
  const current = map.get(id);
  if (!current) return null;

  const next: AlertSessionRecord = { ...normalizeRecord(current), ...patch };
  const history = [...next.statusHistory];
  const at = new Date().toISOString();

  if (patch.status && patch.status !== current.status) {
    history.unshift({
      at,
      status: patch.status,
      actor: meta?.actor ?? null,
      note: meta?.note,
    });
    next.statusHistory = history;
    emitEvent({
      sessionId: id,
      eventType: "status_change",
      status: patch.status,
      actor: meta?.actor ?? null,
      note: meta?.note ?? `Statut ${current.status} -> ${patch.status}`,
      at,
      payload: { from: current.status, to: patch.status },
    });
  } else if (meta?.note || patch.operatorNotes !== undefined) {
    emitEvent({
      sessionId: id,
      eventType: "note",
      status: next.status,
      actor: meta?.actor ?? null,
      note: meta?.note ?? "Mise a jour ops",
      at,
    });
  }

  if (patch.status === "oriented" && !next.orientedAt) {
    next.orientedAt = at;
  }
  if (
    (patch.status === "closed" || patch.status === "cancelled") &&
    !next.closedAt
  ) {
    next.closedAt = at;
  }
  if (patch.status === "active" && current.status !== "active") {
    next.closedAt = null;
  }

  map.set(id, next);
  persist();
  dualWrite(next);
  return next;
}

/** Patch SLA / escalade / routingMeta (systeme). */
export function patchSessionSla(
  id: string,
  patch: {
    slaDueAt?: string | null;
    escalation?: SessionEscalation | null;
    routingMeta?: SessionRoutingMeta | null;
    historyNote?: string;
  },
): AlertSessionRecord | null {
  const map = ensureLoaded();
  const current = map.get(id);
  if (!current) return null;

  const next: AlertSessionRecord = {
    ...normalizeRecord(current),
    slaDueAt:
      patch.slaDueAt !== undefined ? patch.slaDueAt : current.slaDueAt ?? null,
    escalation:
      patch.escalation !== undefined
        ? patch.escalation
        : current.escalation ?? null,
    routingMeta:
      patch.routingMeta !== undefined
        ? patch.routingMeta
        : current.routingMeta ?? null,
  };

  const at = new Date().toISOString();
  if (patch.historyNote) {
    next.statusHistory = [
      {
        at,
        status: next.status,
        actor: "systeme",
        note: patch.historyNote,
      },
      ...next.statusHistory,
    ];
  }

  map.set(id, next);
  persist();
  dualWrite(next);

  if (patch.escalation) {
    emitEvent({
      sessionId: id,
      eventType: "escalation",
      status: next.status,
      actor: "systeme",
      note: patch.historyNote ?? "Escalade SLA",
      at,
      payload: patch.escalation,
    });
  } else if (patch.slaDueAt !== undefined) {
    emitEvent({
      sessionId: id,
      eventType: "sla",
      status: next.status,
      actor: "systeme",
      note: patch.historyNote ?? "SLA mis a jour",
      at,
      payload: { slaDueAt: patch.slaDueAt },
    });
  } else if (patch.historyNote) {
    emitEvent({
      sessionId: id,
      eventType: "system",
      status: next.status,
      actor: "systeme",
      note: patch.historyNote,
      at,
    });
  }

  return next;
}

export async function listIncidentEvents(
  sessionId: string,
  limit = 100,
): Promise<IncidentEventRecord[]> {
  const fromPg = await pgListIncidentEvents(sessionId, limit);
  if (fromPg.length) return fromPg;

  const session = getSession(sessionId);
  if (!session) return [];
  return session.statusHistory.map((h, i) => ({
    id: `local-${sessionId}-${i}`,
    sessionId,
    at: h.at,
    eventType: i === session.statusHistory.length - 1 ? "created" : "status_change",
    status: h.status,
    actor: h.actor,
    note: h.note ?? null,
    payload: null,
  }));
}

/** Import / refresh one record into both stores (migration). */
export function upsertSessionRecord(record: AlertSessionRecord): AlertSessionRecord {
  const next = normalizeRecord(record);
  ensureLoaded().set(next.id, next);
  persist();
  dualWrite(next);
  return next;
}

export function sessionStoreInfo(): {
  primary: "json" | "postgres";
  pgEnabled: boolean;
  jsonCount: number;
} {
  return {
    primary: sessionPrimary(),
    pgEnabled: isPgSessionsEnabled(),
    jsonCount: ensureLoaded().size,
  };
}
