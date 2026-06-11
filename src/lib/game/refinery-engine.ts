import { and, eq } from "drizzle-orm";
import { gameInventory, gameMineralStocks, gamePlayers, getDb } from "@/db";
import { type MineralKey } from "@/lib/game/constants";
import { roleMeetsMinimum, roleRank } from "@/lib/game/progression";
import { addXp, debitMcb, spendEnergy } from "@/lib/game/player-state";

function num(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export const REFINERY_CONFIG = {
  energyCost: 15,
  mcbPerKg: 2.5,
  yieldRetention: 0.82,
  basePurityGain: 10,
  moduleBonus: 5,
  labKitBonus: 3,
  maxPurity: 98,
  minInputKg: 2,
};

export async function getRefineryAccess(playerId: string): Promise<{
  available: boolean;
  reason: string;
  reasonFr: string;
  mcbPerKg: number;
  energyCost: number;
  purityBonus: number;
}> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);

  if (!player) {
    return {
      available: false,
      reason: "Player not found",
      reasonFr: "Joueur introuvable",
      mcbPerKg: REFINERY_CONFIG.mcbPerKg,
      energyCost: REFINERY_CONFIG.energyCost,
      purityBonus: 0,
    };
  }

  const inventory = await db
    .select()
    .from(gameInventory)
    .where(eq(gameInventory.playerId, playerId));

  const hasModule = inventory.some((i) => i.itemKey === "refinery_module");
  const hasLabKit = inventory.some((i) => i.itemKey === "lab_kit");
  const roleOk =
    roleMeetsMinimum(player.role, "refinery_owner") ||
    roleRank(player.role) >= roleRank("mineral_trader");

  const available = roleOk || hasModule || (hasLabKit && player.xp >= 900);

  let purityBonus = REFINERY_CONFIG.basePurityGain;
  if (hasModule) purityBonus += REFINERY_CONFIG.moduleBonus;
  if (hasLabKit) purityBonus += REFINERY_CONFIG.labKitBonus;

  let reason = "Refinery access granted";
  let reasonFr = "Accès raffinerie actif";
  if (!available) {
    reason = "Need Trader role, Refinery module, or Lab Kit + 900 XP";
    reasonFr = "Rôle Négociant, module raffinerie, ou kit labo + 900 XP";
  }

  return {
    available,
    reason,
    reasonFr,
    mcbPerKg: REFINERY_CONFIG.mcbPerKg,
    energyCost: REFINERY_CONFIG.energyCost,
    purityBonus,
  };
}

export async function refineMinerals(args: {
  playerId: string;
  mineralKey: MineralKey;
  quantityKg: number;
}): Promise<
  | {
      ok: true;
      inputKg: number;
      outputKg: number;
      purityBefore: number;
      purityAfter: number;
      costMcb: number;
      message: string;
      messageFr: string;
    }
  | { ok: false; error: string }
> {
  const access = await getRefineryAccess(args.playerId);
  if (!access.available) return { ok: false, error: "refinery_locked" };
  if (args.quantityKg < REFINERY_CONFIG.minInputKg) {
    return { ok: false, error: "min_quantity" };
  }

  const energy = await spendEnergy(args.playerId, REFINERY_CONFIG.energyCost);
  if (!energy.ok) return energy;

  const costMcb =
    Math.round(args.quantityKg * REFINERY_CONFIG.mcbPerKg * 100) / 100;
  const debit = await debitMcb({
    playerId: args.playerId,
    amount: costMcb,
    category: "refinery",
    meta: { mineralKey: args.mineralKey, quantityKg: args.quantityKg },
  });
  if (!debit.ok) return debit;

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

  const purityBefore = num(stock.purityPct);
  if (purityBefore >= REFINERY_CONFIG.maxPurity - 1) {
    return { ok: false, error: "already_premium" };
  }

  const outputKg =
    Math.round(args.quantityKg * REFINERY_CONFIG.yieldRetention * 100) / 100;
  const remaining = num(stock.quantityKg) - args.quantityKg;
  const purityAfter = clamp(
    purityBefore + access.purityBonus + (Math.random() - 0.5) * 4,
    purityBefore + 4,
    REFINERY_CONFIG.maxPurity,
  );
  const roundedPurity = Math.round(purityAfter * 10) / 10;

  const leftoverQty = remaining + outputKg;
  const blendedPurity =
    remaining > 0
      ? (remaining * purityBefore + outputKg * roundedPurity) / leftoverQty
      : roundedPurity;

  await db
    .update(gameMineralStocks)
    .set({
      quantityKg: String(Math.round(leftoverQty * 100) / 100),
      purityPct: String(Math.round(blendedPurity * 10) / 10),
      updatedAt: new Date(),
    })
    .where(eq(gameMineralStocks.id, stock.id));

  await addXp(args.playerId, 10);

  return {
    ok: true,
    inputKg: args.quantityKg,
    outputKg,
    purityBefore,
    purityAfter: roundedPurity,
    costMcb,
    message: `Refined ${args.quantityKg}kg → ${outputKg}kg at ${roundedPurity}% purity (−${costMcb} McB).`,
    messageFr: `Raffiné ${args.quantityKg}kg → ${outputKg}kg à ${roundedPurity}% pureté (−${costMcb} McB).`,
  };
}
