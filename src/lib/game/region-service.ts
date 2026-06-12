import { and, eq, like } from "drizzle-orm";
import { gameMiningSites, gamePlayers, getDb } from "@/db";
import { addXp, debitMcb, spendEnergy } from "@/lib/game/player-state";
import {
  WORLD_REGIONS,
  generateStarterSites,
  type WorldRegion,
} from "@/lib/game/world-generator";

export type RegionTravelCost = {
  mcb: number;
  energy: number;
  minXp: number;
};

export const REGION_TRAVEL: Record<string, RegionTravelCost> = {
  katanga: { mcb: 0, energy: 5, minXp: 0 },
  kasai: { mcb: 5, energy: 10, minXp: 200 },
  lualaba: { mcb: 8, energy: 12, minXp: 600 },
  kivu: { mcb: 12, energy: 15, minXp: 1200 },
};

export type RegionView = WorldRegion & {
  unlocked: boolean;
  isCurrent: boolean;
  travelMcb: number;
  travelEnergy: number;
  minXp: number;
  siteCount: number;
};

export async function listRegionsForPlayer(args: {
  playerId: string;
  regionKey: string;
  xp: number;
  worldSeed: string;
}): Promise<RegionView[]> {
  const db = getDb();
  const sites = await db
    .select({ siteKey: gameMiningSites.siteKey })
    .from(gameMiningSites)
    .where(eq(gameMiningSites.playerId, args.playerId));

  const siteCounts = new Map<string, number>();
  for (const s of sites) {
    const match = s.siteKey.match(/^site_([^_]+)_/);
    if (match?.[1]) {
      siteCounts.set(match[1], (siteCounts.get(match[1]) ?? 0) + 1);
    }
  }

  return WORLD_REGIONS.map((r) => {
    const travel = REGION_TRAVEL[r.key] ?? REGION_TRAVEL.katanga!;
    const unlocked = args.xp >= travel.minXp;
    return {
      ...r,
      unlocked,
      isCurrent: r.key === args.regionKey,
      travelMcb: travel.mcb,
      travelEnergy: travel.energy,
      minXp: travel.minXp,
      siteCount: siteCounts.get(r.key) ?? 0,
    };
  });
}

async function ensureRegionSites(args: {
  playerId: string;
  worldSeed: string;
  regionKey: string;
}): Promise<void> {
  const db = getDb();
  const prefix = `site_${args.regionKey}_`;
  const [existing] = await db
    .select({ id: gameMiningSites.id })
    .from(gameMiningSites)
    .where(
      and(
        eq(gameMiningSites.playerId, args.playerId),
        like(gameMiningSites.siteKey, `${prefix}%`),
      ),
    )
    .limit(1);

  if (existing) return;

  const sites = generateStarterSites({
    worldSeed: args.worldSeed,
    regionKey: args.regionKey,
  });

  for (const s of sites) {
    await db.insert(gameMiningSites).values({
      playerId: args.playerId,
      siteKey: s.siteKey,
      name: s.name,
      mineralKey: s.mineralKey,
      richness: String(s.richness),
    });
  }
}

export async function travelToRegion(args: {
  playerId: string;
  regionKey: string;
}): Promise<
  | { ok: true; regionKey: string; regionName: string; regionNameFr: string }
  | { ok: false; error: string }
> {
  const region = WORLD_REGIONS.find((r) => r.key === args.regionKey);
  if (!region) return { ok: false, error: "region_not_found" };

  const travel = REGION_TRAVEL[args.regionKey];
  if (!travel) return { ok: false, error: "region_not_found" };

  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, args.playerId))
    .limit(1);

  if (!player) return { ok: false, error: "player_not_found" };
  if (player.regionKey === args.regionKey) {
    return { ok: false, error: "already_in_region" };
  }
  if (player.xp < travel.minXp) return { ok: false, error: "region_locked" };

  const energy = await spendEnergy(args.playerId, travel.energy);
  if (!energy.ok) return energy;

  if (travel.mcb > 0) {
    const debit = await debitMcb({
      playerId: args.playerId,
      amount: travel.mcb,
      category: "region_travel",
      meta: { regionKey: args.regionKey },
    });
    if (!debit.ok) return debit;
  }

  await ensureRegionSites({
    playerId: args.playerId,
    worldSeed: player.worldSeed,
    regionKey: args.regionKey,
  });

  await db
    .update(gamePlayers)
    .set({ regionKey: args.regionKey, updatedAt: new Date() })
    .where(eq(gamePlayers.userId, args.playerId));

  await addXp(args.playerId, 6);

  return {
    ok: true,
    regionKey: region.key,
    regionName: region.name,
    regionNameFr: region.nameFr,
  };
}

export function sitesForRegion<T extends { siteKey: string }>(
  sites: T[],
  regionKey: string,
): T[] {
  const prefix = `site_${regionKey}_`;
  return sites.filter((s) => s.siteKey.startsWith(prefix));
}
