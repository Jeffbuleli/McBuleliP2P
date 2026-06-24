import { and, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { getDb, p2pAds, p2pOrderRatings, p2pOrders, users } from "@/db";
import { isKycApproved } from "@/lib/kyc-policy";
import { p2pDisplayName } from "@/lib/p2p-display";
import type { P2pAdStatus, P2pSide } from "@/lib/p2p-config";

const ST_RELEASED = "released";
const TERMINAL = ["released", "cancelled", "expired", "refunded"] as const;

export function p2pVerifiedMerchantThresholds() {
  return {
    minAvg: Number(process.env.P2P_VERIFIED_MIN_AVG ?? "4.5"),
    minRatingCount: Number(process.env.P2P_VERIFIED_MIN_COUNT ?? "10"),
    minTrades: Number(process.env.P2P_VERIFIED_MIN_TRADES ?? "20"),
  };
}

export function isP2pVerifiedMerchant(args: {
  kycApproved: boolean;
  ratingAvg: number;
  ratingCount: number;
  completedTrades: number;
}): boolean {
  const t = p2pVerifiedMerchantThresholds();
  return (
    args.kycApproved &&
    args.ratingAvg >= t.minAvg &&
    args.ratingCount >= t.minRatingCount &&
    args.completedTrades >= t.minTrades
  );
}

export function p2pOnlineThresholdMinutes(): number {
  const n = Number(process.env.P2P_ONLINE_MINUTES ?? "15");
  return Number.isFinite(n) && n >= 5 ? Math.floor(n) : 15;
}

export function isP2pUserOnline(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false;
  const ms = Date.now() - new Date(lastActiveAt).getTime();
  return ms >= 0 && ms <= p2pOnlineThresholdMinutes() * 60 * 1000;
}

/** Last P2P activity per user (maker or taker). */
export async function loadP2pLastActiveMap(userIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const uniq = [...new Set(userIds)].filter(Boolean);
  if (!uniq.length) return out;

  const db = getDb();
  const [makerRows, takerRows] = await Promise.all([
    db
      .select({
        userId: p2pOrders.makerId,
        lastAt: sql<Date>`max(${p2pOrders.updatedAt})`,
      })
      .from(p2pOrders)
      .where(inArray(p2pOrders.makerId, uniq))
      .groupBy(p2pOrders.makerId),
    db
      .select({
        userId: p2pOrders.takerId,
        lastAt: sql<Date>`max(${p2pOrders.updatedAt})`,
      })
      .from(p2pOrders)
      .where(inArray(p2pOrders.takerId, uniq))
      .groupBy(p2pOrders.takerId),
  ]);

  for (const rows of [makerRows, takerRows]) {
    for (const r of rows) {
      if (!r.lastAt) continue;
      const iso = new Date(r.lastAt).toISOString();
      const prev = out.get(r.userId);
      if (!prev || iso > prev) out.set(r.userId, iso);
    }
  }
  return out;
}

/** Median minutes from paid → release when user was seller. */
export async function loadSellerReleaseMedianMap(
  userIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const uniq = [...new Set(userIds)].filter(Boolean);
  if (!uniq.length) return out;

  const db = getDb();
  const rows = await db
    .select({
      sellerId: p2pOrders.sellerUserId,
      minutes: sql<number>`extract(epoch from (${p2pOrders.releasedAt} - ${p2pOrders.paidMarkedAt})) / 60.0`,
    })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.status, ST_RELEASED),
        inArray(p2pOrders.sellerUserId, uniq),
        sql`${p2pOrders.paidMarkedAt} is not null`,
        sql`${p2pOrders.releasedAt} is not null`,
      ),
    );

  const buckets = new Map<string, number[]>();
  for (const r of rows) {
    const m = Number(r.minutes);
    if (!Number.isFinite(m) || m < 0) continue;
    const arr = buckets.get(r.sellerId) ?? [];
    arr.push(m);
    buckets.set(r.sellerId, arr);
  }

  for (const [uid, vals] of buckets) {
    vals.sort((a, b) => a - b);
    const mid = Math.floor(vals.length / 2);
    out.set(
      uid,
      vals.length % 2 === 0 ? (vals[mid - 1]! + vals[mid]!) / 2 : vals[mid]!,
    );
  }
  return out;
}

async function loadUserTradeStats(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ status: p2pOrders.status })
    .from(p2pOrders)
    .where(or(eq(p2pOrders.makerId, userId), eq(p2pOrders.takerId, userId)));

  let completed = 0;
  let terminal = 0;
  for (const r of rows) {
    if ((TERMINAL as readonly string[]).includes(r.status)) terminal += 1;
    if (r.status === ST_RELEASED) completed += 1;
  }
  const completionRatePct =
    terminal > 0 ? Math.round((completed / terminal) * 1000) / 10 : null;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const volRows = await db
    .select({
      fiatCurrency: p2pOrders.fiatCurrency,
      fiatAmount: p2pOrders.fiatAmount,
    })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.status, ST_RELEASED),
        gte(p2pOrders.releasedAt, since),
        or(eq(p2pOrders.makerId, userId), eq(p2pOrders.takerId, userId)),
      ),
    );

  const volume30dByFiat: Record<string, number> = {};
  for (const v of volRows) {
    const cur = String(v.fiatCurrency);
    const amt = Number(v.fiatAmount);
    if (!Number.isFinite(amt)) continue;
    volume30dByFiat[cur] = (volume30dByFiat[cur] ?? 0) + amt;
  }

  return { completed, completionRatePct, volume30dByFiat };
}

