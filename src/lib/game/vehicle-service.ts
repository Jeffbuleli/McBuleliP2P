import { and, eq } from "drizzle-orm";
import { gameVehicles, getDb } from "@/db";
import { VEHICLES } from "@/lib/game/constants";
import { vehicleUnlocked } from "@/lib/game/progression";
import { debitMcb } from "@/lib/game/player-state";

export type FleetVehicleView = {
  vehicleKey: string;
  label: string;
  labelFr: string;
  conditionPct: number;
  fuelPct: number;
  repairCostMcb: number;
  canRepair: boolean;
  broken: boolean;
};

function repairCost(conditionPct: number): number {
  if (conditionPct >= 95) return 0;
  return Math.round((100 - conditionPct) * 0.2 * 100) / 100;
}

export async function syncPlayerFleet(playerId: string, xp: number): Promise<void> {
  const db = getDb();
  for (const key of Object.keys(VEHICLES)) {
    if (key === "foot") continue;
    if (!vehicleUnlocked(key, xp)) continue;

    const [existing] = await db
      .select({ id: gameVehicles.id })
      .from(gameVehicles)
      .where(
        and(eq(gameVehicles.playerId, playerId), eq(gameVehicles.vehicleKey, key)),
      )
      .limit(1);

    if (!existing) {
      await db.insert(gameVehicles).values({
        playerId,
        vehicleKey: key,
        conditionPct: 100,
        fuelPct: 100,
      });
    }
  }
}

export async function getFleetView(
  playerId: string,
  xp: number,
): Promise<FleetVehicleView[]> {
  await syncPlayerFleet(playerId, xp);
  const db = getDb();
  const rows = await db
    .select()
    .from(gameVehicles)
    .where(eq(gameVehicles.playerId, playerId));

  const out: FleetVehicleView[] = [];
  for (const r of rows) {
    const meta = VEHICLES[r.vehicleKey as keyof typeof VEHICLES];
    if (!meta) continue;
    const cost = repairCost(r.conditionPct);
    out.push({
      vehicleKey: r.vehicleKey,
      label: meta.label,
      labelFr: meta.labelFr,
      conditionPct: r.conditionPct,
      fuelPct: r.fuelPct,
      repairCostMcb: cost,
      canRepair: cost > 0,
      broken: r.conditionPct < 15,
    });
  }
  return out;
}

export async function getVehicleCondition(
  playerId: string,
  vehicleKey: string,
): Promise<{ conditionPct: number; fuelPct: number }> {
  if (vehicleKey === "foot") return { conditionPct: 100, fuelPct: 100 };

  const db = getDb();
  const [row] = await db
    .select()
    .from(gameVehicles)
    .where(
      and(
        eq(gameVehicles.playerId, playerId),
        eq(gameVehicles.vehicleKey, vehicleKey),
      ),
    )
    .limit(1);

  return {
    conditionPct: row?.conditionPct ?? 100,
    fuelPct: row?.fuelPct ?? 100,
  };
}

export async function applyVehicleWear(args: {
  playerId: string;
  vehicleKey: string;
  distanceKm: number;
}): Promise<void> {
  if (args.vehicleKey === "foot") return;

  const vehicle = VEHICLES[args.vehicleKey as keyof typeof VEHICLES];
  if (!vehicle) return;

  const db = getDb();
  const [row] = await db
    .select()
    .from(gameVehicles)
    .where(
      and(
        eq(gameVehicles.playerId, args.playerId),
        eq(gameVehicles.vehicleKey, args.vehicleKey),
      ),
    )
    .limit(1);

  if (!row) return;

  const wear = vehicle.durabilityWear + Math.floor(args.distanceKm / 25);
  const fuelUse = Math.min(40, Math.round(args.distanceKm * vehicle.fuelPerKm * 8));

  await db
    .update(gameVehicles)
    .set({
      conditionPct: Math.max(0, row.conditionPct - wear),
      fuelPct: Math.max(0, row.fuelPct - fuelUse),
    })
    .where(eq(gameVehicles.id, row.id));
}

export async function repairVehicle(args: {
  playerId: string;
  vehicleKey: string;
}): Promise<
  | { ok: true; costMcb: number; conditionPct: number }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(gameVehicles)
    .where(
      and(
        eq(gameVehicles.playerId, args.playerId),
        eq(gameVehicles.vehicleKey, args.vehicleKey),
      ),
    )
    .limit(1);

  if (!row) return { ok: false, error: "vehicle_not_found" };

  const cost = repairCost(row.conditionPct);
  if (cost <= 0) return { ok: false, error: "vehicle_fine" };

  const debit = await debitMcb({
    playerId: args.playerId,
    amount: cost,
    category: "vehicle_repair",
    meta: { vehicleKey: args.vehicleKey },
  });
  if (!debit.ok) return debit;

  const nextCondition = 100;
  const nextFuel = Math.min(100, row.fuelPct + 25);

  await db
    .update(gameVehicles)
    .set({ conditionPct: nextCondition, fuelPct: nextFuel })
    .where(eq(gameVehicles.id, row.id));

  return { ok: true, costMcb: cost, conditionPct: nextCondition };
}
