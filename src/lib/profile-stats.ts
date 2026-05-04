import { and, eq, or, sql } from "drizzle-orm";
import { getDb, p2pOrderRatings, p2pOrders, users } from "@/db";
import type { Locale } from "@/i18n/locale";
import { getPortfolioSnapshotForUser } from "@/lib/portfolio-display";

const ST_RELEASED = "released";

export type ProfileDashboard = {
  id: string;
  email: string;
  countryCode: string | null;
  kycStatus: string;
  createdAt: Date;
  totalCompletedTrades: number;
  /** Average stars received on P2P (0 if none). */
  reputationScore: number;
  /** released / (released + cancelled + expired + disputed?) — simplified: completion among terminal orders */
  completionPct: number | null;
  portfolio: Awaited<ReturnType<typeof getPortfolioSnapshotForUser>>;
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
      countryCode: users.countryCode,
      kycStatus: users.kycStatus,
      createdAt: users.createdAt,
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

  const portfolio = await getPortfolioSnapshotForUser(userId, locale);

  return {
    id: u.id,
    email: u.email,
    countryCode: u.countryCode ?? null,
    kycStatus: u.kycStatus ?? "none",
    createdAt: u.createdAt,
    totalCompletedTrades: completed,
    reputationScore: Number(ratingRow?.avg ?? 0),
    completionPct,
    portfolio,
  };
}
