import { and, desc, eq, lte, sql } from "drizzle-orm";
import {
  gameEconomyPrices,
  gameInventory,
  gameMiningSites,
  gameMineralStocks,
  gameTickMeta,
  gameTransportJobs,
  gameWorldEvents,
  getDb,
} from "@/db";
import {
  ENERGY,
  MINERALS,
  UPGRADE_CATALOG,
  VEHICLES,
  type MineralKey,
} from "@/lib/game/constants";
import {
  addXp,
  creditMcb,
  debitMcb,
  spendEnergy,
} from "@/lib/game/player-state";
import { seedGameMarketPrices } from "@/lib/game/market-seeder";
import { rollExtraction, purityPriceMultiplier } from "@/lib/game/risk-engine";
import {
  computeTransportRiskFactor,
  quoteTransport,
} from "@/lib/game/transport-engine";

function num(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export async function runEconomyTick(): Promise<{
  pricesUpdated: number;
  eventsRotated: number;
  transportsCompleted: number;
}> {
  await seedGameMarketPrices();
  const db = getDb();

  const prices = await db.select().from(gameEconomyPrices);
  let pricesUpdated = 0;

  for (const p of prices) {
    const vol = num(p.volatility);
    const demand = num(p.demandIndex);
    const supply = num(p.supplyIndex);
    const base = num(p.basePriceMcb);
    const shock = (Math.random() - 0.5) * vol * 2;
    const factor = clamp(demand / Math.max(supply, 0.1) + shock, 0.55, 1.85);
    const next = Math.round(base * factor * 100) / 100;

    await db
      .update(gameEconomyPrices)
      .set({
        currentPriceMcb: String(next),
        demandIndex: String(clamp(demand + (Math.random() - 0.5) * 0.05, 0.5, 1.8)),
        supplyIndex: String(clamp(supply + (Math.random() - 0.5) * 0.05, 0.5, 1.8)),
        updatedAt: new Date(),
      })
      .where(eq(gameEconomyPrices.mineralKey, p.mineralKey));
    pricesUpdated += 1;
  }

  await db
    .update(gameWorldEvents)
    .set({ active: false })
    .where(lte(gameWorldEvents.endsAt, new Date()));

  let eventsRotated = 0;
  if (Math.random() < 0.25) {
    const events: {
      eventKey: string;
      title: string;
      effects: Record<string, number>;
    }[] = [
      {
        eventKey: "cobalt_demand_surge",
        title: "Asian cobalt demand rises +12%",
        effects: { cobalt: 1.25 },
      },
      {
        eventKey: "fuel_shortage",
        title: "Regional fuel prices spike",
        effects: { transport_cost: 1.15 },
      },
      {
        eventKey: "heavy_rain_katanga",
        title: "Heavy rain — muddy roads in Katanga",
        effects: { transport_cost: 1.12 },
      },
      {
        eventKey: "export_slowdown",
        title: "Export market slows on global uncertainty",
        effects: { gold: 0.85, diamonds: 0.9 },
      },
      {
        eventKey: "lithium_boom",
        title: "Lithium battery demand surges",
        effects: { lithium: 1.3 },
      },
    ];
    const pick = events[Math.floor(Math.random() * events.length)]!;
    const ends = new Date(Date.now() + 6 * 3_600_000);
    await db.insert(gameWorldEvents).values({
      eventKey: pick.eventKey,
      title: pick.title,
      description: pick.title,
      effects: pick.effects,
      startsAt: new Date(),
      endsAt: ends,
      active: true,
    });
    eventsRotated = 1;
  }

  const dueJobs = await db
    .select()
    .from(gameTransportJobs)
    .where(
      and(
        eq(gameTransportJobs.status, "in_transit"),
        lte(gameTransportJobs.completesAt, new Date()),
      ),
    );

  let transportsCompleted = 0;
  for (const job of dueJobs) {
    const failRoll = Math.random();
    if (failRoll < num(job.riskFactor)) {
      await db
        .update(gameTransportJobs)
        .set({ status: "failed" })
        .where(eq(gameTransportJobs.id, job.id));
      continue;
    }

    const reward = num(job.rewardMcb);
    await creditMcb({
      playerId: job.playerId,
      amount: reward,
      category: "transport_reward",
      referenceId: job.id,
    });
    await db
      .update(gameTransportJobs)
      .set({ status: "completed" })
      .where(eq(gameTransportJobs.id, job.id));
    await addXp(job.playerId, 15);
    transportsCompleted += 1;
  }

  const [meta] = await db.select().from(gameTickMeta).limit(1);
  if (meta) {
    await db
      .update(gameTickMeta)
      .set({
        lastTickAt: new Date(),
        tickCount: (meta.tickCount ?? 0) + 1,
      })
      .where(eq(gameTickMeta.id, 1));
  } else {
    await db.insert(gameTickMeta).values({ id: 1, tickCount: 1 });
  }

  return { pricesUpdated, eventsRotated, transportsCompleted };
}

export async function mineAtSite(args: {
  playerId: string;
  siteId: string;
}): Promise<
  | {
      ok: true;
      outcome: string;
      quantityKg: number;
      purityPct: number;
      mineralKey: string;
      xp: number;
      toolWear: number;
      message: string;
      messageFr: string;
    }
  | { ok: false; error: string }
> {
  const energy = await spendEnergy(args.playerId, ENERGY.mineCost);
  if (!energy.ok) return energy;

  const db = getDb();
  const [site] = await db
    .select()
    .from(gameMiningSites)
    .where(
      and(
        eq(gameMiningSites.id, args.siteId),
        eq(gameMiningSites.playerId, args.playerId),
      ),
    )
    .limit(1);

  if (!site) return { ok: false, error: "site_not_found" };

  const mineralKey = site.mineralKey as MineralKey;
  if (!MINERALS[mineralKey]) return { ok: false, error: "invalid_mineral" };

  const result = await rollExtraction({
    playerId: args.playerId,
    richness: num(site.richness),
    mineralKey,
  });

  if (result.quantityKg > 0) {
    const [stock] = await db
      .select()
      .from(gameMineralStocks)
      .where(
        and(
          eq(gameMineralStocks.playerId, args.playerId),
          eq(gameMineralStocks.mineralKey, site.mineralKey),
        ),
      )
      .limit(1);

    if (stock) {
      const prevQty = num(stock.quantityKg);
      const prevPurity = num(stock.purityPct);
      const totalQty = prevQty + result.quantityKg;
      const blendedPurity =
        totalQty > 0
          ? (prevQty * prevPurity + result.quantityKg * result.purityPct) / totalQty
          : result.purityPct;
      await db
        .update(gameMineralStocks)
        .set({
          quantityKg: String(Math.round(totalQty * 100) / 100),
          purityPct: String(Math.round(blendedPurity * 10) / 10),
          updatedAt: new Date(),
        })
        .where(eq(gameMineralStocks.id, stock.id));
    } else {
      await db.insert(gameMineralStocks).values({
        playerId: args.playerId,
        mineralKey: site.mineralKey,
        quantityKg: String(result.quantityKg),
        purityPct: String(result.purityPct),
      });
    }
  }

  await db
    .update(gameMiningSites)
    .set({ lastMinedAt: new Date(), status: "active" })
    .where(eq(gameMiningSites.id, site.id));

  await addXp(args.playerId, result.xp);

  return {
    ok: true,
    outcome: result.outcome,
    quantityKg: result.quantityKg,
    purityPct: result.purityPct,
    mineralKey: site.mineralKey,
    xp: result.xp,
    toolWear: result.toolWear,
    message: result.message,
    messageFr: result.messageFr,
  };
}

export async function startTransport(args: {
  playerId: string;
  mineralKey: MineralKey;
  quantityKg: number;
  vehicleKey: keyof typeof VEHICLES;
  routeKey: string;
  xp: number;
}): Promise<
  | { ok: true; jobId: string; completesAt: string; riskPct: number; costMcb: number }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [stock] = await db
    .select()
    .from(gameMineralStocks)
    .where(
      and(
        eq(gameMineralStocks.playerId, args.playerId),
        eq(gameMineralStocks.mineralKey, args.mineralKey),
      ),
    )
    .limit(1);

  if (!stock || num(stock.quantityKg) < args.quantityKg) {
    return { ok: false, error: "insufficient_stock" };
  }

  const quote = await quoteTransport({
    mineralKey: args.mineralKey,
    quantityKg: args.quantityKg,
    vehicleKey: args.vehicleKey,
    routeKey: args.routeKey,
    purityPct: num(stock.purityPct),
    xp: args.xp,
  });
  if (!quote.ok) return quote;

  const energy = await spendEnergy(args.playerId, ENERGY.transportCost);
  if (!energy.ok) return energy;

  const debit = await debitMcb({
    playerId: args.playerId,
    amount: quote.totalCostMcb,
    category: "transport_fuel",
    meta: { vehicleKey: args.vehicleKey, routeKey: args.routeKey },
  });
  if (!debit.ok) return debit;

  const completesAt = new Date(Date.now() + quote.durationMin * 60_000);
  const priceRow = await getMineralPrice(args.mineralKey);
  const purityMult = purityPriceMultiplier(num(stock.purityPct));
  const gross = args.quantityKg * num(priceRow?.currentPriceMcb) * purityMult;
  const rewardMcb = Math.round(gross * (0.78 + Math.random() * 0.08) * 100) / 100;
  const riskFactor = computeTransportRiskFactor(quote.riskPct);

  const remaining = num(stock.quantityKg) - args.quantityKg;
  await db
    .update(gameMineralStocks)
    .set({ quantityKg: String(remaining), updatedAt: new Date() })
    .where(eq(gameMineralStocks.id, stock.id));

  const [job] = await db
    .insert(gameTransportJobs)
    .values({
      playerId: args.playerId,
      mineralKey: args.mineralKey,
      quantityKg: String(args.quantityKg),
      fromLocation: args.routeKey,
      toLocation: quote.route.key,
      vehicleKey: args.vehicleKey,
      status: "in_transit",
      startedAt: new Date(),
      completesAt,
      rewardMcb: String(rewardMcb),
      riskFactor: String(riskFactor),
    })
    .returning();

  if (!job) return { ok: false, error: "job_failed" };

  return {
    ok: true,
    jobId: job.id,
    completesAt: completesAt.toISOString(),
    riskPct: quote.riskPct,
    costMcb: quote.totalCostMcb,
  };
}

