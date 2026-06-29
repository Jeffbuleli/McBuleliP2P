import { and, eq, gte, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { getDb, rewardPointGrants } from "@/db";
import {
  COMMUNITY_REWARD_DAILY_CAPS,
  REWARD_GRANT,
  type RewardGrantType,
} from "@/lib/reward-points-config";
import { tryGrantRewardPoints } from "@/lib/reward-points-service";

export type CommunityPostKind = "text" | "image" | "video";

export type CommunityGrantResult = {
  granted: boolean;
  points: number;
  balance: number;
  reason?: "daily_cap" | "self_action" | "too_short";
};

function dayStartUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Fits reward_point_grants.idempotency_key varchar(96). */
function storyPairIdempotency(
  prefix: string,
  storyId: string,
  userId: string,
): string {
  const digest = createHash("sha256")
    .update(`${storyId}\0${userId}`)
    .digest("hex")
    .slice(0, 40);
  return `${prefix}:${digest}`;
}

async function countGrantsToday(
  userId: string,
  grantType: RewardGrantType,
): Promise<number> {
  const db = getDb();
  const since = dayStartUtc();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(rewardPointGrants)
    .where(
      and(
        eq(rewardPointGrants.userId, userId),
        eq(rewardPointGrants.grantType, grantType),
        gte(rewardPointGrants.createdAt, since),
      ),
    );
  return row?.n ?? 0;
}

async function grantWithDailyCap(args: {
  userId: string;
  grantType: RewardGrantType;
  idempotencyKey: string;
  meta?: Record<string, unknown>;
  dailyCap?: number;
}): Promise<CommunityGrantResult> {
  const cap =
    args.dailyCap ?? COMMUNITY_REWARD_DAILY_CAPS[args.grantType];
  if (cap != null) {
    const today = await countGrantsToday(args.userId, args.grantType);
    if (today >= cap) {
      const bal = await import("@/lib/reward-points-service").then((m) =>
        m.getRewardPointsBalance(args.userId),
      );
      return { granted: false, points: 0, balance: bal, reason: "daily_cap" };
    }
  }

  const r = await tryGrantRewardPoints({
    userId: args.userId,
    grantType: args.grantType,
    idempotencyKey: args.idempotencyKey,
    meta: { ...args.meta, source: "community" },
  });
  return { granted: r.granted, points: r.points, balance: r.balance };
}

/** Profil communauté complété (pseudo + bio) - une fois. */
export async function grantCommunityProfileSetup(userId: string) {
  return grantWithDailyCap({
    userId,
    grantType: REWARD_GRANT.COMMUNITY_PROFILE_SETUP,
    idempotencyKey: REWARD_GRANT.COMMUNITY_PROFILE_SETUP,
  });
}

/** Premier post publié - bonus unique. */
export async function grantCommunityFirstPostBonus(
  userId: string,
  postId: string,
) {
  return grantWithDailyCap({
    userId,
    grantType: REWARD_GRANT.COMMUNITY_FIRST_POST,
    idempotencyKey: REWARD_GRANT.COMMUNITY_FIRST_POST,
    meta: { postId },
  });
}

/** Publication fil d'actualité. */
export async function grantCommunityPostPublished(args: {
  userId: string;
  postId: string;
  kind: CommunityPostKind;
  bodyLength: number;
}) {
  if (args.bodyLength < 20) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "too_short" as const,
    };
  }

  const grantType =
    args.kind === "video"
      ? REWARD_GRANT.COMMUNITY_POST_VIDEO
      : args.kind === "image"
        ? REWARD_GRANT.COMMUNITY_POST_IMAGE
        : REWARD_GRANT.COMMUNITY_POST_TEXT;

  const main = await grantWithDailyCap({
    userId: args.userId,
    grantType,
    idempotencyKey: `community_post:${args.postId}`,
    meta: { postId: args.postId, kind: args.kind },
  });

  if (main.granted) {
    await grantCommunityFirstPostBonus(args.userId, args.postId);
  }

  return main;
}

