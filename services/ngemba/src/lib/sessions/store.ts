import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { TriageResult, RoutingQueue } from "@/lib/ai/triage-schema";
import type { MediaAttachment } from "@/lib/media/types";
import type { ChatMessage } from "@/lib/sessions/chat";
import type { SchoolContext } from "@/lib/school/types";
import type { SessionRoutingMeta } from "@/lib/partners/types";
import type { SessionEscalation } from "@/lib/ops/sla";
import type { TrustedContact } from "@/lib/trusted-contacts/types";

export type { ChatMessage };

export type StatusHistoryEntry = {
  at: string;
  status: AlertSessionRecord["status"];
  actor: string | null;
  note?: string;
};

export type AlertSessionRecord = {
  id: string;
  status: "opened" | "active" | "oriented" | "closed" | "cancelled";
  source: "sos_button" | "witness" | "chat" | "shake" | "school";
  locale: string;
  message: string;
  urgency: TriageResult["urgency"];
  category: TriageResult["category"];
  immediateDanger: boolean;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  commune: string | null;
  locationSource: string | null;
  locationConsentAt: string | null;
  aiSummary: string;
  aiConfidence: number;
  aiPayload: TriageResult;
  routingQueue: RoutingQueue;
  autoRoute: boolean;
  provider: "openai" | "local";
  aiMode: string;
  operatorNotes: string | null;
  assignedTo: string | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  orientedAt: string | null;
  closedAt: string | null;
  citizenToken: string | null;
  discreteMode: boolean;
  trustedContacts: TrustedContact[];
  schoolContext: SchoolContext | null;
  routingMeta: SessionRoutingMeta | null;
  slaDueAt: string | null;
  escalation: SessionEscalation | null;
  media: MediaAttachment[];
  chatMessages: ChatMessage[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "sessions.json");

const g = globalThis as unknown as {
  __ngembaSessions?: Map<string, AlertSessionRecord>;
  __ngembaSessionsLoaded?: boolean;
};

function normalizeRecord(row: AlertSessionRecord): AlertSessionRecord {
  const base = {
    ...row,
    citizenToken: row.citizenToken ?? null,
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
    | "discreteMode"
    | "trustedContacts"
    | "schoolContext"
    | "routingMeta"
    | "slaDueAt"
    | "escalation"
  > & {
    status?: AlertSessionRecord["status"];
    citizenToken?: string | null;
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
  return record;
}

export function getSession(id: string): AlertSessionRecord | null {
  const row = ensureLoaded().get(id);
  return row ? normalizeRecord(row) : null;
}

export function listSessions(limit = 50): AlertSessionRecord[] {
  return [...ensureLoaded().values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(normalizeRecord);
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

export function addSessionMedia(
  id: string,
  attachment: MediaAttachment,
): AlertSessionRecord | null {
  const current = getSession(id);
  if (!current) return null;
  const media = [...current.media, attachment];
  return updateSessionRaw(id, { media });
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
  return updateSessionRaw(id, { chatMessages });
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

  if (patch.status && patch.status !== current.status) {
    history.unshift({
      at: new Date().toISOString(),
      status: patch.status,
      actor: meta?.actor ?? null,
      note: meta?.note,
    });
    next.statusHistory = history;
  }

  if (patch.status === "oriented" && !next.orientedAt) {
    next.orientedAt = new Date().toISOString();
  }
  if (patch.status === "closed" && !next.closedAt) {
    next.closedAt = new Date().toISOString();
  }

  map.set(id, next);
  persist();
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

  if (patch.historyNote) {
    next.statusHistory = [
      {
        at: new Date().toISOString(),
        status: next.status,
        actor: "systeme",
        note: patch.historyNote,
      },
      ...next.statusHistory,
    ];
  }

  map.set(id, next);
  persist();
  return next;
}
