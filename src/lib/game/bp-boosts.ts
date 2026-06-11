import { eq, sql } from "drizzle-orm";
import { gamePlayers, getDb, users } from "@/db";

export const GAME_BP_BOOSTS = {
  energy_refill: {
    costBp: 25,
    energyGain: 25,
    label: "Energy refill",
    labelFr: "Recharge énergie",
  },
  beginner_tool: {
    costBp: 40,
    toolDurabilityGain: 30,
    label: "Beginner tool kit",
    labelFr: "Kit outil débutant",
  },
  market_tip: {
    costBp: 15,
    label: "Market tip (24h)",
    labelFr: "Conseil marché (24h)",
  },
} as const;

export type GameBpBoostId = keyof typeof GAME_BP_BOOSTS;

export async function applyGameBpBoost(args: {
  userId: string;
  boostId: GameBpBoostId;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const boost = GAME_BP_BOOSTS[args.boostId];
  if (!boost) return { ok: false, error: "invalid_boost" };

  const db = getDb();
  const [user] = await db
    .select({ bal: users.buleliPointsBalance })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  if (!user || user.bal < boost.costBp) {
    return { ok: false, error: "insufficient_bp" };
  }

  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, args.userId))
    .limit(1);

  if (!player) return { ok: false, error: "player_not_found" };

  await db
    .update(users)
    .set({
      buleliPointsBalance: sql`${users.buleliPointsBalance} - ${boost.costBp}`,
    })
    .where(eq(users.id, args.userId));

  if (args.boostId === "energy_refill") {
    const gain = GAME_BP_BOOSTS.energy_refill.energyGain;
    const energy = Math.min(player.energyCap, player.energy + gain);
    await db
      .update(gamePlayers)
      .set({ energy, updatedAt: new Date() })
      .where(eq(gamePlayers.userId, args.userId));
    return { ok: true, message: `+${gain} energy` };
  }

  if (args.boostId === "beginner_tool") {
    const stats = { ...(player.stats ?? {}) } as Record<string, number>;
    const cur = stats.toolDurability ?? 100;
    stats.toolDurability = Math.min(100, cur + GAME_BP_BOOSTS.beginner_tool.toolDurabilityGain);
    await db
      .update(gamePlayers)
      .set({ stats, updatedAt: new Date() })
      .where(eq(gamePlayers.userId, args.userId));
    return { ok: true, message: "Tool repaired" };
  }

  const stats = { ...(player.stats ?? {}), marketTipUntil: Date.now() + 86_400_000 };
  await db
    .update(gamePlayers)
    .set({ stats, updatedAt: new Date() })
    .where(eq(gamePlayers.userId, args.userId));

  return { ok: true, message: "Market tip active" };
}
