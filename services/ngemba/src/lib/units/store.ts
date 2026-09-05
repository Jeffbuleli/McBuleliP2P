import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { ngOperationalUnits } from "@/db/schema";
import { listSeedUnits } from "@/lib/units/seed";
import type { OperationalUnit, UnitStatus } from "@/lib/units/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "units.json");

const g = globalThis as unknown as {
  __ngembaUnits?: Map<string, OperationalUnit>;
  __ngembaUnitsLoaded?: boolean;
};

function ensureLoaded(): Map<string, OperationalUnit> {
  if (!g.__ngembaUnits) g.__ngembaUnits = new Map();
  if (g.__ngembaUnitsLoaded) return g.__ngembaUnits;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as OperationalUnit[];
      for (const row of raw) g.__ngembaUnits.set(row.id, row);
    }
  } catch {
    // empty
  }

  if (g.__ngembaUnits.size === 0) {
    for (const u of listSeedUnits()) g.__ngembaUnits.set(u.id, u);
    persist();
  }

  g.__ngembaUnitsLoaded = true;
  return g.__ngembaUnits;
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const rows = [...ensureLoaded().values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    fs.writeFileSync(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch (err) {
    console.warn("[ngemba] units persist failed", err);
  }
}

async function pgUpsert(unit: OperationalUnit) {
  if (!db) return;
  try {
    // Store with uuid - use deterministic-ish: only if looks like uuid
    const id = /^[0-9a-f-]{36}$/i.test(unit.id) ? unit.id : randomUUID();
    // Prefer keeping seed string ids in JSON; PG uses uuid - skip non-uuid seeds
    if (id !== unit.id) return;

    await db
      .insert(ngOperationalUnits)
      .values({
        id: unit.id,
        partnerSeedId: unit.partnerSeedId,
        name: unit.name,
        unitType: unit.unitType,
        capabilities: unit.capabilities,
        capacity: unit.capacity,
        status: unit.status,
        lat: unit.lat != null ? String(unit.lat) : null,
        lng: unit.lng != null ? String(unit.lng) : null,
        locationLabel: unit.locationLabel,
        zoneProvinceIds: unit.zoneProvinceIds,
        zoneCommunes: unit.zoneCommunes,
        accreditationLevel: unit.accreditationLevel,
        assignedSessionId: unit.assignedSessionId,
        etaMinutes: unit.etaMinutes,
        reliabilityScore: unit.reliabilityScore,
        lastHeartbeatAt: unit.lastHeartbeatAt
          ? new Date(unit.lastHeartbeatAt)
          : null,
        active: unit.active,
        createdAt: new Date(unit.createdAt),
        updatedAt: new Date(unit.updatedAt),
      })
      .onConflictDoUpdate({
        target: ngOperationalUnits.id,
        set: {
          status: unit.status,
          lat: unit.lat != null ? String(unit.lat) : null,
          lng: unit.lng != null ? String(unit.lng) : null,
          locationLabel: unit.locationLabel,
          assignedSessionId: unit.assignedSessionId,
          etaMinutes: unit.etaMinutes,
          reliabilityScore: unit.reliabilityScore,
          lastHeartbeatAt: unit.lastHeartbeatAt
            ? new Date(unit.lastHeartbeatAt)
            : null,
          updatedAt: new Date(unit.updatedAt),
          active: unit.active,
        },
      });
  } catch (err) {
    console.warn("[ngemba] units pg upsert failed", err);
  }
}

export function listUnits(opts?: {
  status?: UnitStatus;
  partnerSeedId?: string;
  availableOnly?: boolean;
}): OperationalUnit[] {
  let rows = [...ensureLoaded().values()].filter((u) => u.active);
  if (opts?.status) rows = rows.filter((u) => u.status === opts.status);
  if (opts?.partnerSeedId) {
    rows = rows.filter((u) => u.partnerSeedId === opts.partnerSeedId);
  }
  if (opts?.availableOnly) {
    rows = rows.filter((u) => u.status === "AVAILABLE");
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export function getUnit(id: string): OperationalUnit | null {
  return ensureLoaded().get(id) ?? null;
}

export function updateUnit(
  id: string,
  patch: Partial<
    Pick<
      OperationalUnit,
      | "status"
      | "lat"
      | "lng"
      | "locationLabel"
      | "assignedSessionId"
      | "etaMinutes"
      | "reliabilityScore"
      | "active"
    >
  >,
): OperationalUnit | null {
  const map = ensureLoaded();
  const current = map.get(id);
  if (!current) return null;

  const now = new Date().toISOString();
  const next: OperationalUnit = {
    ...current,
    ...patch,
    lastHeartbeatAt: now,
    updatedAt: now,
  };

  if (patch.status === "AVAILABLE") {
    next.assignedSessionId = null;
    next.etaMinutes = null;
  }

  map.set(id, next);
  persist();
  void pgUpsert(next);
  return next;
}

export function heartbeatUnit(id: string): OperationalUnit | null {
  return updateUnit(id, {});
}

export function unitStats() {
  const rows = listUnits();
  const byStatus: Record<string, number> = {};
  for (const u of rows) {
    byStatus[u.status] = (byStatus[u.status] ?? 0) + 1;
  }
  return {
    total: rows.length,
    available: byStatus.AVAILABLE ?? 0,
    assigned: byStatus.ASSIGNED ?? 0,
    enRoute: byStatus.EN_ROUTE ?? 0,
    onScene: byStatus.ON_SCENE ?? 0,
    busy: byStatus.BUSY ?? 0,
    offline: (byStatus.OFFLINE ?? 0) + (byStatus.UNAVAILABLE ?? 0),
    byStatus,
  };
}

/** Soft assign for Phase 5 preview - not full dispatch. */
export function softAssignUnit(
  unitId: string,
  sessionId: string,
  etaMinutes?: number | null,
): OperationalUnit | null {
  const unit = getUnit(unitId);
  if (!unit || unit.status !== "AVAILABLE") return null;
  return updateUnit(unitId, {
    status: "ASSIGNED",
    assignedSessionId: sessionId,
    etaMinutes: etaMinutes ?? 15,
  });
}

export function releaseUnit(unitId: string): OperationalUnit | null {
  return updateUnit(unitId, {
    status: "AVAILABLE",
    assignedSessionId: null,
    etaMinutes: null,
  });
}
