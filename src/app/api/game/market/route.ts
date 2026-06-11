import { NextResponse } from "next/server";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { listActiveWorldEvents } from "@/lib/game/economy-engine";
import { listMarketPrices, seedGameMarketPrices } from "@/lib/game/market-seeder";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureGameSchema();
  await seedGameMarketPrices();

  const [prices, events] = await Promise.all([
    listMarketPrices(),
    listActiveWorldEvents(),
  ]);

  return NextResponse.json({
    prices: prices.map((p) => ({
      mineralKey: p.mineralKey,
      label: p.label,
      basePriceMcb: Number(p.basePriceMcb),
      currentPriceMcb: Number(p.currentPriceMcb),
      demandIndex: Number(p.demandIndex),
      supplyIndex: Number(p.supplyIndex),
      updatedAt: p.updatedAt.toISOString(),
    })),
    events: events.map((e) => ({
      id: e.id,
      eventKey: e.eventKey,
      title: e.title,
      description: e.description,
      effects: e.effects,
      severity: e.severity,
      endsAt: e.endsAt.toISOString(),
    })),
  });
}
