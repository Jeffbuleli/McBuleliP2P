import { and, desc, eq } from "drizzle-orm";
import {
  gameInventory,
  gameMiningSites,
  gameMineralStocks,
  gamePlayers,
  gameProperties,
  gameTransactions,
  gameTransportJobs,
  gameVehicles,
  getDb,
  users,
} from "@/db";
import { ensureCommunityProfile } from "@/lib/community/profile-service";
import { GAME_BP_BOOSTS } from "@/lib/game/bp-boosts";
import { STARTER, TRANSPORT_ROUTES, type MineralKey } from "@/lib/game/constants";
import { listActiveWorldEvents } from "@/lib/game/economy-engine";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { seedGameMarketPrices } from "@/lib/game/market-seeder";
import { getRefineryAccess } from "@/lib/game/refinery-engine";
import { buildRolePromotionOffer, buildProgressionView } from "@/lib/game/progression";
import { listShopForPlayer } from "@/lib/game/upgrade-service";
import {
  getToolDurability,
  siteRiskLabel,
  siteRiskLevel,
} from "@/lib/game/risk-engine";
import { listTransportOptions } from "@/lib/game/transport-engine";
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

  const [
    sites,
    stocks,
    vehicles,
    properties,
    recentTx,
    activeTransports,
    worldEvents,
    toolDurability,
    bpRow,
    inventory,
    shopItems,
    refinery,
  ] = await Promise.all([
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
    db
      .select()
      .from(gameTransportJobs)
      .where(
        and(
          eq(gameTransportJobs.playerId, userId),
          eq(gameTransportJobs.status, "in_transit"),
        ),
      ),
    listActiveWorldEvents(),
    getToolDurability(userId),
    db
      .select({ bal: users.buleliPointsBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db.select().from(gameInventory).where(eq(gameInventory.playerId, userId)),
    listShopForPlayer(userId),
    getRefineryAccess(userId),
  ]);

  const progression = buildProgressionView({
    xp: player.xp,
    lifestyleTier: player.lifestyleTier,
    role: player.role,
  });

  const rolePromotion = buildRolePromotionOffer({
    role: player.role,
    xp: player.xp,
    mcbBalance: num(player.mcbBalance),
  });

  return {
    player: {
      ...player,
      bpBalance: bpRow[0]?.bal ?? 0,
      toolDurability,
    },
    progression,
    rolePromotion,
    refinery,
    shopItems,
    inventory: inventory.map((i) => ({
      itemKey: i.itemKey,
      category: i.category,
      quantity: i.quantity,
      label: i.itemKey,
    })),
    regions: WORLD_REGIONS,
    sites: sites.map((s) => {
      const mineralKey = s.mineralKey as MineralKey;
      const risk = siteRiskLevel(num(s.richness), mineralKey);
      return {
        ...s,
        richness: num(s.richness),
        riskLevel: Math.round(risk * 100),
        riskLabel: siteRiskLabel(risk, false),
        riskLabelFr: siteRiskLabel(risk, true),
      };
    }),
    stocks: stocks.map((s) => ({
      ...s,
      quantityKg: num(s.quantityKg),
      purityPct: num(s.purityPct),
    })),
    vehicles,
    properties,
    transportOptions: listTransportOptions(player.xp),
    transportRoutes: TRANSPORT_ROUTES,
    bpBoosts: Object.entries(GAME_BP_BOOSTS).map(([id, b]) => ({
      id,
      costBp: b.costBp,
      label: b.label,
      labelFr: b.labelFr,
    })),
    activeTransports: activeTransports.map((j) => ({
      id: j.id,
      mineralKey: j.mineralKey,
      quantityKg: num(j.quantityKg),
      vehicleKey: j.vehicleKey,
      routeKey: j.fromLocation,
      status: j.status,
      completesAt: j.completesAt?.toISOString() ?? null,
      rewardMcb: num(j.rewardMcb),
    })),
    worldEvents: worldEvents.map((e) => ({
      id: e.id,
      eventKey: e.eventKey,
      title: e.title,
      endsAt: e.endsAt.toISOString(),
    })),
    recentTransactions: recentTx.map((t) => ({
      ...t,
      amountMcb: num(t.amountMcb),
      balanceAfter: num(t.balanceAfter),
    })),
  };
}
