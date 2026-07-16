import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { buildersMemberships, getDb, users } from "@/db";
import { isValidAddressForNetwork } from "@/lib/address-format";
import {
  BUILDERS_BADGE_MONTHS,
  BUILDERS_MEMBERSHIP_STATUS,
  BUILDERS_TIER_RANK,
  getBuildersPublicCatalog,
  isBuildersProgramEnabled,
  isBuildersTier,
  type BuildersMembershipStatus,
  type BuildersTier,
} from "@/lib/builders/builders-config";
import { quoteBuildersTier } from "@/lib/builders/builders-pricing";
import { ensureBuildersSchema } from "@/lib/builders/builders-schema";

export type BuildersMembershipRow = {
  id: string;
  tier: BuildersTier;
  status: BuildersMembershipStatus;
  paidMcb: string;
  paidUsdNotional: string | null;
  mcbUsdRate: string | null;
  feePerksUnlocked: boolean;
  paymentKind: string;
  walletAddress: string | null;
  txHash: string | null;
  rejectReason: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

function mapRow(
  r: typeof buildersMemberships.$inferSelect,
): BuildersMembershipRow {
  return {
    id: r.id,
    tier: r.tier as BuildersTier,
    status: r.status as BuildersMembershipStatus,
    paidMcb: r.paidMcb?.toString?.() ?? String(r.paidMcb),
    paidUsdNotional: r.paidUsdNotional?.toString?.() ?? null,
    mcbUsdRate: r.mcbUsdRate?.toString?.() ?? null,
    feePerksUnlocked: Boolean(r.feePerksUnlocked),
    paymentKind: r.paymentKind,
    walletAddress: r.walletAddress,
    txHash: r.txHash,
    rejectReason: r.rejectReason,
    startsAt: r.startsAt?.toISOString() ?? null,
    expiresAt: r.expiresAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

/** Mark past-due actives as expired (lazy). */
async function expireStaleMemberships(userId?: string): Promise<void> {
  const db = getDb();
  const conditions = [
    eq(buildersMemberships.status, BUILDERS_MEMBERSHIP_STATUS.ACTIVE),
    sql`${buildersMemberships.expiresAt} IS NOT NULL`,
    sql`${buildersMemberships.expiresAt} < now()`,
  ];
  if (userId) {
    conditions.push(eq(buildersMemberships.userId, userId));
  }
  await db
    .update(buildersMemberships)
    .set({ status: BUILDERS_MEMBERSHIP_STATUS.EXPIRED })
    .where(and(...conditions));
}

export async function getActiveBuildersMembership(
  userId: string,
): Promise<BuildersMembershipRow | null> {
  await expireStaleMemberships(userId);
  const db = getDb();
  const [row] = await db
    .select()
    .from(buildersMemberships)
    .where(
      and(
        eq(buildersMemberships.userId, userId),
        eq(buildersMemberships.status, BUILDERS_MEMBERSHIP_STATUS.ACTIVE),
        gt(buildersMemberships.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(buildersMemberships.startsAt))
    .limit(1);
  return row ? mapRow(row) : null;
}

/** Batch lookup for feed author chips — one query for many users. */
export async function getActiveBuildersTiersMap(
  userIds: string[],
): Promise<Map<string, BuildersTier>> {
  const uniq = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, BuildersTier>();
  if (!uniq.length) return map;

  await expireStaleMemberships();
  const db = getDb();
  const rows = await db
    .select({
      userId: buildersMemberships.userId,
      tier: buildersMemberships.tier,
      startsAt: buildersMemberships.startsAt,
    })
    .from(buildersMemberships)
    .where(
      and(
        inArray(buildersMemberships.userId, uniq),
        eq(buildersMemberships.status, BUILDERS_MEMBERSHIP_STATUS.ACTIVE),
        gt(buildersMemberships.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(buildersMemberships.startsAt));

  for (const r of rows) {
    if (map.has(r.userId)) continue;
    if (isBuildersTier(r.tier)) map.set(r.userId, r.tier);
  }
  return map;
}

export async function getPendingBuildersMembership(
  userId: string,
): Promise<BuildersMembershipRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(buildersMemberships)
    .where(
      and(
        eq(buildersMemberships.userId, userId),
        eq(buildersMemberships.status, BUILDERS_MEMBERSHIP_STATUS.PENDING),
      ),
    )
    .orderBy(desc(buildersMemberships.createdAt))
    .limit(1);
  return row ? mapRow(row) : null;
}

export async function getBuildersSummary(userId: string) {
  await ensureBuildersSchema();
  const [active, pending, catalog] = await Promise.all([
    getActiveBuildersMembership(userId),
    getPendingBuildersMembership(userId),
    Promise.resolve(getBuildersPublicCatalog()),
  ]);

  const db = getDb();
  const [user] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const history = await db
    .select()
    .from(buildersMemberships)
    .where(eq(buildersMemberships.userId, userId))
    .orderBy(desc(buildersMemberships.createdAt))
    .limit(10);

  return {
    catalog,
    kycApproved: user?.kycStatus === "approved",
    active,
    pending,
    history: history.map(mapRow),
  };
}

export async function requestBuildersPurchase(args: {
  userId: string;
  tier: string;
  txHash: string;
  walletAddress?: string;
}): Promise<
  | { ok: true; membership: BuildersMembershipRow }
  | { ok: false; code: string }
> {
  await ensureBuildersSchema();
  if (!isBuildersProgramEnabled()) {
    return { ok: false, code: "builders_disabled" };
  }
  if (!isBuildersTier(args.tier)) {
    return { ok: false, code: "builders_invalid_tier" };
  }
  const tier = args.tier;
  const txHash = args.txHash.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { ok: false, code: "builders_invalid_tx" };
  }

  const wallet = args.walletAddress?.trim() || null;
  if (wallet && !isValidAddressForNetwork(wallet, "BEP20")) {
    return { ok: false, code: "builders_invalid_address" };
  }

  const db = getDb();
  const [user] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  if (!user) return { ok: false, code: "builders_user_not_found" };
  if (user.kycStatus !== "approved") {
    return { ok: false, code: "builders_kyc_required" };
  }

  const pending = await getPendingBuildersMembership(args.userId);
  if (pending) {
    return { ok: false, code: "builders_pending_exists" };
  }

  const active = await getActiveBuildersMembership(args.userId);
  if (active) {
    const currentRank = BUILDERS_TIER_RANK[active.tier];
    const nextRank = BUILDERS_TIER_RANK[tier];
    if (nextRank <= currentRank) {
      return { ok: false, code: "builders_tier_not_upgrade" };
    }
  }

  const [dupTx] = await db
    .select({ id: buildersMemberships.id })
    .from(buildersMemberships)
    .where(
      and(
        eq(buildersMemberships.txHash, txHash),
        inArray(buildersMemberships.status, [
          BUILDERS_MEMBERSHIP_STATUS.PENDING,
          BUILDERS_MEMBERSHIP_STATUS.ACTIVE,
        ]),
      ),
    )
    .limit(1);
  if (dupTx) {
    return { ok: false, code: "builders_tx_used" };
  }

  const quote = quoteBuildersTier(tier);
  if (quote.priceMcb == null || quote.mcbUsdRate == null) {
    return { ok: false, code: "builders_mcb_rate_unavailable" };
  }

  const [inserted] = await db
    .insert(buildersMemberships)
    .values({
      userId: args.userId,
      tier,
      status: BUILDERS_MEMBERSHIP_STATUS.PENDING,
      paidMcb: String(quote.priceMcb),
      paidUsdNotional: String(quote.priceUsd),
      mcbUsdRate: String(quote.mcbUsdRate),
      feePerksUnlocked: quote.feePerksUnlocked,
      paymentKind: "onchain_tx",
      walletAddress: wallet,
      txHash,
    })
    .returning();

  return { ok: true, membership: mapRow(inserted) };
}

export async function listAdminBuildersMemberships(args?: {
  status?: BuildersMembershipStatus;
  limit?: number;
}) {
  await ensureBuildersSchema();
  await expireStaleMemberships();
  const db = getDb();
  const limit = args?.limit ?? 50;
  const conditions = args?.status
    ? eq(buildersMemberships.status, args.status)
    : undefined;

  const rows = await db
    .select({
      id: buildersMemberships.id,
      userId: buildersMemberships.userId,
      userEmail: users.email,
      tier: buildersMemberships.tier,
      status: buildersMemberships.status,
      paidMcb: buildersMemberships.paidMcb,
      walletAddress: buildersMemberships.walletAddress,
      txHash: buildersMemberships.txHash,
      rejectReason: buildersMemberships.rejectReason,
      startsAt: buildersMemberships.startsAt,
      expiresAt: buildersMemberships.expiresAt,
      createdAt: buildersMemberships.createdAt,
    })
    .from(buildersMemberships)
    .innerJoin(users, eq(buildersMemberships.userId, users.id))
    .where(conditions)
    .orderBy(desc(buildersMemberships.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    tier: r.tier as BuildersTier,
    status: r.status as BuildersMembershipStatus,
    paidMcb: r.paidMcb?.toString?.() ?? String(r.paidMcb),
    walletAddress: r.walletAddress,
    txHash: r.txHash,
    rejectReason: r.rejectReason,
    startsAt: r.startsAt?.toISOString() ?? null,
    expiresAt: r.expiresAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function completeBuildersMembership(args: {
  membershipId: string;
  staffUserId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(buildersMemberships)
    .where(eq(buildersMemberships.id, args.membershipId))
    .limit(1);

  if (!row) return { ok: false, code: "builders_not_found" };
  if (row.status !== BUILDERS_MEMBERSHIP_STATUS.PENDING) {
    return { ok: false, code: "builders_not_pending" };
  }

  const now = new Date();
  const expiresAt = addMonths(now, BUILDERS_BADGE_MONTHS);

  await db.transaction(async (tx) => {
    await tx
      .update(buildersMemberships)
      .set({ status: BUILDERS_MEMBERSHIP_STATUS.CANCELLED })
      .where(
        and(
          eq(buildersMemberships.userId, row.userId),
          eq(buildersMemberships.status, BUILDERS_MEMBERSHIP_STATUS.ACTIVE),
        ),
      );

    await tx
      .update(buildersMemberships)
      .set({
        status: BUILDERS_MEMBERSHIP_STATUS.ACTIVE,
        startsAt: now,
        expiresAt,
        processedByUserId: args.staffUserId,
        processedAt: now,
      })
      .where(eq(buildersMemberships.id, args.membershipId));
  });

  return { ok: true };
}

export async function rejectBuildersMembership(args: {
  membershipId: string;
  reason: string;
  staffUserId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const reason = args.reason.trim().slice(0, 500);
  if (!reason) return { ok: false, code: "builders_reject_reason_required" };

  const db = getDb();
  const [row] = await db
    .select()
    .from(buildersMemberships)
    .where(eq(buildersMemberships.id, args.membershipId))
    .limit(1);

  if (!row) return { ok: false, code: "builders_not_found" };
  if (row.status !== BUILDERS_MEMBERSHIP_STATUS.PENDING) {
    return { ok: false, code: "builders_not_pending" };
  }

  await db
    .update(buildersMemberships)
    .set({
      status: BUILDERS_MEMBERSHIP_STATUS.REJECTED,
      rejectReason: reason,
      processedByUserId: args.staffUserId,
      processedAt: new Date(),
    })
    .where(eq(buildersMemberships.id, args.membershipId));

  return { ok: true };
}