/** Commentaire sur un post. */
export async function grantCommunityComment(args: {
  userId: string;
  commentId: string;
  postId: string;
  bodyLength: number;
  postAuthorId: string;
}) {
  if (args.userId === args.postAuthorId) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "self_action" as const,
    };
  }
  if (args.bodyLength < 10) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "too_short" as const,
    };
  }

  return grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_COMMENT,
    idempotencyKey: `community_comment:${args.commentId}`,
    meta: { commentId: args.commentId, postId: args.postId },
  });
}

/** Like donné (engagement). */
export async function grantCommunityLike(args: {
  userId: string;
  likeId: string;
  targetAuthorId: string;
  targetType: string;
  targetId: string;
}) {
  if (args.userId === args.targetAuthorId) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "self_action" as const,
    };
  }

  const liker = await grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_LIKE,
    idempotencyKey: `community_like:${args.likeId}`,
    meta: { targetType: args.targetType, targetId: args.targetId },
  });

  await grantWithDailyCap({
    userId: args.targetAuthorId,
    grantType: REWARD_GRANT.COMMUNITY_LIKE_RECEIVED,
    idempotencyKey: `community_like_rx:${args.likeId}`,
    meta: { fromUserId: args.userId, targetType: args.targetType },
  });

  return liker;
}

/** Partage d'un post (1× par post et par jour). */
export async function grantCommunityShare(args: {
  userId: string;
  postId: string;
}) {
  const day = dayStartUtc().toISOString().slice(0, 10);
  return grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_SHARE,
    idempotencyKey: `community_share:${args.postId}:${day}`,
    meta: { postId: args.postId },
  });
}

/** Article blog publié. */
export async function grantCommunityBlogPublished(args: {
  userId: string;
  blogId: string;
  bodyLength: number;
}) {
  if (args.bodyLength < 200) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "too_short" as const,
    };
  }

  return grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_BLOG_PUBLISH,
    idempotencyKey: `community_blog:${args.blogId}`,
    meta: { blogId: args.blogId },
  });
}

/** Question posée. */
export async function grantCommunityQuestion(args: {
  userId: string;
  questionId: string;
  titleLength: number;
}) {
  if (args.titleLength < 10) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "too_short" as const,
    };
  }

  return grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_QUESTION,
    idempotencyKey: `community_question:${args.questionId}`,
    meta: { questionId: args.questionId },
  });
}

/** Réponse à une question. */
export async function grantCommunityAnswer(args: {
  userId: string;
  answerId: string;
  questionId: string;
  bodyLength: number;
  questionAuthorId: string;
}) {
  if (args.userId === args.questionAuthorId) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "self_action" as const,
    };
  }
  if (args.bodyLength < 30) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "too_short" as const,
    };
  }

  return grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_ANSWER,
    idempotencyKey: `community_answer:${args.answerId}`,
    meta: { answerId: args.answerId, questionId: args.questionId },
  });
}

/** Réponse acceptée (auteur de la réponse). */
export async function grantCommunityAnswerAccepted(args: {
  answerAuthorId: string;
  answerId: string;
  questionId: string;
}) {
  return grantWithDailyCap({
    userId: args.answerAuthorId,
    grantType: REWARD_GRANT.COMMUNITY_ANSWER_ACCEPTED,
    idempotencyKey: `community_answer_ok:${args.answerId}`,
    meta: { answerId: args.answerId, questionId: args.questionId },
    dailyCap: 10,
  });
}

/** Vote positif sur une réponse (auteur récompensé). */
export async function grantCommunityAnswerUpvote(args: {
  answerAuthorId: string;
  answerId: string;
  voterId: string;
}) {
  if (args.voterId === args.answerAuthorId) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.answerAuthorId),
    );
    return {
      granted: false,
      points: 0,
      balance: bal,
      reason: "self_action" as const,
    };
  }

  return grantWithDailyCap({
    userId: args.answerAuthorId,
    grantType: REWARD_GRANT.COMMUNITY_ANSWER_UPVOTE,
    idempotencyKey: `community_upvote:${args.answerId}:${args.voterId}`,
    meta: { answerId: args.answerId, voterId: args.voterId },
  });
}

