import { desc, eq } from "drizzle-orm";
import {
  gameMiningSites,
  gameMineralStocks,
  gamePlayers,
  gameProperties,
  gameTransactions,
  gameVehicles,
  getDb,
} from "@/db";
import { ensureCommunityProfile } from "@/lib/community/profile-service";
import { STARTER } from "@/lib/game/constants";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { seedGameMarketPrices } from "@/lib/game/market-seeder";
import {
  deriveWorldSeed,
  generateStarterSites,
  WORLD_REGIONS,
} from "@/lib/game/world-generator";

function num(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

export type GamePlayerView = {
  userId: string;
  role: string;
  lifestyleTier: number;
  xp: number;
  reputation: number;
  mcbBalance: number;
  energy: number;
  energyCap: number;
  regionKey: string;
  campLevel: number;
  worldSeed: string;
  unlockedRoles: string[];
  achievements: string[];
  stats: Record<string, number>;
  community: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    reputationScore?: number;
  };
};

export async function getOrCreatePlayer(userId: string): Promise<GamePlayerView> {
  await ensureGameSchema();
  await seedGameMarketPrices();

  const db = getDb();
  const [existing] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, userId))
    .limit(1);

  if (!existing) {
    const worldSeed = deriveWorldSeed(userId);
    const regionKey = "katanga";
    await db.insert(gamePlayers).values({
      userId,
      worldSeed,
      regionKey,
      mcbBalance: String(STARTER.mcbBalance),
      energy: STARTER.energy,
      unlockedRoles: ["artisanal_miner"],
    });

    const sites = generateStarterSites({ worldSeed, regionKey });
    for (const s of sites) {
      await db.insert(gameMiningSites).values({
        playerId: userId,
        siteKey: s.siteKey,
        name: s.name,
        mineralKey: s.mineralKey,
        richness: String(s.richness),
      });
    }

    await db.insert(gameProperties).values({
      playerId: userId,
      propertyType: "camp",
      tier: 1,
      locationKey: regionKey,
    });
  }

  return getPlayerView(userId);
}

export async function getPlayerView(userId: string): Promise<GamePlayerView> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, userId))
    .limit(1);

  if (!player) {
    return getOrCreatePlayer(userId);
  }

  const community = await ensureCommunityProfile(userId);
  const regen = applyEnergyRegen(player);

  return {
    userId: player.userId,
    role: player.role,
    lifestyleTier: player.lifestyleTier,
    xp: regen.xp,
    reputation: player.reputation,
    mcbBalance: num(regen.mcbBalance),
    energy: regen.energy,
    energyCap: player.energyCap,
    regionKey: player.regionKey,
    campLevel: player.campLevel,
    worldSeed: player.worldSeed,
    unlockedRoles: player.unlockedRoles ?? [],
    achievements: player.achievements ?? [],
    stats: player.stats ?? {},
    community: {
      handle: community.handle,
      displayName: community.displayName,
      avatarUrl: community.avatarUrl,
      reputationScore: community.reputationScore,
    },
  };
}

function applyEnergyRegen(player: typeof gamePlayers.$inferSelect) {
  const now = Date.now();
  const last = player.lastEnergyAt?.getTime() ?? now;
  const hours = Math.max(0, (now - last) / 3_600_000);
  const regen = Math.floor(hours * 10);
  const energy = Math.min(player.energyCap, player.energy + regen);

  if (regen > 0 && energy !== player.energy) {
    const db = getDb();
    void db
      .update(gamePlayers)
      .set({ energy, lastEnergyAt: new Date(), updatedAt: new Date() })
      .where(eq(gamePlayers.userId, player.userId));
  }

  return { ...player, energy };
}

export async function debitMcb(args: {
  playerId: string;
  amount: number;
  category: string;
  referenceId?: string;
  meta?: Record<string, unknown>;
}): Promise<{ ok: true; balance: number } | { ok: false; error: string }> {
  if (args.amount <= 0) return { ok: false, error: "invalid_amount" };
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, args.playerId))
    .limit(1);
  if (!player) return { ok: false, error: "player_not_found" };

  const balance = num(player.mcbBalance);
  if (balance < args.amount) return { ok: false, error: "insufficient_mcb" };

  const next = Math.round((balance - args.amount) * 10000) / 10000;
  await db
    .update(gamePlayers)
    .set({ mcbBalance: String(next), updatedAt: new Date() })
    .where(eq(gamePlayers.userId, args.playerId));

  await db.insert(gameTransactions).values({
    playerId: args.playerId,
    direction: "debit",
    amountMcb: String(args.amount),
    balanceAfter: String(next),
    category: args.category,
    referenceId: args.referenceId ?? null,
    meta: args.meta ?? null,
  });

  return { ok: true, balance: next };
}

export async function creditMcb(args: {
  playerId: string;
  amount: number;
  category: string;
  referenceId?: string;
  meta?: Record<string, unknown>;
}): Promise<number> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, args.playerId))
    .limit(1);
  if (!player) throw new Error("player_not_found");

  const balance = num(player.mcbBalance);
  const next = Math.round((balance + args.amount) * 10000) / 10000;

  await db
    .update(gamePlayers)
    .set({ mcbBalance: String(next), updatedAt: new Date() })
    .where(eq(gamePlayers.userId, args.playerId));

  await db.insert(gameTransactions).values({
    playerId: args.playerId,
    direction: "credit",
    amountMcb: String(args.amount),
    balanceAfter: String(next),
    category: args.category,
    referenceId: args.referenceId ?? null,
    meta: args.meta ?? null,
  });

  return next;
}

export async function spendEnergy(
  playerId: string,
  cost: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);
  if (!player) return { ok: false, error: "player_not_found" };
  if (player.energy < cost) return { ok: false, error: "insufficient_energy" };

  await db
    .update(gamePlayers)
    .set({ energy: player.energy - cost, updatedAt: new Date() })
    .where(eq(gamePlayers.userId, playerId));

  return { ok: true };
}

export async function addXp(playerId: string, xp: number): Promise<void> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);
  if (!player) return;

  await db
    .update(gamePlayers)
    .set({ xp: player.xp + xp, updatedAt: new Date() })
    .where(eq(gamePlayers.userId, playerId));
}

export async function getPlayerDashboard(userId: string) {
  const player = await getOrCreatePlayer(userId);
  const db = getDb();

  const [sites, stocks, vehicles, properties, recentTx] = await Promise.all([
    db.select().from(gameMiningSites).where(eq(gameMiningSites.playerId, userId)),
    db.select().from(gameMineralStocks).where(eq(gameMineralStocks.playerId, userId)),
    db.select().from(gameVehicles).where(eq(gameVehicles.playerId, userId)),
    db.select().from(gameProperties).where(eq(gameProperties.playerId, userId)),
    db
      .select()
      .from(gameTransactions)
      .where(eq(gameTransactions.playerId, userId))
      .orderBy(desc(gameTransactions.createdAt))
      .limit(20),
  ]);

  return {
    player,
    regions: WORLD_REGIONS,
    sites,
    stocks: stocks.map((s) => ({
      ...s,
      quantityKg: num(s.quantityKg),
      purityPct: num(s.purityPct),
    })),
    vehicles,
    properties,
    recentTransactions: recentTx.map((t) => ({
      ...t,
      amountMcb: num(t.amountMcb),
      balanceAfter: num(t.balanceAfter),
    })),
  };
}