async function getMineralPrice(mineralKey: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(gameEconomyPrices)
    .where(eq(gameEconomyPrices.mineralKey, mineralKey))
    .limit(1);
  return row;
}

export async function sellMinerals(args: {
  playerId: string;
  mineralKey: MineralKey;
  quantityKg: number;
}): Promise<
  | { ok: true; revenueMcb: number; pricePerKg: number }
  | { ok: false; error: string }
> {
  const energy = await spendEnergy(args.playerId, ENERGY.tradeCost);
  if (!energy.ok) return energy;

  const db = getDb();
  const [stock] = await db
    .select()
    .from(gameMineralStocks)
    .where(
      and(
        eq(gameMineralStocks.playerId, args.playerId),
        eq(gameMineralStocks.mineralKey, args.mineralKey),
      ),
    )
    .limit(1);

  if (!stock || num(stock.quantityKg) < args.quantityKg) {
    return { ok: false, error: "insufficient_stock" };
  }

  const priceRow = await getMineralPrice(args.mineralKey);
  const pricePerKg = num(priceRow?.currentPriceMcb);
  const purityMult = purityPriceMultiplier(num(stock.purityPct));
  const revenueMcb =
    Math.round(args.quantityKg * pricePerKg * purityMult * 100) / 100;

  await creditMcb({
    playerId: args.playerId,
    amount: revenueMcb,
    category: "mineral_sale",
    meta: { mineralKey: args.mineralKey, quantityKg: args.quantityKg },
  });

  const remaining = num(stock.quantityKg) - args.quantityKg;
  await db
    .update(gameMineralStocks)
    .set({ quantityKg: String(remaining), updatedAt: new Date() })
    .where(eq(gameMineralStocks.id, stock.id));

  await addXp(args.playerId, 8);
  return { ok: true, revenueMcb, pricePerKg };
}

