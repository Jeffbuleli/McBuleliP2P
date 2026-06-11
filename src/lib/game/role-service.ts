import { eq } from "drizzle-orm";
import { gamePlayers, getDb } from "@/db";
import { GAME_ROLES, type GameRole } from "@/lib/game/constants";
import {
  buildRolePromotionOffer,
  type RolePromotionOffer,
} from "@/lib/game/progression";
import { addXp, debitMcb } from "@/lib/game/player-state";

function num(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

export async function getRolePromotion(
  playerId: string,
): Promise<RolePromotionOffer & { currentRole: GameRole }> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);

  if (!player) throw new Error("player_not_found");

  const offer = buildRolePromotionOffer({
    role: player.role,
    xp: player.xp,
    mcbBalance: num(player.mcbBalance),
  });

  return { ...offer, currentRole: player.role as GameRole };
}

export async function promotePlayerRole(
  playerId: string,
): Promise<
  | { ok: true; role: GameRole; roleLabel: string; roleLabelFr: string }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, playerId))
    .limit(1);

  if (!player) return { ok: false, error: "player_not_found" };

  const offer = buildRolePromotionOffer({
    role: player.role,
    xp: player.xp,
    mcbBalance: num(player.mcbBalance),
  });

  if (!offer.nextRole) return { ok: false, error: "max_role" };
  if (!offer.canPromote) {
    if (player.xp < offer.minXp) return { ok: false, error: "insufficient_xp" };
    return { ok: false, error: "insufficient_mcb" };
  }

  const nextRole = offer.nextRole;
  const debit = await debitMcb({
    playerId,
    amount: offer.entryFeeMcb,
    category: "role_promotion",
    meta: { fromRole: player.role, toRole: nextRole },
  });
  if (!debit.ok) return debit;

  const unlocked = new Set([...(player.unlockedRoles ?? []), nextRole]);
  const meta = GAME_ROLES[nextRole];

  await db
    .update(gamePlayers)
    .set({
      role: nextRole,
      unlockedRoles: [...unlocked],
      reputation: player.reputation + 8,
      updatedAt: new Date(),
    })
    .where(eq(gamePlayers.userId, playerId));

  await addXp(playerId, 12);

  return {
    ok: true,
    role: nextRole,
    roleLabel: meta.label,
    roleLabelFr: meta.labelFr,
  };
}

export function listUnlockedRoles(unlockedRoles: string[], currentRole: string): GameRole[] {
  const set = new Set<GameRole>([...(unlockedRoles as GameRole[]), currentRole as GameRole]);
  return [...set];
}
