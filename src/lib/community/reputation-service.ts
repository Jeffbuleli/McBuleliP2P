import { and, eq, sql } from "drizzle-orm";
import {
  communityReputationEvents,
  communityUserProfiles,
  getDb,
} from "@/db";
import { maybeAwardBadges } from "@/lib/community/badges-service";

export type ReputationReason =
  | "signal_publish"
  | "signal_win"
  | "signal_loss"
  | "trader_followed"
  | "feed_post";

export async function addCommunityReputation(args: {
  userId: string;
  delta: number;
  reason: ReputationReason;
  refType?: string;
  refId?: string;
}): Promise<number> {
  if (!args.delta) return 0;

  const db = getDb();
  await db.insert(communityReputationEvents).values({
    userId: args.userId,
    delta: args.delta,
    reason: args.reason,
    refType: args.refType ?? null,
    refId: args.refId ?? null,
  });

  const [row] = await db
    .update(communityUserProfiles)
    .set({
      reputationScore: sql`${communityUserProfiles.reputationScore} + ${args.delta}`,
      updatedAt: new Date(),
    })
    .where(eq(communityUserProfiles.userId, args.userId))
    .returning({ score: communityUserProfiles.reputationScore });

  const score = row?.score ?? 0;
  await maybeAwardBadges(args.userId);
  return score;
}

/**
 * Once-only reputation for a (reason, ref) pair - blocks follow/unfollow farming.
 * Returns whether a new event was written.
 */
export async function addCommunityReputationOnce(args: {
  userId: string;
  delta: number;
  reason: ReputationReason;
  refType: string;
  refId: string;
}): Promise<{ applied: boolean; score: number }> {
  if (!args.delta) return { applied: false, score: 0 };

  const db = getDb();
  const [existing] = await db
    .select({ id: communityReputationEvents.id })
    .from(communityReputationEvents)
    .where(
      and(
        eq(communityReputationEvents.userId, args.userId),
        eq(communityReputationEvents.reason, args.reason),
        eq(communityReputationEvents.refType, args.refType),
        eq(communityReputationEvents.refId, args.refId),
      ),
    )
    .limit(1);

  if (existing) {
    const [prof] = await db
      .select({ score: communityUserProfiles.reputationScore })
      .from(communityUserProfiles)
      .where(eq(communityUserProfiles.userId, args.userId))
      .limit(1);
    return { applied: false, score: prof?.score ?? 0 };
  }

  const score = await addCommunityReputation(args);
  return { applied: true, score };
}
