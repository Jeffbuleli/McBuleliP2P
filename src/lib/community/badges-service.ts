import { and, count, eq, sql } from "drizzle-orm";
import {
  communityBadges,
  communityTradingSignals,
  communityUserBadges,
  communityUserProfiles,
  getDb,
  tradeFuturesPositions,
} from "@/db";

export type CommunityBadgeView = {
  slug: string;
  labelFr: string;
  labelEn: string;
  iconKey: string;
  earnedAt?: string;
};

async function ensureBadge(userId: string, slug: string): Promise<void> {
  const db = getDb();
  const [badge] = await db
    .select({ id: communityBadges.id })
    .from(communityBadges)
    .where(eq(communityBadges.slug, slug))
    .limit(1);
  if (!badge) return;

  try {
    await db.insert(communityUserBadges).values({
      userId,
      badgeId: badge.id,
    });
  } catch {
    /* unique — already earned */
  }
}

export async function maybeAwardBadges(userId: string): Promise<void> {
  const db = getDb();

  const [profile] = await db
    .select({
      postsCount: communityUserProfiles.postsCount,
      reputationScore: communityUserProfiles.reputationScore,
    })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);

  if (!profile) return;

  if (profile.postsCount >= 5) {
    await ensureBadge(userId, "contributor");
  }

  const [closedSignals] = await db
    .select({ n: count() })
    .from(communityTradingSignals)
    .where(
      and(
        eq(communityTradingSignals.authorId, userId),
        eq(communityTradingSignals.status, "closed"),
      ),
    );
  if (Number(closedSignals?.n ?? 0) >= 3) {
    await ensureBadge(userId, "signal_pro");
  }

  const [pnlRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${tradeFuturesPositions.realizedPnlUsdt}::numeric), 0)`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        eq(tradeFuturesPositions.status, "closed"),
        eq(tradeFuturesPositions.isDemo, true),
      ),
    );

  const demoPnl = Number(pnlRow?.total ?? 0);
  if (profile.reputationScore >= 200 && demoPnl > 0) {
    await ensureBadge(userId, "top_trader");
  }
  if (profile.reputationScore >= 500) {
    await ensureBadge(userId, "mentor");
  }
}

export async function listUserBadges(userId: string): Promise<CommunityBadgeView[]> {
  const db = getDb();
  const rows = await db
    .select({
      slug: communityBadges.slug,
      labelFr: communityBadges.labelFr,
      labelEn: communityBadges.labelEn,
      iconKey: communityBadges.iconKey,
      earnedAt: communityUserBadges.earnedAt,
    })
    .from(communityUserBadges)
    .innerJoin(communityBadges, eq(communityUserBadges.badgeId, communityBadges.id))
    .where(eq(communityUserBadges.userId, userId))
    .orderBy(communityBadges.sortOrder);

  return rows.map((r) => ({
    slug: r.slug,
    labelFr: r.labelFr,
    labelEn: r.labelEn,
    iconKey: r.iconKey,
    earnedAt: r.earnedAt?.toISOString(),
  }));
}
