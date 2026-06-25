import { and, eq, inArray } from "drizzle-orm";
import {
  botInstances,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import type { BotPlanId } from "@/lib/bot-config";
import { getBotInstanceStats } from "@/lib/bot-instance-stats-service";
import { listUserBadges, type CommunityBadgeView } from "@/lib/community/badges-service";
import { isFollowingTrader } from "@/lib/community/follows-service";
import {
  countLeadCopyFollowers,
  isCopyingLead,
} from "@/lib/community/bot-copy-follow-service";
import { parseCommunityProfileMeta } from "@/lib/community/profile-meta";

export type BotLeaderboardEntry = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  showKycBadge: boolean;
  planId: BotPlanId;
  billing: "demo" | "live";
  tradeCount: number;
  winRate: number | null;
  runtimeDays: number;
  volumeUsdt: number;
  avgClosePnlPct: number | null;
  score: number;
  badges: CommunityBadgeView[];
  isFollowing: boolean;
  templatesPublished: number;
  copyTradingEnabled: boolean;
  isCopying: boolean;
  copyFollowerCount: number;
};

function leaderboardScore(stats: {
  tradeCount: number;
  winRate: number | null;
  runtimeDays: number;
  avgClosePnlPct: number | null;
}): number {
  const wr = stats.winRate ?? 0;
  const pnl = stats.avgClosePnlPct ?? 0;
  return (
    stats.tradeCount * 4 +
    wr * 0.6 +
    Math.min(stats.runtimeDays, 90) * 0.2 +
    Math.max(-20, Math.min(20, pnl)) * 2
  );
}

export async function getBotLeaderboard(args: {
  viewerId: string | null;
  billing?: "demo" | "live";
  limit?: number;
}): Promise<BotLeaderboardEntry[]> {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 30, 1), 50);
  const billingFilter = args.billing ?? "demo";

  const profiles = await db
    .select({
      userId: communityUserProfiles.userId,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      showKycBadge: communityUserProfiles.showKycBadge,
      meta: communityUserProfiles.meta,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
    })
    .from(communityUserProfiles)
    .innerJoin(users, eq(users.id, communityUserProfiles.userId));

  const optedIn = profiles.filter((p) => {
    const meta = parseCommunityProfileMeta(p.meta);
    return meta.showBotLeaderboard === true;
  });

  if (!optedIn.length) return [];

  const userIds = optedIn.map((p) => p.userId);
  const instanceRows = await db
    .select({
      userId: botInstances.userId,
      planId: botInstances.planId,
      billing: botInstances.billing,
    })
    .from(botInstances)
    .where(
      and(
        inArray(botInstances.userId, userIds),
        eq(botInstances.billing, billingFilter),
      ),
    );

  const profileMap = new Map(optedIn.map((p) => [p.userId, p]));
  const entries: BotLeaderboardEntry[] = [];

  for (const row of instanceRows) {
    const planId = row.planId as BotPlanId;
    const stats = await getBotInstanceStats({
      userId: row.userId,
      planId,
      billing: billingFilter,
    });
    if (!stats || stats.tradeCount < 1) continue;

    const p = profileMap.get(row.userId);
    if (!p) continue;

    const meta = parseCommunityProfileMeta(p.meta);
    const badges = await listUserBadges(row.userId);
    const following = await isFollowingTrader(args.viewerId, row.userId);
    const copying = await isCopyingLead(
      args.viewerId,
      row.userId,
      planId,
      billingFilter,
    );
    const copyFollowers = await countLeadCopyFollowers(row.userId);
    const score = leaderboardScore(stats);

    entries.push({
      userId: row.userId,
      handle: p.handle,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      showKycBadge: p.showKycBadge && p.kycStatus === "approved",
      planId,
      billing: billingFilter,
      tradeCount: stats.tradeCount,
      winRate: stats.winRate,
      runtimeDays: stats.runtimeDays,
      volumeUsdt: stats.volumeUsdt,
      avgClosePnlPct: stats.avgClosePnlPct,
      score,
      badges,
      isFollowing: following,
      templatesPublished: meta.botTemplatesPublished ?? 0,
      copyTradingEnabled: meta.copyTradingEnabled === true,
      isCopying: copying,
      copyFollowerCount: copyFollowers,
    });
  }

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.tradeCount - a.tradeCount;
  });

  const seen = new Set<string>();
  const deduped: BotLeaderboardEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.userId)) continue;
    seen.add(e.userId);
    deduped.push(e);
    if (deduped.length >= limit) break;
  }

  return deduped;
}
