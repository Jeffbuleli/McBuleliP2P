import { and, count, eq } from "drizzle-orm";
import {
  communityTraderFollows,
  communityUserProfiles,
  getDb,
} from "@/db";
import { notifyCommunityTraderFollow } from "@/lib/community/community-notifications";
import { addCommunityReputation } from "@/lib/community/reputation-service";
import { grantCommunityTraderFollow } from "@/lib/community/rewards-service";

export async function followTrader(args: {
  followerId: string;
  traderHandle: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const [trader] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, args.traderHandle))
    .limit(1);

  if (!trader) return { ok: false, error: "not_found" };
  if (trader.userId === args.followerId) return { ok: false, error: "self_follow" };

  try {
    await db.insert(communityTraderFollows).values({
      followerId: args.followerId,
      traderId: trader.userId,
    });
  } catch {
    return { ok: true };
  }

  await grantCommunityTraderFollow({
    followerId: args.followerId,
    traderId: trader.userId,
  });
  await addCommunityReputation({
    userId: trader.userId,
    delta: 3,
    reason: "trader_followed",
    refType: "follow",
    refId: args.followerId,
  });
  await notifyCommunityTraderFollow({
    traderId: trader.userId,
    followerId: args.followerId,
  });

  return { ok: true };
}

export async function unfollowTrader(args: {
  followerId: string;
  traderHandle: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const [trader] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, args.traderHandle))
    .limit(1);

  if (!trader) return { ok: false, error: "not_found" };

  await db
    .delete(communityTraderFollows)
    .where(
      and(
        eq(communityTraderFollows.followerId, args.followerId),
        eq(communityTraderFollows.traderId, trader.userId),
      ),
    );

  return { ok: true };
}

export async function isFollowingTrader(
  followerId: string | null,
  traderId: string,
): Promise<boolean> {
  if (!followerId) return false;
  const db = getDb();
  const [row] = await db
    .select({ id: communityTraderFollows.id })
    .from(communityTraderFollows)
    .where(
      and(
        eq(communityTraderFollows.followerId, followerId),
        eq(communityTraderFollows.traderId, traderId),
      ),
    )
    .limit(1);
  return !!row;
}

export async function countTraderFollowers(traderId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(communityTraderFollows)
    .where(eq(communityTraderFollows.traderId, traderId));
  return Number(row?.n ?? 0);
}

export async function countFollowing(followerId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(communityTraderFollows)
    .where(eq(communityTraderFollows.followerId, followerId));
  return Number(row?.n ?? 0);
}
