import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { TriageResult, RoutingQueue } from "@/lib/ai/triage-schema";

export type StatusHistoryEntry = {
  at: string;
  status: AlertSessionRecord["status"];
  actor: string | null;
  note?: string;
};

export type AlertSessionRecord = {
  id: string;
  status: "opened" | "active" | "oriented" | "closed" | "cancelled";
  source: "sos_button" | "witness" | "chat";
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
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "sessions.json");

const g = globalThis as unknown as {
  __ngembaSessions?: Map<string, AlertSessionRecord>;
  __ngembaSessionsLoaded?: boolean;
};

function normalizeRecord(row: AlertSessionRecord): AlertSessionRecord {
  if (row.statusHistory?.length) return row;
  return {
    ...row,
    statusHistory: [
      {
        at: row.createdAt,
        status: row.status,
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
  > & {
    status?: AlertSessionRecord["status"];
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
