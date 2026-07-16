import { and, count, eq, gt, gte, sql } from "drizzle-orm";
import { communityPosts, getDb, rewardPointLedger, users } from "@/db";
import { getActiveBuildersMembership } from "@/lib/builders/builders-service";
import { buildersBoostLimits } from "@/lib/builders/builders-soft-perks";
import { COMMUNITY_POST_BOOST } from "@/lib/reward-points-config";
import { isPostBoosted } from "@/lib/community/boost-utils";

export type BoostPostResult =
  | { ok: true; boostedUntil: string; balance: number; costBp: number }
  | { ok: false; code: string };

export { isPostBoosted };

function utcDayStart(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export async function boostCommunityPost(args: {
  userId: string;
  postId: string;
}): Promise<BoostPostResult> {
  const costBp = COMMUNITY_POST_BOOST.costBp;
  const db = getDb();

  const [post] = await db
    .select({
      id: communityPosts.id,
      authorId: communityPosts.authorId,
      status: communityPosts.status,
      boostedUntil: communityPosts.boostedUntil,
    })
    .from(communityPosts)
    .where(eq(communityPosts.id, args.postId))
    .limit(1);

  if (!post) return { ok: false, code: "boost_not_found" };
  if (post.status !== "published") return { ok: false, code: "boost_not_published" };
  if (post.authorId !== args.userId) {
    return { ok: false, code: "boost_not_owner" };
  }
  if (post.boostedUntil && post.boostedUntil.getTime() > Date.now()) {
    return { ok: false, code: "boost_already_active" };
  }

  const membership = await getActiveBuildersMembership(args.userId);
  const boostLimits = buildersBoostLimits(membership?.tier);

  const [activeBoosts] = await db
    .select({ n: count() })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.authorId, args.userId),
        eq(communityPosts.status, "published"),
        gt(communityPosts.boostedUntil, new Date()),
      ),
    );
  if (Number(activeBoosts?.n ?? 0) >= boostLimits.maxActivePerUser) {
    return { ok: false, code: "boost_active_limit" };
  }

  const dayStart = utcDayStart();
  const [todayBoosts] = await db
    .select({ n: count() })
    .from(rewardPointLedger)
    .where(
      and(
        eq(rewardPointLedger.userId, args.userId),
        gte(rewardPointLedger.createdAt, dayStart),
        sql`${rewardPointLedger.note} like 'community_post_boost:%'`,
      ),
    );
  if (Number(todayBoosts?.n ?? 0) >= boostLimits.maxPerDay) {
    return { ok: false, code: "boost_daily_limit" };
  }

  const [user] = await db
    .select({ bal: users.buleliPointsBalance })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);
  if (!user || user.bal < costBp) {
    return { ok: false, code: "boost_insufficient_bp" };
  }

  const now = new Date();
  const boostedUntil = new Date(
    now.getTime() + COMMUNITY_POST_BOOST.hours * 3_600_000,
  );

  try {
    const balance = await db.transaction(async (tx) => {
      const [deducted] = await tx
        .update(users)
        .set({
          buleliPointsBalance: sql`${users.buleliPointsBalance} - ${costBp}`,
        })
        .where(
          and(
            eq(users.id, args.userId),
            sql`${users.buleliPointsBalance} >= ${costBp}`,
          ),
        )
        .returning({ bal: users.buleliPointsBalance });

      if (!deducted) throw new Error("boost_insufficient_bp");

      const [updated] = await tx
        .update(communityPosts)
        .set({
          boostedUntil,
          boostBpSpent: sql`coalesce(${communityPosts.boostBpSpent}, 0) + ${costBp}`,
          updatedAt: now,
        })
        .where(
          and(
            eq(communityPosts.id, args.postId),
            eq(communityPosts.authorId, args.userId),
            eq(communityPosts.status, "published"),
          ),
        )
        .returning({ id: communityPosts.id });

      if (!updated) throw new Error("boost_not_found");

      await tx.insert(rewardPointLedger).values({
        userId: args.userId,
        amount: -costBp,
        grantType: null,
        note: `community_post_boost:${args.postId}`,
        meta: {
          postId: args.postId,
          hours: COMMUNITY_POST_BOOST.hours,
          boostedUntil: boostedUntil.toISOString(),
        },
      });

      return deducted.bal;
    });

    return {
      ok: true,
      boostedUntil: boostedUntil.toISOString(),
      balance,
      costBp,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "boost_failed";
    return { ok: false, code: msg };
  }
}

