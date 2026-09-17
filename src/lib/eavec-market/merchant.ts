import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  eavecMarketListings,
  eavecMarketOrders,
  eavecMarketRatings,
  users,
} from "@/db";
import { isKycApproved } from "@/lib/kyc-policy";
import { listEavecMarketListings } from "@/lib/eavec-market/service";

export type EavecMerchantProfile = {
  userId: string;
  displayName: string | null;
  kycApproved: boolean;
  salesCompleted: number;
  openDisputes: number;
  ratingAvg: number;
  ratingCount: number;
  trustedMerchant: boolean;
  activeListings: number;
};

export function eavecTrustedMerchantThresholds() {
  return {
    minAvg: Number(process.env.EAVEC_MERCHANT_MIN_AVG ?? "4"),
    minRatingCount: Number(process.env.EAVEC_MERCHANT_MIN_COUNT ?? "3"),
    minSales: Number(process.env.EAVEC_MERCHANT_MIN_SALES ?? "5"),
  };
}

export function isEavecTrustedMerchant(args: {
  kycApproved: boolean;
  ratingAvg: number;
  ratingCount: number;
  salesCompleted: number;
}): boolean {
  const t = eavecTrustedMerchantThresholds();
  return (
    args.kycApproved &&
    args.ratingAvg >= t.minAvg &&
    args.ratingCount >= t.minRatingCount &&
    args.salesCompleted >= t.minSales
  );
}

export async function getEavecMerchantProfile(
  userId: string,
): Promise<EavecMerchantProfile | null> {
  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const [salesRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(eavecMarketOrders)
    .where(
      and(
        eq(eavecMarketOrders.sellerUserId, userId),
        eq(eavecMarketOrders.status, "released"),
      ),
    );

  const [disputeRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(eavecMarketOrders)
    .where(
      and(
        eq(eavecMarketOrders.sellerUserId, userId),
        eq(eavecMarketOrders.status, "disputed"),
      ),
    );

  const [listingRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(eavecMarketListings)
    .where(
      and(
        eq(eavecMarketListings.sellerUserId, userId),
        eq(eavecMarketListings.status, "available"),
      ),
    );

  const [rep] = await db
    .select({
      avgStars: sql<number>`coalesce(avg(${eavecMarketRatings.stars}), 0)::double precision`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(eavecMarketRatings)
    .where(eq(eavecMarketRatings.toUserId, userId));

  const salesCompleted = Number(salesRow?.c ?? 0);
  const openDisputes = Number(disputeRow?.c ?? 0);
  const activeListings = Number(listingRow?.c ?? 0);
  const ratingAvg = Number(rep?.avgStars ?? 0);
  const ratingCount = Number(rep?.cnt ?? 0);
  const kycApproved = isKycApproved(u.kycStatus);

  return {
    userId: u.id,
    displayName: u.displayName,
    kycApproved,
    salesCompleted,
    openDisputes,
    ratingAvg: ratingCount > 0 ? Math.round(ratingAvg * 10) / 10 : 0,
    ratingCount,
    trustedMerchant: isEavecTrustedMerchant({
      kycApproved,
      ratingAvg,
      ratingCount,
      salesCompleted,
    }),
    activeListings,
  };
}

export async function loadEavecSellerRatingMap(
  sellerIds: string[],
): Promise<Map<string, { avg: number; count: number }>> {
  const out = new Map<string, { avg: number; count: number }>();
  const uniq = [...new Set(sellerIds)].filter(Boolean);
  if (!uniq.length) return out;

  const db = getDb();
  const rows = await db
    .select({
      toUserId: eavecMarketRatings.toUserId,
      avgStars: sql<number>`avg(${eavecMarketRatings.stars})::double precision`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(eavecMarketRatings)
    .where(inArray(eavecMarketRatings.toUserId, uniq))
    .groupBy(eavecMarketRatings.toUserId);

  for (const r of rows) {
    const count = Number(r.cnt ?? 0);
    const avg = Number(r.avgStars ?? 0);
    out.set(r.toUserId, {
      avg: count > 0 ? Math.round(avg * 10) / 10 : 0,
      count,
    });
  }
  return out;
}

export async function rateEavecMarketOrder(args: {
  orderId: string;
  fromUserId: string;
  stars: number;
  comment?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const stars = Math.floor(args.stars);
  if (stars < 1 || stars > 5) return { ok: false, error: "eavec_market_bad_stars" };

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const [o] = await tx
        .select()
        .from(eavecMarketOrders)
        .where(eq(eavecMarketOrders.id, args.orderId))
        .limit(1);
      if (!o) throw new Error("eavec_market_order_not_found");
      if (o.status !== "released") throw new Error("eavec_market_bad_status");
      if (o.buyerUserId !== args.fromUserId) throw new Error("forbidden");

      const [existing] = await tx
        .select({ id: eavecMarketRatings.id })
        .from(eavecMarketRatings)
        .where(
          and(
            eq(eavecMarketRatings.orderId, o.id),
            eq(eavecMarketRatings.fromUserId, args.fromUserId),
          ),
        )
        .limit(1);
      if (existing) throw new Error("eavec_market_already_rated");

      await tx.insert(eavecMarketRatings).values({
        orderId: o.id,
        fromUserId: args.fromUserId,
        toUserId: o.sellerUserId,
        stars,
        comment: args.comment?.trim().slice(0, 500) || null,
      });
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "eavec_market_rate_failed";
    return { ok: false, error: msg };
  }
}

export async function getEavecMerchantDashboard(userId: string) {
  const profile = await getEavecMerchantProfile(userId);
  if (!profile) return null;

  const db = getDb();
  const disputed = await db
    .select()
    .from(eavecMarketOrders)
    .where(
      and(
        eq(eavecMarketOrders.sellerUserId, userId),
        eq(eavecMarketOrders.status, "disputed"),
      ),
    )
    .orderBy(desc(eavecMarketOrders.disputedAt))
    .limit(20);

  const recentSales = await db
    .select()
    .from(eavecMarketOrders)
    .where(
      and(
        eq(eavecMarketOrders.sellerUserId, userId),
        eq(eavecMarketOrders.status, "released"),
      ),
    )
    .orderBy(desc(eavecMarketOrders.releasedAt))
    .limit(10);

  const listings = (await listEavecMarketListings({ mineUserId: userId })).listings;

  return {
    profile,
    disputedOrders: disputed.map((o) => ({
      id: o.id,
      listingTitle: o.listingTitle,
      totalAmount: String(o.totalAmount),
      currency: o.currency,
      disputeReason: o.disputeReason,
      disputedAt: o.disputedAt?.toISOString() ?? null,
    })),
    recentSales: recentSales.map((o) => ({
      id: o.id,
      listingTitle: o.listingTitle,
      totalAmount: String(o.totalAmount),
      currency: o.currency,
      releasedAt: o.releasedAt?.toISOString() ?? null,
    })),
    listings,
  };
}