export async function purchaseUpgrade(args: {
  playerId: string;
  itemKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const item = UPGRADE_CATALOG.find((u) => u.key === args.itemKey);
  if (!item) return { ok: false, error: "item_not_found" };

  const debit = await debitMcb({
    playerId: args.playerId,
    amount: item.costMcb,
    category: "upgrade_purchase",
    meta: { itemKey: item.key },
  });
  if (!debit.ok) return debit;

  const db = getDb();
  const [existing] = await db
    .select()
    .from(gameInventory)
    .where(
      and(
        eq(gameInventory.playerId, args.playerId),
        eq(gameInventory.itemKey, item.key),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(gameInventory)
      .set({ quantity: existing.quantity + 1 })
      .where(eq(gameInventory.id, existing.id));
  } else {
    await db.insert(gameInventory).values({
      playerId: args.playerId,
      itemKey: item.key,
      category: item.category,
      quantity: 1,
      metadata: item.effects,
    });
  }

  await addXp(args.playerId, 5);
  return { ok: true };
}

export async function listActiveWorldEvents() {
  const db = getDb();
  return db
    .select()
    .from(gameWorldEvents)
    .where(eq(gameWorldEvents.active, true))
    .orderBy(desc(gameWorldEvents.startsAt))
    .limit(10);
}
