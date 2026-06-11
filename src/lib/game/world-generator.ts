import { createHash } from "crypto";
import type { MineralKey } from "@/lib/game/constants";

export type WorldRegion = {
  key: string;
  name: string;
  nameFr: string;
  biome: string;
  riskLevel: number;
  minerals: MineralKey[];
};

export const WORLD_REGIONS: WorldRegion[] = [
  {
    key: "katanga",
    name: "Katanga Copperbelt",
    nameFr: "Ceinture du cuivre — Katanga",
    biome: "savanna_mining",
    riskLevel: 0.35,
    minerals: ["cobalt", "copper", "gold"],
  },
  {
    key: "kivu",
    name: "Kivu Highlands",
    nameFr: "Hauts plateaux du Kivu",
    biome: "forest_hills",
    riskLevel: 0.55,
    minerals: ["coltan", "gold", "diamonds"],
  },
  {
    key: "kasai",
    name: "Kasai River Basin",
    nameFr: "Bassin du Kasi",
    biome: "river_forest",
    riskLevel: 0.4,
    minerals: ["diamonds", "copper"],
  },
  {
    key: "lualaba",
    name: "Lualaba Industrial Zone",
    nameFr: "Zone industrielle Lualaba",
    biome: "industrial_corridor",
    riskLevel: 0.3,
    minerals: ["cobalt", "lithium", "copper"],
  },
];

export function deriveWorldSeed(userId: string): string {
  return createHash("sha256").update(`mcbuleli-world:${userId}`).digest("hex").slice(0, 16);
}

export function generateStarterSites(args: {
  worldSeed: string;
  regionKey: string;
}): { siteKey: string; name: string; mineralKey: MineralKey; richness: number }[] {
  const region = WORLD_REGIONS.find((r) => r.key === args.regionKey) ?? WORLD_REGIONS[0]!;
  const hash = createHash("sha256").update(`${args.worldSeed}:${args.regionKey}`).digest();

  return region.minerals.slice(0, 2).map((mineralKey, i) => {
    const richness = 0.35 + (hash[i]! % 40) / 100;
    return {
      siteKey: `site_${args.regionKey}_${i + 1}`,
      name: `${region.nameFr.split("—")[0]?.trim() ?? region.name} — ${mineralKey}`,
      mineralKey,
      richness: Math.round(richness * 100) / 100,
    };
  });
}
