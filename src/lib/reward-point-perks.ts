import { and, eq, gt, sql } from "drizzle-orm";
import { getDb, rewardPointPerks } from "@/db";

const PERK_ACTIVE = "active";
const PERK_USED = "used";

export type ActiveRewardPerk = {
  id: string;
  perkType: string;
  discountPercent: number;
  expiresAt: string;
};

export async function listActiveRewardPerks(
  userId: string,
): Promise<ActiveRewardPerk[]> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(rewardPointPerks)
    .where(
      and(
        eq(rewardPointPerks.userId, userId),
        eq(rewardPointPerks.status, PERK_ACTIVE),
        gt(rewardPointPerks.expiresAt, now),
      ),
    )
    .orderBy(rewardPointPerks.expiresAt);

  return rows.map((r) => ({
    id: r.id,
    perkType: r.perkType,
    discountPercent: r.discountPercent,
    expiresAt: r.expiresAt.toISOString(),
  }));
}

/** Apply P2P fee discount inside release transaction; marks perk used. */
export async function applyP2pFeeDiscountInTx(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  buyerUserId: string,
  orderId: string,
  feeCrypto: number,
): Promise<number> {
  if (feeCrypto <= 1e-24) return feeCrypto;

  const now = new Date();
  const [perk] = await tx
    .select()
    .from(rewardPointPerks)
    .where(
      and(
        eq(rewardPointPerks.userId, buyerUserId),
        eq(rewardPointPerks.perkType, "p2p_fee_discount_15"),
        eq(rewardPointPerks.status, PERK_ACTIVE),
        gt(rewardPointPerks.expiresAt, now),
      ),
    )
    .limit(1);

  if (!perk) return feeCrypto;

  const discounted = feeCrypto * (1 - perk.discountPercent / 100);
  await tx
    .update(rewardPointPerks)
    .set({
      status: PERK_USED,
      usedOrderId: sql`${orderId}::uuid`,
    })
    .where(eq(rewardPointPerks.id, perk.id));

  return discounted;
}

/** Bot renewal discount - returns price multiplier (e.g. 0.9 for 10% off). */
export async function consumeBotRenewalDiscountPerk(
  userId: string,
): Promise<number> {
  const db = getDb();
  const now = new Date();
  const [perk] = await db
    .select()
    .from(rewardPointPerks)
    .where(
      and(
        eq(rewardPointPerks.userId, userId),
        eq(rewardPointPerks.perkType, "bot_renewal_discount_10"),
        eq(rewardPointPerks.status, PERK_ACTIVE),
        gt(rewardPointPerks.expiresAt, now),
      ),
    )
    .limit(1);

  if (!perk) return 1;

  await db
    .update(rewardPointPerks)
    .set({ status: PERK_USED })
    .where(eq(rewardPointPerks.id, perk.id));

  return 1 - perk.discountPercent / 100;
}
