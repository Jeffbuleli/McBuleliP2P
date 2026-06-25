import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  communityTraderFollows,
  communityTradingSignals,
  communityUserProfiles,
  getDb,
  tradeFuturesPositions,
  users,
} from "@/db";
import { listUserBadges, type CommunityBadgeView } from "@/lib/community/badges-service";
import { isFollowingTrader } from "@/lib/community/follows-service";
import { parseCommunityProfileMeta } from "@/lib/community/profile-meta";

export type TraderLeaderboardEntry = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  showKycBadge: boolean;
  reputationScore: number;
  followerCount: number;
  openSignals: number;
  closedSignals: number;
  signalWinRate: number | null;
  demoPnlUsdt: number;
  livePnlUsdt: number;
  badges: CommunityBadgeView[];
  isFollowing: boolean;
  copyTradingEnabled: boolean;
};

export async function getTraderLeaderboard(args: {
  viewerId: string | null;
  limit?: number;
}): Promise<TraderLeaderboardEntry[]> {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 30, 1), 50);

  const profiles = await db
    .select({
      userId: communityUserProfiles.userId,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      showKycBadge: communityUserProfiles.showKycBadge,
      reputationScore: communityUserProfiles.reputationScore,
      meta: communityUserProfiles.meta,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
    })
    .from(communityUserProfiles)
    .innerJoin(users, eq(users.id, communityUserProfiles.userId))
    .orderBy(desc(communityUserProfiles.reputationScore))
    .limit(limit);

  if (!profiles.length) return [];

  const userIds = profiles.map((p) => p.userId);

  const followerRows = await db
    .select({
      traderId: communityTraderFollows.traderId,
      n: count(),
    })
    .from(communityTraderFollows)
    .where(inArray(communityTraderFollows.traderId, userIds))
    .groupBy(communityTraderFollows.traderId);

  const followerMap = new Map(
    followerRows.map((r) => [r.traderId, Number(r.n)]),
  );

  const signalRows = await db
    .select({
      authorId: communityTradingSignals.authorId,
      status: communityTradingSignals.status,
      outcome: communityTradingSignals.outcome,
      n: count(),
    })
    .from(communityTradingSignals)
    .where(inArray(communityTradingSignals.authorId, userIds))
    .groupBy(
      communityTradingSignals.authorId,
      communityTradingSignals.status,
      communityTradingSignals.outcome,
    );

  const signalStats = new Map<
    string,
    { open: number; closed: number; wins: number }
  >();
  for (const r of signalRows) {
    const cur = signalStats.get(r.authorId) ?? { open: 0, closed: 0, wins: 0 };
    const n = Number(r.n);
    if (r.status === "open") cur.open += n;
    if (r.status === "closed") {
      cur.closed += n;
      if (r.outcome === "win") cur.wins += n;
    }
    signalStats.set(r.authorId, cur);
  }

  const pnlRows = await db
    .select({
      userId: tradeFuturesPositions.userId,
      total: sql<string>`coalesce(sum(${tradeFuturesPositions.realizedPnlUsdt}::numeric), 0)`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        inArray(tradeFuturesPositions.userId, userIds),
        eq(tradeFuturesPositions.status, "closed"),
        eq(tradeFuturesPositions.isDemo, true),
      ),
    )
    .groupBy(tradeFuturesPositions.userId);

  const livePnlRows = await db
    .select({
      userId: tradeFuturesPositions.userId,
      total: sql<string>`coalesce(sum(${tradeFuturesPositions.realizedPnlUsdt}::numeric), 0)`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        inArray(tradeFuturesPositions.userId, userIds),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        eq(tradeFuturesPositions.isDemo, false),
      ),
    )
    .groupBy(tradeFuturesPositions.userId);

  const pnlMap = new Map(
    pnlRows.map((r) => [r.userId, Number(r.total)]),
  );
  const livePnlMap = new Map(
    livePnlRows.map((r) => [r.userId, Number(r.total)]),
  );

  const entries: TraderLeaderboardEntry[] = [];
  for (const p of profiles) {
    const stats = signalStats.get(p.userId) ?? { open: 0, closed: 0, wins: 0 };
    const winRate =
      stats.closed > 0 ? Math.round((stats.wins / stats.closed) * 100) : null;
    const badges = await listUserBadges(p.userId);
    const following = await isFollowingTrader(args.viewerId, p.userId);
    const meta = parseCommunityProfileMeta(p.meta);

    entries.push({
      userId: p.userId,
      handle: p.handle,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      showKycBadge: p.showKycBadge && p.kycStatus === "approved",
      reputationScore: p.reputationScore,
      followerCount: followerMap.get(p.userId) ?? 0,
      openSignals: stats.open,
      closedSignals: stats.closed,
      signalWinRate: winRate,
      demoPnlUsdt: pnlMap.get(p.userId) ?? 0,
      livePnlUsdt: livePnlMap.get(p.userId) ?? 0,
      badges,
      isFollowing: following,
      copyTradingEnabled: meta.copyTradingEnabled === true,
    });
  }

  entries.sort((a, b) => {
    if (b.reputationScore !== a.reputationScore) {
      return b.reputationScore - a.reputationScore;
    }
    if (b.demoPnlUsdt !== a.demoPnlUsdt) {
      return b.demoPnlUsdt - a.demoPnlUsdt;
    }
    return b.followerCount - a.followerCount;
  });

  return entries;
}
