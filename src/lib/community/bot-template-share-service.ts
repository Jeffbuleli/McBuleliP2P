import { eq } from "drizzle-orm";
import { communityPosts, communityUserProfiles, getDb } from "@/db";
import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { getBotTemplate, type BotTemplateId } from "@/lib/bot-templates";
import { getBotInstanceStats } from "@/lib/bot-instance-stats-service";
import { communityEnabled } from "@/lib/community/config";
import {
  botTemplateShareBody,
  type BotTemplatePostMeta,
} from "@/lib/community/bot-template-post-meta";
import { mergeCommunityProfileMeta, parseCommunityProfileMeta } from "@/lib/community/profile-meta";
import { ensureCommunityProfile } from "@/lib/community/profile-service";
import { grantCommunityPostPublished } from "@/lib/community/rewards-service";
import type { FeedPostView } from "@/lib/community/feed-service";

export async function shareBotTemplateToFeed(args: {
  userId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  templateId: BotTemplateId;
}): Promise<
  | { ok: true; postId: string; post: FeedPostView }
  | { ok: false; error: string }
> {
  if (!communityEnabled()) return { ok: false, error: "community_disabled" };

  const template = getBotTemplate(args.templateId);
  if (!template || template.planId !== args.planId) {
    return { ok: false, error: "bots_invalid_plan" };
  }

  const author = await ensureCommunityProfile(args.userId);
  const stats = await getBotInstanceStats({
    userId: args.userId,
    planId: args.planId,
    billing: args.billing,
  });

  const meta: BotTemplatePostMeta = {
    v: 1,
    templateId: args.templateId,
    planId: args.planId,
    style: template.style,
    symbol: template.symbol,
    billing: args.billing,
    authorHandle: author.handle,
    stats: stats
      ? {
          tradeCount: stats.tradeCount,
          winRate: stats.winRate,
          runtimeDays: stats.runtimeDays,
          volumeUsdt: stats.volumeUsdt,
        }
      : undefined,
  };

  const body = botTemplateShareBody(meta, true);
  const db = getDb();
  const now = new Date();

  const [row] = await db
    .insert(communityPosts)
    .values({
      authorId: args.userId,
      body,
      postType: "text",
      contentKind: "bot_template",
      meta,
      status: "published",
      publishedAt: now,
    })
    .returning();

  if (!row) return { ok: false, error: "community_post_failed" };

  const [prof] = await db
    .select({ meta: communityUserProfiles.meta })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, args.userId))
    .limit(1);

  const nextMeta = mergeCommunityProfileMeta(prof?.meta, {
    showBotLeaderboard: true,
    botTemplatesPublished:
      (parseCommunityProfileMeta(prof?.meta).botTemplatesPublished ?? 0) + 1,
  });

  await db
    .update(communityUserProfiles)
    .set({
      meta: nextMeta,
      updatedAt: now,
    })
    .where(eq(communityUserProfiles.userId, args.userId));

  void grantCommunityPostPublished({
    userId: args.userId,
    postId: row.id,
    kind: "text",
    bodyLength: body.length,
  }).catch(() => {});

  const post: FeedPostView = {
    id: row.id,
    body: row.body,
    postType: row.postType,
    contentKind: "bot_template",
    botTemplateMeta: meta,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    shareCount: row.shareCount,
    viewCount: row.viewCount ?? 0,
    tipBpTotal: row.tipBpTotal ?? 0,
    tipMcbTotal: Number(row.tipMcbTotal ?? 0),
    boostedUntil: row.boostedUntil?.toISOString?.() ?? null,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    author,
    media: [],
    likedByMe: false,
  };

  return { ok: true, postId: row.id, post };
}
