import { and, eq } from "drizzle-orm";
import { gameInventory, gamePlayers, getDb } from "@/db";
import {
  GAME_ROLES,
  UPGRADE_CATALOG,
  type GameRole,
  type UpgradeItem,
} from "@/lib/game/constants";
import { roleMeetsMinimum } from "@/lib/game/progression";
import { addXp, debitMcb } from "@/lib/game/player-state";

function num(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

export type ShopItemView = {
  key: string;
  category: UpgradeItem["category"];
  label: string;
  labelFr: string;
  costMcb: number;
  minRole: GameRole;
  effects: Record<string, number>;
  owned: boolean;
  canBuy: boolean;
  lockReason: string | null;
  lockReasonFr: string | null;
};

export async function listShopForPlayer(playerId: string): Promise<ShopItemView[]> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);

  if (!player) return [];

  const owned = await db
    .select()
    .from(gameInventory)
    .where(eq(gameInventory.playerId, playerId));

  const ownedKeys = new Set(owned.map((i) => i.itemKey));

  return UPGRADE_CATALOG.map((item) => {
    const roleOk = roleMeetsMinimum(player.role, item.minRole);
    const isOwned =
      (item.category === "upgrade" || item.category === "license") &&
      ownedKeys.has(item.key);
    const canAfford = num(player.mcbBalance) >= item.costMcb;

    let canBuy = roleOk && canAfford && !isOwned;
    let lockReason: string | null = null;
    let lockReasonFr: string | null = null;

    if (!roleOk) {
      canBuy = false;
      const roleMeta = GAME_ROLES[item.minRole];
      lockReason = `Requires ${roleMeta.label}`;
      lockReasonFr = `Rôle requis : ${roleMeta.labelFr}`;
    } else if (isOwned) {
      canBuy = false;
      lockReason = "Already owned";
      lockReasonFr = "Déjà possédé";
    } else if (!canAfford) {
      canBuy = false;
      lockReason = `Need ${item.costMcb} McB`;
      lockReasonFr = `Besoin de ${item.costMcb} McB`;
    }

    return {
      key: item.key,
      category: item.category,
      label: item.label,
      labelFr: item.labelFr,
      costMcb: item.costMcb,
      minRole: item.minRole,
      effects: item.effects,
      owned: isOwned || (item.category === "tool" && ownedKeys.has(item.key)),
      canBuy,
      lockReason,
      lockReasonFr,
    };
  });
}

async function applyUpgradeEffects(
  playerId: string,
  item: UpgradeItem,
): Promise<void> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);

  if (!player) return;

  const stats = { ...(player.stats ?? {}) } as Record<string, number>;
  let energy = player.energy;
  let energyCap = player.energyCap;
  let lifestyleTier = player.lifestyleTier;
  let reputation = player.reputation;
  const e = item.effects;

  if (e.energyRestore) {
    energy = Math.min(energyCap, energy + e.energyRestore);
  }
  if (e.energyCap) energyCap += e.energyCap;
  if (e.lifestyleTier) lifestyleTier += e.lifestyleTier;
  if (e.reputation) reputation += e.reputation;
  if (e.conditionRestore) {
    stats.toolDurability = Math.min(
      100,
      (stats.toolDurability ?? 100) + e.conditionRestore,
    );
  }
  if (item.key.startsWith("pickaxe")) {
    stats.toolDurability = 100;
  }
  if (e.miningYield) {
    stats.miningYield = Math.max(stats.miningYield ?? 1, e.miningYield);
  }
  if (e.fuelRestore) stats.fuelReserve = (stats.fuelReserve ?? 0) + e.fuelRestore;

  await db
    .update(gamePlayers)
    .set({
      energy,
      energyCap,
      lifestyleTier,
      reputation,
      stats,
      campLevel:
        item.category === "upgrade" && item.key.startsWith("camp")
          ? player.campLevel + 1
          : player.campLevel,
      updatedAt: new Date(),
    })
    .where(eq(gamePlayers.userId, playerId));
}

export async function purchaseShopItem(args: {
  playerId: string;
  itemKey: string;
}): Promise<
  | { ok: true; itemKey: string; label: string; applied: string[] }
  | { ok: false; error: string }
> {
  const item = UPGRADE_CATALOG.find((u) => u.key === args.itemKey);
  if (!item) return { ok: false, error: "item_not_found" };

  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, args.playerId))
    .limit(1);

  if (!player) return { ok: false, error: "player_not_found" };
  if (!roleMeetsMinimum(player.role, item.minRole)) {
    return { ok: false, error: "role_locked" };
  }

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

  if (
    (item.category === "upgrade" || item.category === "license") &&
    existing
  ) {
    return { ok: false, error: "already_owned" };
  }

  const debit = await debitMcb({
    playerId: args.playerId,
    amount: item.costMcb,
    category: "upgrade_purchase",
    meta: { itemKey: item.key },
  });
  if (!debit.ok) return debit;

  if (existing && item.category !== "upgrade" && item.category !== "license") {
    await db
      .update(gameInventory)
      .set({ quantity: existing.quantity + 1 })
      .where(eq(gameInventory.id, existing.id));
  } else if (!existing || item.category === "consumable") {
    await db.insert(gameInventory).values({
      playerId: args.playerId,
      itemKey: item.key,
      category: item.category,
      quantity: 1,
      metadata: item.effects,
    });
  }

  await applyUpgradeEffects(args.playerId, item);
  await addXp(args.playerId, 5);

  const applied: string[] = [];
  if (item.effects.energyRestore) applied.push(`+${item.effects.energyRestore} energy`);
  if (item.effects.energyCap) applied.push(`+${item.effects.energyCap} energy cap`);
  if (item.effects.reputation) applied.push(`+${item.effects.reputation} reputation`);
  if (item.key.startsWith("pickaxe")) applied.push("tool restored");

  return {
    ok: true,
    itemKey: item.key,
    label: item.label,
    applied,
  };
}
