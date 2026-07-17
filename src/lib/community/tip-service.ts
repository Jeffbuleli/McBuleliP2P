import { and, count, eq, gte, sql } from "drizzle-orm";
import {
  communityPosts,
  communityUserProfiles,
  getDb,
  rewardPointLedger,
  users,
} from "@/db";
import { COMMUNITY_TIP_BP } from "@/lib/reward-points-config";
import { createUserNotification } from "@/lib/notifications-service";

export type TipBpResult =
  | {
      ok: true;
      amount: number;
      tipperBalance: number;
      recipientBalance: number;
      tipBpTotal?: number;
    }
  | { ok: false; code: string };

function utcDayStart(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function isAllowedAmount(n: number): boolean {
  return (COMMUNITY_TIP_BP.amounts as readonly number[]).includes(n);
}

async function countTipsToday(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(rewardPointLedger)
    .where(
      and(
        eq(rewardPointLedger.userId, userId),
        gte(rewardPointLedger.createdAt, utcDayStart()),
        sql`${rewardPointLedger.note} like 'community_tip_out:%'`,
      ),
    );
  return Number(row?.n ?? 0);
}

/** Transfer BP tipper → creator (Horizon B6). */
export async function tipCommunityBp(args: {
  tipperId: string;
  amount: number;
  toUserId?: string;
  postId?: string;
}): Promise<TipBpResult> {
  if (!isAllowedAmount(args.amount)) {
    return { ok: false, code: "tip_invalid_amount" };
  }
  if (args.tipperId === args.toUserId) {
    return { ok: false, code: "tip_self" };
  }

  const db = getDb();
  let recipientId = args.toUserId ?? null;
  let postId: string | null = args.postId ?? null;

  if (args.postId) {
    const [post] = await db
      .select({
        id: communityPosts.id,
        authorId: communityPosts.authorId,
        status: communityPosts.status,
      })
      .from(communityPosts)
      .where(eq(communityPosts.id, args.postId))
      .limit(1);
    if (!post || post.status !== "published") {
      return { ok: false, code: "tip_not_found" };
    }
    recipientId = post.authorId;
    postId = post.id;
  }

  if (!recipientId) return { ok: false, code: "tip_not_found" };
  if (recipientId === args.tipperId) return { ok: false, code: "tip_self" };

  const [recipient] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, recipientId))
    .limit(1);
  if (!recipient) return { ok: false, code: "tip_not_found" };

  if ((await countTipsToday(args.tipperId)) >= COMMUNITY_TIP_BP.maxPerDay) {
    return { ok: false, code: "tip_daily_limit" };
  }

  const [tipper] = await db
    .select({ bal: users.buleliPointsBalance })
    .from(users)
    .where(eq(users.id, args.tipperId))
    .limit(1);
  if (!tipper || tipper.bal < args.amount) {
    return { ok: false, code: "tip_insufficient_bp" };
  }

  const tipKey = `${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;

  try {
    const balances = await db.transaction(async (tx) => {
      const [debited] = await tx
        .update(users)
        .set({
          buleliPointsBalance: sql`${users.buleliPointsBalance} - ${args.amount}`,
        })
        .where(
          and(
            eq(users.id, args.tipperId),
            sql`${users.buleliPointsBalance} >= ${args.amount}`,
          ),
        )
        .returning({ bal: users.buleliPointsBalance });
      if (!debited) throw new Error("tip_insufficient_bp");

      const [credited] = await tx
        .update(users)
        .set({
          buleliPointsBalance: sql`${users.buleliPointsBalance} + ${args.amount}`,
        })
        .where(eq(users.id, recipientId!))
        .returning({ bal: users.buleliPointsBalance });
      if (!credited) throw new Error("tip_not_found");

      let tipBpTotal: number | undefined;
      if (postId) {
        const [tipped] = await tx
          .update(communityPosts)
          .set({
            tipBpTotal: sql`coalesce(${communityPosts.tipBpTotal}, 0) + ${args.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(communityPosts.id, postId))
          .returning({ tipBpTotal: communityPosts.tipBpTotal });
        tipBpTotal = tipped?.tipBpTotal;
      }

      await tx.insert(rewardPointLedger).values([
        {
          userId: args.tipperId,
          amount: -args.amount,
          grantType: null,
          note: `community_tip_out:${tipKey}`,
          meta: {
            toUserId: recipientId,
            postId,
            amount: args.amount,
          },
        },
        {
          userId: recipientId!,
          amount: args.amount,
          grantType: null,
          note: `community_tip_in:${tipKey}`,
          meta: {
            fromUserId: args.tipperId,
            postId,
            amount: args.amount,
          },
        },
      ]);

      return {
        tipperBalance: debited.bal,
        recipientBalance: credited.bal,
        tipBpTotal,
      };
    });

    const [fromProfile] = await db
      .select({ handle: communityUserProfiles.handle })
      .from(communityUserProfiles)
      .where(eq(communityUserProfiles.userId, args.tipperId))
      .limit(1);

    void createUserNotification({
      userId: recipientId,
      kind: "community_tip",
      payload: {
        amount: args.amount,
        fromUserId: args.tipperId,
        fromHandle: fromProfile?.handle ?? null,
        postId,
      },
    }).catch(() => {});

    return {
      ok: true,
      amount: args.amount,
      tipperBalance: balances.tipperBalance,
      recipientBalance: balances.recipientBalance,
      tipBpTotal: balances.tipBpTotal,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "tip_failed";
    return { ok: false, code: msg };
  }
}
