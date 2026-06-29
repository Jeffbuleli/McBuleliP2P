import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import type { Locale } from "@/i18n/locale";
import {
  getAcademyLiveBadge,
  type AcademyLiveBadgeView,
  type AcademyViewerRole,
} from "@/lib/academy-service";
import { communityEnabled } from "@/lib/community/config";
import { getTraderLeaderboard, type TraderLeaderboardEntry } from "@/lib/community/leaderboard-service";
import { listUnifiedFeed, type UnifiedFeedItem } from "@/lib/community/unified-feed-service";
import { homeDisplayName, homeGreetingLine } from "@/lib/home-greeting";
import { isKycApproved, kycEnabled } from "@/lib/kyc-policy";
import { fetchMarketTickers, type MarketTicker } from "@/lib/market-tickers";
import { loadP2pHomeActivity, type P2pHomeActivity } from "@/lib/p2p-activity";
import { loadRecentActivity } from "@/lib/dashboard-activity";
import type { ActivityRow } from "@/components/mobile/recent-activity";
import {
  emptyPortfolioSnapshot,
  formatPortfolioTotalWithStaking,
  getPortfolioSnapshotForUser,
  type PortfolioSnapshot,
} from "@/lib/portfolio-display";
import { getStakingValuationUsd } from "@/lib/staking-service";

export type HomeHubData = {
  greeting: string;
  showKycCta: boolean;
  portfolio: PortfolioSnapshot;
  totalDisplay: string;
  assetChips: { code: string; balance: string }[];
  tickers: MarketTicker[] | null;
  trendingPosts: UnifiedFeedItem[];
  topTraders: TraderLeaderboardEntry[];
  p2p: P2pHomeActivity & { showFullCard: boolean };
  walletActivity: ActivityRow[];
  liveBadge: AcademyLiveBadgeView;
  showOnboarding: boolean;
};

export async function loadHomeHubData(args: {
  userId: string;
  locale: Locale;
  viewerRole: AcademyViewerRole;
}): Promise<HomeHubData> {
  const { userId, locale, viewerRole } = args;
  const lang = locale === "fr" ? "fr" : "en";
  const db = getDb();

  const userPromise = db
    .select({
      email: users.email,
      displayName: users.displayName,
      piUsername: users.piUsername,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [
    [userRow],
    snapshot,
    stakeVal,
    p2pHome,
    tickers,
    liveBadge,
    feedResult,
    traders,
    walletActivity,
  ] = await Promise.all([
    userPromise,
    getPortfolioSnapshotForUser(userId, locale),
    getStakingValuationUsd(userId),
    loadP2pHomeActivity({ userId, limit: 3 }).catch(() => ({
      items: [],
      inProgressCount: 0,
      disputedCount: 0,
    })),
    fetchMarketTickers(),
    getAcademyLiveBadge({ userId, locale, viewerRole }).catch(() => ({
      live: false,
      title: null,
      href: null,
    })),
    communityEnabled()
      ? listUnifiedFeed({ viewerId: userId, category: "trending", limit: 3 }).catch(
          () => ({ items: [] as UnifiedFeedItem[], nextCursor: null }),
        )
      : Promise.resolve({ items: [] as UnifiedFeedItem[], nextCursor: null }),
    communityEnabled()
      ? getTraderLeaderboard({ viewerId: userId, limit: 3 }).catch(
          () => [] as TraderLeaderboardEntry[],
        )
      : Promise.resolve([] as TraderLeaderboardEntry[]),
    loadRecentActivity(userId, locale, 5).catch(() => [] as ActivityRow[]),
  ]);

  const portfolio = snapshot ?? emptyPortfolioSnapshot(locale);
  const totalDisplay = snapshot
    ? formatPortfolioTotalWithStaking(snapshot, stakeVal, locale)
    : portfolio.totalEquivDisplay;

  const greeting = homeGreetingLine(
    lang,
    userRow ? homeDisplayName(userRow) : null,
  );

  const kycApproved = isKycApproved(userRow?.kycStatus);
  const showKycCta = kycEnabled() && !kycApproved;
  const totalUsd = snapshot?.totalEquivUsdt ?? 0;
  const showOnboarding = showKycCta || totalUsd < 1;

  const p2pShowFullCard =
    p2pHome.inProgressCount > 0 ||
    p2pHome.disputedCount > 0 ||
    p2pHome.items.length > 0;

  return {
    greeting,
    showKycCta,
    portfolio,
    totalDisplay,
    assetChips: [
      { code: "USDT", balance: portfolio.usdtDisplay },
      { code: "Pi", balance: portfolio.piDisplay },
      { code: "USD", balance: portfolio.usdBalanceDisplay },
    ],
    tickers: tickers?.slice(0, 8) ?? null,
    trendingPosts: feedResult.items.filter(
      (i) => i.kind === "news" || i.kind === "formation",
    ),
    topTraders: traders,
    p2p: { ...p2pHome, showFullCard: p2pShowFullCard },
    walletActivity,
    liveBadge,
    showOnboarding,
  };
}
