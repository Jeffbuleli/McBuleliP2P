import { eq } from "drizzle-orm";
import { gameEconomyPrices, getDb } from "@/db";
import { MINERALS, type MineralKey } from "@/lib/game/constants";

export async function seedGameMarketPrices(): Promise<void> {
  const db = getDb();
  for (const [key, m] of Object.entries(MINERALS) as [MineralKey, (typeof MINERALS)[MineralKey]][]) {
    const [existing] = await db
      .select({ mineralKey: gameEconomyPrices.mineralKey })
      .from(gameEconomyPrices)
      .where(eq(gameEconomyPrices.mineralKey, key))
      .limit(1);

    if (existing) continue;

    await db.insert(gameEconomyPrices).values({
      mineralKey: key,
      label: m.label,
      basePriceMcb: String(m.basePriceMcb),
      currentPriceMcb: String(m.basePriceMcb),
      demandIndex: "1",
      supplyIndex: "1",
      volatility: "0.08",
    });
  }
}

export async function listMarketPrices() {
  const db = getDb();
  return db.select().from(gameEconomyPrices);
}
