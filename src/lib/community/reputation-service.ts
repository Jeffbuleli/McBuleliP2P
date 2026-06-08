import { eq, sql } from "drizzle-orm";
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
