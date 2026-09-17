import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb, eavecMarketListings, users } from "@/db";
import {
  EAVEC_MARKET_IMAGE_MAX_CHARS,
  isEavecMarketCategory,
  type EavecMarketCategory,
  type EavecMarketCurrency,
  type EavecMarketKind,
  type EavecMarketListingStatus,
} from "@/lib/eavec-market/categories";

export type EavecMarketListingRow = {
  id: string;
  sellerUserId: string;
  sellerDisplayName: string | null;
  sellerRatingAvg: number | null;
  sellerRatingCount: number;
  sellerTrusted: boolean;
  groupId: string | null;
  title: string;
  description: string | null;
  category: EavecMarketCategory;
  currency: EavecMarketCurrency;
  price: string;
  quantity: number;
  locationLabel: string | null;
  countryCode: string | null;
  imageUrl: string | null;
  status: EavecMarketListingStatus;
  kind: EavecMarketKind;
  createdAt: string;
  updatedAt: string;
};

function mapRow(
  r: typeof eavecMarketListings.$inferSelect & {
    sellerDisplayName?: string | null;
    sellerRatingAvg?: number | null;
    sellerRatingCount?: number;
    sellerTrusted?: boolean;
  },
): EavecMarketListingRow {
  return {
    id: r.id,
    sellerUserId: r.sellerUserId,
    sellerDisplayName: r.sellerDisplayName ?? null,
    sellerRatingAvg: r.sellerRatingAvg ?? null,
    sellerRatingCount: r.sellerRatingCount ?? 0,
    sellerTrusted: Boolean(r.sellerTrusted),
    groupId: r.groupId,
    title: r.title,
    description: r.description,
    category: r.category as EavecMarketCategory,
    currency: (r.currency === "CDF" ? "CDF" : "USD") as EavecMarketCurrency,
    price: String(r.price),
    quantity: r.quantity,
    locationLabel: r.locationLabel,
    countryCode: r.countryCode,
    imageUrl: r.imageUrl,
    status: r.status as EavecMarketListingStatus,
    kind: (r.kind === "service" ? "service" : "product") as EavecMarketKind,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function sanitizeImageUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  if (s.length > EAVEC_MARKET_IMAGE_MAX_CHARS) {
    throw new Error("eavec_market_image_too_large");
  }
  if (s.startsWith("data:image/") || s.startsWith("https://") || s.startsWith("/")) {
    return s;
  }
  throw new Error("eavec_market_image_invalid");
}

export async function listEavecMarketListings(args: {
  q?: string;
  category?: string;
  limit?: number;
  offset?: number;
  mineUserId?: string;
}): Promise<{ listings: EavecMarketListingRow[]; total: number }> {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 24, 1), 50);
  const offset = Math.max(args.offset ?? 0, 0);

  const filters = [];
  if (args.mineUserId) {
    filters.push(eq(eavecMarketListings.sellerUserId, args.mineUserId));
  } else {
    filters.push(eq(eavecMarketListings.status, "available"));
  }
  if (args.category && isEavecMarketCategory(args.category)) {
    filters.push(eq(eavecMarketListings.category, args.category));
  }
  if (args.q?.trim()) {
    const term = `%${args.q.trim()}%`;
    filters.push(
      or(
        ilike(eavecMarketListings.title, term),
        ilike(eavecMarketListings.description, term),
        ilike(eavecMarketListings.locationLabel, term),
      )!,
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(eavecMarketListings)
    .where(where);

  const rows = await db
    .select({
      listing: eavecMarketListings,
      sellerDisplayName: users.displayName,
    })
    .from(eavecMarketListings)
    .leftJoin(users, eq(users.id, eavecMarketListings.sellerUserId))
    .where(where)
    .orderBy(desc(eavecMarketListings.createdAt))
    .limit(limit)
    .offset(offset);

  const sellerIds = rows.map((r) => r.listing.sellerUserId);
  const { loadEavecSellerRatingMap } = await import("@/lib/eavec-market/merchant");
  const ratingMap = await loadEavecSellerRatingMap(sellerIds);

  return {
    total: countRow?.n ?? 0,
    listings: rows.map((r) => {
      const rep = ratingMap.get(r.listing.sellerUserId);
      const ratingAvg = rep?.avg ?? 0;
      const ratingCount = rep?.count ?? 0;
      return mapRow({
        ...r.listing,
        sellerDisplayName: r.sellerDisplayName,
        sellerRatingAvg: ratingCount > 0 ? ratingAvg : null,
        sellerRatingCount: ratingCount,
        sellerTrusted: false,
      });
    }),
  };
}

export async function getEavecMarketListing(
  id: string,
): Promise<EavecMarketListingRow | null> {
  const db = getDb();
  const [row] = await db
    .select({
      listing: eavecMarketListings,
      sellerDisplayName: users.displayName,
    })
    .from(eavecMarketListings)
    .leftJoin(users, eq(users.id, eavecMarketListings.sellerUserId))
    .where(eq(eavecMarketListings.id, id))
    .limit(1);
  if (!row) return null;
  const base = mapRow({ ...row.listing, sellerDisplayName: row.sellerDisplayName });
  const profile = await (
    await import("@/lib/eavec-market/merchant")
  ).getEavecMerchantProfile(base.sellerUserId);
  if (!profile) return base;
  return {
    ...base,
    sellerRatingAvg: profile.ratingCount > 0 ? profile.ratingAvg : null,
    sellerRatingCount: profile.ratingCount,
    sellerTrusted: profile.trustedMerchant,
  };
}

export async function createEavecMarketListing(args: {
  sellerUserId: string;
  title: string;
  description?: string | null;
  category: string;
  currency: string;
  price: string;
  quantity?: number;
  locationLabel?: string | null;
  countryCode?: string | null;
  imageUrl?: string | null;
  kind?: string;
  groupId?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isEavecMarketCategory(args.category)) {
    return { ok: false, error: "eavec_market_bad_category" };
  }
  const title = args.title.trim().slice(0, 120);
  if (title.length < 2) return { ok: false, error: "eavec_market_bad_title" };

  const currency =
    args.currency.toUpperCase() === "CDF" ? "CDF" : ("USD" as const);
  const priceNum = Number(args.price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return { ok: false, error: "eavec_market_bad_price" };
  }
  const quantity = Math.min(Math.max(Math.floor(args.quantity ?? 1), 1), 9999);
  const kind = args.kind === "service" ? "service" : "product";

  let imageUrl: string | null;
  try {
    imageUrl = sanitizeImageUrl(args.imageUrl);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "eavec_market_image_invalid",
    };
  }

  const db = getDb();
  const [created] = await db
    .insert(eavecMarketListings)
    .values({
      sellerUserId: args.sellerUserId,
      groupId: args.groupId ?? null,
      title,
      description: args.description?.trim().slice(0, 2000) || null,
      category: args.category,
      currency,
      price: priceNum.toFixed(2),
      quantity,
      locationLabel: args.locationLabel?.trim().slice(0, 128) || null,
      countryCode: args.countryCode?.trim().toUpperCase().slice(0, 8) || null,
      imageUrl,
      status: "available",
      kind,
    })
    .returning({ id: eavecMarketListings.id });

  if (!created) return { ok: false, error: "eavec_market_create_failed" };
  return { ok: true, id: created.id };
}

export async function updateEavecMarketListingStatus(args: {
  id: string;
  sellerUserId: string;
  status: EavecMarketListingStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowed: EavecMarketListingStatus[] = [
    "available",
    "paused",
    "sold",
    "closed",
  ];
  if (!allowed.includes(args.status)) {
    return { ok: false, error: "eavec_market_bad_status" };
  }
  const db = getDb();
  const updated = await db
    .update(eavecMarketListings)
    .set({ status: args.status, updatedAt: new Date() })
    .where(
      and(
        eq(eavecMarketListings.id, args.id),
        eq(eavecMarketListings.sellerUserId, args.sellerUserId),
      ),
    )
    .returning({ id: eavecMarketListings.id });
  if (!updated.length) return { ok: false, error: "eavec_market_not_found" };
  return { ok: true };
}
