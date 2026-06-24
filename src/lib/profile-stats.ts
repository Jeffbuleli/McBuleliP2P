import { and, eq, or, sql } from "drizzle-orm";
import {
  communityUserProfiles,
  getDb,
  p2pOrderRatings,
  p2pOrders,
  userP2pPaymentMethods,
  users,
} from "@/db";
import type { Locale } from "@/i18n/locale";
import {
  formatPortfolioTotalWithStaking,
  getPortfolioSnapshotForUser,
} from "@/lib/portfolio-display";
import { getStakingValuationUsd } from "@/lib/staking-service";
import { numFromNumeric } from "@/lib/wallet-types";

const ST_RELEASED = "released";

export type ProfileDashboard = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  kycStatus: string;
  createdAt: Date;
  totalCompletedTrades: number;
  /** Average stars received on P2P (0 if none). */
  reputationScore: number;
  /** released / (released + cancelled + expired + disputed?) — simplified: completion among terminal orders */
  completionPct: number | null;
  portfolio: Awaited<ReturnType<typeof getPortfolioSnapshotForUser>>;
  communityHandle: string | null;
  referralBalanceUsdt: number;
  paymentMethodsCount: number;
  piLinked: boolean;
};

export async function getProfileDashboard(
  userId: string,
  locale: Locale,
): Promise<ProfileDashboard | null> {
  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      countryCode: users.countryCode,
      kycStatus: users.kycStatus,
      createdAt: users.createdAt,
      referralUsdtBalance: users.referralUsdtBalance,
      piUsername: users.piUsername,
      piUid: users.piUid,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const [completedRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.status, ST_RELEASED),
        or(eq(p2pOrders.makerId, userId), eq(p2pOrders.takerId, userId)),
      ),
    );

  const [ratingRow] = await db
    .select({
      avg: sql<number>`coalesce(round(avg(${p2pOrderRatings.stars})::numeric, 2), 0)`,
    })
    .from(p2pOrderRatings)
    .where(eq(p2pOrderRatings.toUserId, userId));

  const [terminalRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(p2pOrders)
    .where(or(eq(p2pOrders.makerId, userId), eq(p2pOrders.takerId, userId)));

  const completed = completedRow?.c ?? 0;
  const terminal = terminalRow?.c ?? 0;
  const completionPct =
    terminal > 0 ? Math.round((completed / terminal) * 1000) / 10 : null;

  const [communityRow] = await db
    .select({ handle: communityUserProfiles.handle })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);

  const [payRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(userP2pPaymentMethods)
    .where(
      and(eq(userP2pPaymentMethods.userId, userId), eq(userP2pPaymentMethods.active, true)),
    );

  let portfolio = await getPortfolioSnapshotForUser(userId, locale);
  if (portfolio) {
    const stakeVal = await getStakingValuationUsd(userId);
    portfolio = {
      ...portfolio,
      totalEquivDisplay: formatPortfolioTotalWithStaking(
        portfolio,
        stakeVal,
        locale,
      ),
    };
  }

  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName ?? null,
    avatarUrl: u.avatarUrl ?? null,
    countryCode: u.countryCode ?? null,
    kycStatus: u.kycStatus ?? "none",
    createdAt: u.createdAt,
    totalCompletedTrades: completed,
    reputationScore: Number(ratingRow?.avg ?? 0),
    completionPct,
    portfolio,
    communityHandle: communityRow?.handle ?? null,
    referralBalanceUsdt: numFromNumeric(u.referralUsdtBalance?.toString() ?? "0"),
    paymentMethodsCount: payRow?.c ?? 0,
    piLinked: Boolean(u.piUsername?.trim() || u.piUid?.trim()),
  };
}