/** Participation live Jitsi (session academy). */
export async function grantCommunityLiveJoin(args: {
  userId: string;
  sessionId: string;
}) {
  return grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_LIVE_JOIN,
    idempotencyKey: `community_live:${args.sessionId}:${args.userId}`,
    meta: { sessionId: args.sessionId },
  });
}

/** Publication d'un signal trading éducatif. */
export async function grantCommunitySignalPublish(args: {
  userId: string;
  signalId: string;
}) {
  return grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_SIGNAL_PUBLISH,
    idempotencyKey: `community_signal:${args.signalId}`,
    meta: { signalId: args.signalId },
  });
}

/** Signal clôturé avec succès. */
export async function grantCommunitySignalClosed(args: {
  userId: string;
  signalId: string;
  outcome: "win" | "loss" | "neutral";
}) {
  if (args.outcome !== "win") {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.userId),
    );
    return { granted: false, points: 0, balance: bal };
  }
  return grantWithDailyCap({
    userId: args.userId,
    grantType: REWARD_GRANT.COMMUNITY_SIGNAL_WIN,
    idempotencyKey: `community_signal_win:${args.signalId}`,
    meta: { signalId: args.signalId },
    dailyCap: 10,
  });
}

/** Suivre un trader (engagement follower). */
export async function grantCommunityTraderFollow(args: {
  followerId: string;
  traderId: string;
}) {
  return grantWithDailyCap({
    userId: args.followerId,
    grantType: REWARD_GRANT.COMMUNITY_TRADER_FOLLOW,
    idempotencyKey: `community_follow:${args.followerId}:${args.traderId}`,
    meta: { traderId: args.traderId },
  });
}

export type CommunityStoryKind = "text" | "image" | "video";

/** Publication statut 24h. */
export async function grantCommunityStoryPublished(args: {
  userId: string;
  storyId: string;
  kind: CommunityStoryKind;
}) {
  const grantType =
    args.kind === "video"
      ? REWARD_GRANT.COMMUNITY_STORY_VIDEO
      : args.kind === "image"
        ? REWARD_GRANT.COMMUNITY_STORY_IMAGE
        : REWARD_GRANT.COMMUNITY_STORY_TEXT;

  return grantWithDailyCap({
    userId: args.userId,
    grantType,
    idempotencyKey: `community_story:${args.storyId}`,
    meta: { storyId: args.storyId, kind: args.kind },
  });
}

/** Voir un statut (spectateur). */
export async function grantCommunityStoryViewed(args: {
  viewerId: string;
  storyId: string;
  authorId: string;
}) {
  if (args.viewerId === args.authorId) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.viewerId),
    );
    return { granted: false, points: 0, balance: bal, reason: "self_action" as const };
  }

  return grantWithDailyCap({
    userId: args.viewerId,
    grantType: REWARD_GRANT.COMMUNITY_STORY_VIEW,
    idempotencyKey: storyPairIdempotency("story_v", args.storyId, args.viewerId),
    meta: { storyId: args.storyId, authorId: args.authorId },
  });
}

/** Quelqu'un a vu votre statut. */
export async function grantCommunityStoryViewReceived(args: {
  authorId: string;
  storyId: string;
  viewerId: string;
}) {
  if (args.authorId === args.viewerId) {
    const bal = await import("@/lib/reward-points-service").then((m) =>
      m.getRewardPointsBalance(args.authorId),
    );
    return { granted: false, points: 0, balance: bal, reason: "self_action" as const };
  }

  return grantWithDailyCap({
    userId: args.authorId,
    grantType: REWARD_GRANT.COMMUNITY_STORY_VIEW_RECEIVED,
    idempotencyKey: storyPairIdempotency("story_v_rx", args.storyId, args.viewerId),
    meta: { storyId: args.storyId, viewerId: args.viewerId },
  });
}

/** Lead trader earns BP when a follower starts bot copy performance. */
export async function grantBotCopyLeadReward(args: {
  leadUserId: string;
  followerId: string;
  followId: string;
}) {
  return grantWithDailyCap({
    userId: args.leadUserId,
    grantType: REWARD_GRANT.BOT_COPY_LEAD,
    idempotencyKey: `bot_copy_lead:${args.followId}`,
    meta: {
      followerId: args.followerId,
      followId: args.followId,
    },
  });
}
