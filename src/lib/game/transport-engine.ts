import { eq } from "drizzle-orm";
import { gameWorldEvents, getDb } from "@/db";
import {
  MINERALS,
  TRANSPORT_ROUTES,
  VEHICLES,
  type MineralKey,
} from "@/lib/game/constants";
import { vehicleUnlocked } from "@/lib/game/progression";

function num(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

async function weatherMudMultiplier(): Promise<number> {
  const db = getDb();
  const events = await db
    .select()
    .from(gameWorldEvents)
    .where(eq(gameWorldEvents.active, true))
    .limit(5);

  let mud = 1;
  for (const e of events) {
    if (e.eventKey.includes("rain") || e.eventKey.includes("fuel")) {
      mud += 0.12;
    }
  }
  return mud;
}

export function listTransportOptions(xp: number) {
  return Object.entries(VEHICLES)
    .filter(([key]) => vehicleUnlocked(key, xp))
    .map(([key, v]) => ({
      key,
      label: v.label,
      labelFr: v.labelFr,
      capacityKg: v.capacityKg,
      fuelPerKm: v.fuelPerKm,
      maintenanceMcb: v.maintenanceMcb,
      durabilityWear: v.durabilityWear,
      speed: v.speed,
    }));
}

export async function quoteTransport(args: {
  mineralKey: MineralKey;
  quantityKg: number;
  vehicleKey: keyof typeof VEHICLES;
  routeKey: string;
  purityPct: number;
  xp: number;
  conditionPct?: number;
  fuelPct?: number;
}) {
  const vehicle = VEHICLES[args.vehicleKey];
  const route = TRANSPORT_ROUTES.find((r) => r.key === args.routeKey);
  if (!vehicle || !route) return { ok: false as const, error: "invalid_quote" };
  if (!vehicleUnlocked(args.vehicleKey, args.xp)) {
    return { ok: false as const, error: "vehicle_locked" };
  }
  if (args.quantityKg > vehicle.capacityKg) {
    return { ok: false as const, error: "over_capacity" };
  }

  const condition = args.conditionPct ?? 100;
  const fuel = args.fuelPct ?? 100;
  if (args.vehicleKey !== "foot" && condition < 15) {
    return { ok: false as const, error: "vehicle_broken" };
  }
  if (args.vehicleKey !== "foot" && fuel < 10) {
    return { ok: false as const, error: "vehicle_no_fuel" };
  }

  const mineral = MINERALS[args.mineralKey];
  const mud = await weatherMudMultiplier();
  const conditionFuelMult = condition < 50 ? 1.15 : fuel < 30 ? 1.08 : 1;
  const fuelCostMcb =
    Math.round(route.distanceKm * vehicle.fuelPerKm * mud * conditionFuelMult * 100) /
    100;
  const maintenanceMcb =
    Math.round(vehicle.maintenanceMcb * (condition < 50 ? 1.25 : 1) * 100) / 100;
  const totalCostMcb = Math.round((fuelCostMcb + maintenanceMcb) * 100) / 100;

  const conditionRisk = condition < 40 ? 12 : condition < 70 ? 5 : 0;
  const riskPct = clamp(
    (route.baseRisk + route.mudRisk * (mud - 1)) * 100 +
      mineral.transportRisk * 50 -
      (args.purityPct > 80 ? 5 : 0) +
      conditionRisk,
    5,
    65,
  );

  const durationMin = Math.max(
    3,
    Math.round((route.distanceKm / vehicle.speed) * (mud > 1 ? 1.25 : 1)),
  );

  const priceFactor = 0.72 + (args.purityPct / 100) * 0.2;
  const estimatedRewardMcb =
    Math.round(args.quantityKg * mineral.basePriceMcb * priceFactor * 100) / 100;

  return {
    ok: true as const,
    route: {
      key: route.key,
      label: route.label,
      labelFr: route.labelFr,
      distanceKm: route.distanceKm,
    },
    vehicle: {
      key: args.vehicleKey,
      label: vehicle.label,
      labelFr: vehicle.labelFr,
      capacityKg: vehicle.capacityKg,
    },
    fuelCostMcb,
    maintenanceMcb,
    totalCostMcb,
    riskPct: Math.round(riskPct),
    durationMin,
    estimatedRewardMcb,
    weatherDelay: mud > 1.1,
    purityBonus: args.purityPct >= 85,
    conditionPct: condition,
    fuelPct: fuel,
    wearEstimate: vehicle.durabilityWear + Math.floor(route.distanceKm / 25),
  };
}

export function computeTransportRiskFactor(riskPct: number): number {
  return clamp(riskPct / 100, 0.05, 0.55);
}
