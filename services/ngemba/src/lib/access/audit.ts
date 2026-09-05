import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { ngAuditAccessLog } from "@/db/schema";
import type { AccessScope, AuditAccessEntry, OpsActor } from "@/lib/access/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "audit-access.json");

const g = globalThis as unknown as {
  __ngembaAuditAccess?: AuditAccessEntry[];
  __ngembaAuditLoaded?: boolean;
};

function ensureLoaded(): AuditAccessEntry[] {
  if (!g.__ngembaAuditAccess) g.__ngembaAuditAccess = [];
  if (g.__ngembaAuditLoaded) return g.__ngembaAuditAccess;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as AuditAccessEntry[];
      if (Array.isArray(raw)) g.__ngembaAuditAccess = raw;
    }
  } catch {
    // empty
  }
  g.__ngembaAuditLoaded = true;
  return g.__ngembaAuditAccess;
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const rows = ensureLoaded().slice(0, 5000);
    fs.writeFileSync(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch (err) {
    console.warn("[ngemba] audit access persist failed", err);
  }
}

async function pgInsert(entry: AuditAccessEntry) {
  if (!db) return;
  try {
    await db.insert(ngAuditAccessLog).values({
      id: entry.id,
      at: new Date(entry.at),
      actorId: entry.actorId,
      actorLabel: entry.actorLabel,
      organizationId: entry.organizationId,
      role: entry.role,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      action: entry.action,
      scope: entry.scope,
      allowed: entry.allowed,
      reason: entry.reason,
      ipHash: entry.ipHash,
      meta: entry.meta ?? null,
    });
  } catch (err) {
    console.warn("[ngemba] audit access pg insert failed", err);
  }
}

export function logAccess(input: {
  actor: OpsActor;
  resourceType: string;
  resourceId: string;
  action: string;
  scope?: AccessScope | string | null;
  allowed: boolean;
  reason?: string | null;
  ipHash?: string | null;
  meta?: unknown;
}): AuditAccessEntry {
  const entry: AuditAccessEntry = {
    id: randomUUID(),
    at: new Date().toISOString(),
    actorId: input.actor.id,
    actorLabel: input.actor.displayName,
    organizationId: input.actor.organizationId,
    role: input.actor.role,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    action: input.action,
    scope: input.scope ?? null,
    allowed: input.allowed,
    reason: input.reason ?? null,
    ipHash: input.ipHash ?? null,
    meta: input.meta,
  };
  const list = ensureLoaded();
  list.unshift(entry);
  if (list.length > 5000) list.length = 5000;
  persist();
  void pgInsert(entry);
  return entry;
}

export function listAuditAccess(limit = 50): AuditAccessEntry[] {
  return ensureLoaded().slice(0, limit);
}

export function listAuditForResource(
  resourceType: string,
  resourceId: string,
  limit = 30,
): AuditAccessEntry[] {
  return ensureLoaded()
    .filter(
      (e) => e.resourceType === resourceType && e.resourceId === resourceId,
    )
    .slice(0, limit);
}