export async function getP2pMerchantProfile(targetUserId: string) {
  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      piUsername: users.piUsername,
      kycStatus: users.kycStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!u) return null;

  const repRows = await db
    .select({
      avgStars: sql<number>`avg(${p2pOrderRatings.stars})::double precision`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(p2pOrderRatings)
    .where(eq(p2pOrderRatings.toUserId, targetUserId));

  const ratingAvg = repRows[0] ? Number(repRows[0].avgStars) : 0;
  const ratingCount = repRows[0] ? Number(repRows[0].cnt) : 0;

  const tradeStats = await loadUserTradeStats(targetUserId);
  const [lastActiveMap, releaseMap] = await Promise.all([
    loadP2pLastActiveMap([targetUserId]),
    loadSellerReleaseMedianMap([targetUserId]),
  ]);

  const kycApproved = isKycApproved(u.kycStatus);
  const verifiedMerchant = isP2pVerifiedMerchant({
    kycApproved,
    ratingAvg,
    ratingCount,
    completedTrades: tradeStats.completed,
  });

  const activeAds = await db
    .select()
    .from(p2pAds)
    .where(and(eq(p2pAds.userId, targetUserId), eq(p2pAds.status, "active")))
    .orderBy(desc(p2pAds.createdAt))
    .limit(20);

  const reviews = await db
    .select({
      stars: p2pOrderRatings.stars,
      comment: p2pOrderRatings.comment,
      createdAt: p2pOrderRatings.createdAt,
    })
    .from(p2pOrderRatings)
    .where(eq(p2pOrderRatings.toUserId, targetUserId))
    .orderBy(desc(p2pOrderRatings.createdAt))
    .limit(12);

  return {
    userId: u.id,
    displayName: p2pDisplayName(u),
    avatarUrl: u.avatarUrl,
    kycApproved,
    verifiedMerchant,
    rating: ratingCount > 0 ? { avg: ratingAvg, count: ratingCount } : null,
    completedTrades: tradeStats.completed,
    completionRatePct: tradeStats.completionRatePct,
    medianReleaseMinutes: releaseMap.get(targetUserId) ?? null,
    volume30dByFiat: tradeStats.volume30dByFiat,
    lastActiveAt: lastActiveMap.get(targetUserId) ?? null,
    online: isP2pUserOnline(lastActiveMap.get(targetUserId)),
    memberSince: u.createdAt.toISOString(),
    activeAds: activeAds.map((a) => ({
      id: a.id,
      side: a.side as P2pSide,
      asset: a.asset,
      fiatCurrency: a.fiatCurrency,
      price: a.price.toString(),
      minFiat: a.minFiat.toString(),
      maxFiat: a.maxFiat.toString(),
      terms: a.terms,
    })),
    reviews: reviews.map((r) => ({
      stars: r.stars,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function getP2pMakerDashboard(userId: string) {
  const db = getDb();
  const ads = await db.select().from(p2pAds).where(eq(p2pAds.userId, userId));

  let activeAds = 0;
  let pausedAds = 0;
  for (const a of ads) {
    if (a.status === "active") activeAds += 1;
    if (a.status === "paused") pausedAds += 1;
  }

  const openOrders = await db
    .select({ status: p2pOrders.status })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.makerId, userId),
        inArray(p2pOrders.status, ["awaiting_payment", "paid", "disputed"]),
      ),
    );

  const tradeStats = await loadUserTradeStats(userId);
  const [releaseMap, lastActiveMap] = await Promise.all([
    loadSellerReleaseMedianMap([userId]),
    loadP2pLastActiveMap([userId]),
  ]);

  const [u] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const repRows = await db
    .select({
      avgStars: sql<number>`avg(${p2pOrderRatings.stars})::double precision`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(p2pOrderRatings)
    .where(eq(p2pOrderRatings.toUserId, userId));

  const ratingAvg = repRows[0] ? Number(repRows[0].avgStars) : 0;
  const ratingCount = repRows[0] ? Number(repRows[0].cnt) : 0;
  const kycApproved = isKycApproved(u?.kycStatus);

  return {
    activeAds,
    pausedAds,
    ordersInProgress: openOrders.length,
    completedTrades: tradeStats.completed,
    completionRatePct: tradeStats.completionRatePct,
    volume30dByFiat: tradeStats.volume30dByFiat,
    medianReleaseMinutes: releaseMap.get(userId) ?? null,
    lastActiveAt: lastActiveMap.get(userId) ?? null,
    rating: ratingCount > 0 ? { avg: ratingAvg, count: ratingCount } : null,
    verifiedMerchant: isP2pVerifiedMerchant({
      kycApproved,
      ratingAvg,
      ratingCount,
      completedTrades: tradeStats.completed,
    }),
  };
}
