import { eq } from "drizzle-orm";
import { gameInventory, gamePlayers, getDb } from "@/db";
import { MINERALS, type MineralKey } from "@/lib/game/constants";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function siteRiskLevel(richness: number, mineralKey: MineralKey): number {
  const m = MINERALS[mineralKey];
  return clamp(
    0.12 + (1 - richness) * 0.28 + m.extractionDifficulty * 0.35 + m.rarity * 0.15,
    0.1,
    0.88,
  );
}

export function siteRiskLabel(risk: number, fr: boolean): string {
  if (risk < 0.3) return fr ? "Risque faible" : "Low risk";
  if (risk < 0.55) return fr ? "Risque moyen" : "Medium risk";
  return fr ? "Risque élevé" : "High risk";
}

export async function getToolDurability(playerId: string): Promise<number> {
  const db = getDb();
  const pick = await db
    .select()
    .from(gameInventory)
    .where(eq(gameInventory.playerId, playerId));

  const pickaxe = pick.find((i) => i.itemKey.startsWith("pickaxe"));
  if (pickaxe?.metadata && typeof pickaxe.metadata === "object") {
    const d = (pickaxe.metadata as { durability?: number }).durability;
    if (typeof d === "number") return d;
  }

  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);

  const stats = (player?.stats ?? {}) as Record<string, number>;
  return stats.toolDurability ?? 100;
}

export async function applyToolWear(
  playerId: string,
  wear: number,
): Promise<number> {
  const db = getDb();
  const current = await getToolDurability(playerId);
  const next = Math.max(0, current - wear);

  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);

  if (player) {
    const stats = { ...(player.stats ?? {}), toolDurability: next };
    await db
      .update(gamePlayers)
      .set({ stats, updatedAt: new Date() })
      .where(eq(gamePlayers.userId, playerId));
  }

  return next;
}

export type MineResult =
  | {
      outcome: "failed";
      quantityKg: 0;
      purityPct: 0;
      toolWear: number;
      xp: number;
      message: string;
      messageFr: string;
    }
  | {
      outcome: "partial";
      quantityKg: number;
      purityPct: number;
      toolWear: number;
      xp: number;
      message: string;
      messageFr: string;
    }
  | {
      outcome: "success";
      quantityKg: number;
      purityPct: number;
      toolWear: number;
      xp: number;
      message: string;
      messageFr: string;
    }
  | {
      outcome: "rich_strike";
      quantityKg: number;
      purityPct: number;
      toolWear: number;
      xp: number;
      message: string;
      messageFr: string;
    };

export async function rollExtraction(args: {
  playerId: string;
  richness: number;
  mineralKey: MineralKey;
}): Promise<MineResult> {
  const db = getDb();
  const [player] = await db
    .select({ stats: gamePlayers.stats })
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, args.playerId))
    .limit(1);
  const yieldMult = (player?.stats as Record<string, number> | undefined)?.miningYield ?? 1;

  const risk = siteRiskLevel(args.richness, args.mineralKey);
  const mineral = MINERALS[args.mineralKey];
  const toolDur = await getToolDurability(args.playerId);
  const toolPenalty = toolDur < 30 ? 0.15 : toolDur < 60 ? 0.07 : 0;
  const failChance = clamp(risk * 0.45 + toolPenalty, 0.08, 0.55);
  const wear = Math.round((3 + risk * 12) * 10) / 10;

  const roll = Math.random();
  if (roll < failChance) {
    const durability = await applyToolWear(args.playerId, wear);
    return {
      outcome: "failed",
      quantityKg: 0,
      purityPct: 0,
      toolWear: wear,
      xp: 3,
      message: `Extraction failed. Tool wear −${wear}% (${durability}% left).`,
      messageFr: `Extraction échouée. Usure outil −${wear}% (${durability}% restant).`,
    };
  }

  const baseYield = 1.5 + args.richness * 9 + (1 - mineral.extractionDifficulty) * 2.5;
  const yieldRoll = 0.7 + Math.random() * 0.55;
  let quantityKg = Math.round(baseYield * yieldRoll * yieldMult * 100) / 100;

  const purityBase = 45 + args.richness * 40 + (1 - risk) * 15;
  let purityPct = clamp(purityBase + (Math.random() - 0.5) * 18, 38, 98);
  purityPct = Math.round(purityPct * 10) / 10;

  let outcome: MineResult["outcome"] = "success";
  let xp = 10;
  let message = `Extracted ${quantityKg}kg at ${purityPct}% purity.`;
  let messageFr = `Extrait ${quantityKg}kg à ${purityPct}% de pureté.`;

  if (roll > 0.92 && risk > 0.4) {
    outcome = "rich_strike";
    quantityKg = Math.round(quantityKg * 1.65 * 100) / 100;
    purityPct = clamp(purityPct + 8, 0, 98);
    xp = 18;
    message = `Rich strike! ${quantityKg}kg high-grade ore (${purityPct}%).`;
    messageFr = `Filon riche ! ${quantityKg}kg minerai haute teneur (${purityPct}%).`;
  } else if (purityPct < 52 || quantityKg < baseYield * 0.55) {
    outcome = "partial";
    quantityKg = Math.round(quantityKg * 0.55 * 100) / 100;
    purityPct = clamp(purityPct - 12, 35, 55);
    xp = 6;
    message = `Low-grade batch: ${quantityKg}kg at ${purityPct}% purity.`;
    messageFr = `Lot basse qualité : ${quantityKg}kg à ${purityPct}% pureté.`;
  }

  await applyToolWear(args.playerId, wear);

  return {
    outcome,
    quantityKg,
    purityPct,
    toolWear: wear,
    xp,
    message,
    messageFr,
  };
}

export function purityPriceMultiplier(purityPct: number): number {
  if (purityPct >= 90) return 1.15;
  if (purityPct >= 75) return 1.0;
  if (purityPct >= 55) return 0.82;
  return 0.55;
}

export function purityGrade(purityPct: number, fr: boolean): string {
  if (purityPct >= 90) return fr ? "Premium" : "Premium";
  if (purityPct >= 75) return fr ? "Standard" : "Standard";
  if (purityPct >= 55) return fr ? "Faible" : "Low grade";
  return fr ? "Rebut" : "Waste";
}
