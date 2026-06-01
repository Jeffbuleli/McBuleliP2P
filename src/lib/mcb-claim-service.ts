import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, mcbClaims, rewardPointLedger, users } from "@/db";
import { isValidAddressForNetwork } from "@/lib/address-format";
import {
  bpToMcbAmount,
  formatMcbAmount,
  getMcbClaimMinBp,
  getMcbClaimPublicConfig,
  isMcbClaimEnabled,
  MCB_CLAIM_STATUS,
  REWARD_BP_PER_MCB_CLAIM,
  type McbClaimStatus,
} from "@/lib/mcb-token-config";

export type McbClaimRow = {
  id: string;
  bpAmount: number;
  mcbAmount: string;
  walletAddress: string;
  status: McbClaimStatus;
  txHash: string | null;
  rejectReason: string | null;
  createdAt: string;
  completedAt: string | null;
};

function mapClaimRow(r: typeof mcbClaims.$inferSelect): McbClaimRow {
  return {
    id: r.id,
    bpAmount: r.bpAmount,
    mcbAmount: r.mcbAmount?.toString?.() ?? String(r.mcbAmount),
    walletAddress: r.walletAddress,
    status: r.status as McbClaimStatus,
    txHash: r.txHash,
    rejectReason: r.rejectReason,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}

export async function listUserMcbClaims(
  userId: string,
  limit = 20,
): Promise<McbClaimRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(mcbClaims)
    .where(eq(mcbClaims.userId, userId))
    .orderBy(desc(mcbClaims.createdAt))
    .limit(limit);
  return rows.map(mapClaimRow);
}

export async function getUserPendingMcbClaim(
  userId: string,
): Promise<McbClaimRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(mcbClaims)
    .where(
      and(
        eq(mcbClaims.userId, userId),
        eq(mcbClaims.status, MCB_CLAIM_STATUS.PENDING),
      ),
    )
    .orderBy(desc(mcbClaims.createdAt))
    .limit(1);
  return row ? mapClaimRow(row) : null;
}

export async function getMcbClaimSummary(userId: string) {
  const [claims, pending, config] = await Promise.all([
    listUserMcbClaims(userId, 10),
    getUserPendingMcbClaim(userId),
    Promise.resolve(getMcbClaimPublicConfig()),
  ]);

  const db = getDb();
  const [user] = await db
    .select({ kycStatus: users.kycStatus, balance: users.buleliPointsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const maxClaimBp =
    user && config.minBp > 0
      ? Math.floor(user.balance / config.minBp) * config.minBp
      : 0;

  return {
    config,
    kycApproved: user?.kycStatus === "approved",
    balance: user?.balance ?? 0,
    maxClaimBp,
    pending,
    claims,
  };
}

export async function requestMcbClaim(args: {
  userId: string;
  bpAmount: number;
  walletAddress: string;
}): Promise<
  { ok: true; claim: McbClaimRow; balance: number } | { ok: false; code: string }
> {
  if (!isMcbClaimEnabled()) {
    return { ok: false, code: "mcb_claim_disabled" };
  }

  const minBp = getMcbClaimMinBp();
  const bp = Math.floor(args.bpAmount);
  const wallet = args.walletAddress.trim();

  if (!Number.isFinite(bp) || bp < minBp) {
    return { ok: false, code: "mcb_claim_min_bp" };
  }
  if (bp % REWARD_BP_PER_MCB_CLAIM !== 0) {
    return { ok: false, code: "mcb_claim_bp_step" };
  }
  if (!isValidAddressForNetwork(wallet, "BEP20")) {
    return { ok: false, code: "mcb_claim_invalid_address" };
  }

  const db = getDb();
  const [user] = await db
    .select({
      kycStatus: users.kycStatus,
      balance: users.buleliPointsBalance,
    })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  if (!user) return { ok: false, code: "mcb_claim_user_not_found" };
  if (user.kycStatus !== "approved") {
    return { ok: false, code: "mcb_claim_kyc_required" };
  }
  if (user.balance < bp) {
    return { ok: false, code: "mcb_claim_insufficient_bp" };
  }

  const pending = await getUserPendingMcbClaim(args.userId);
  if (pending) {
    return { ok: false, code: "mcb_claim_pending_exists" };
  }

  const mcbAmount = formatMcbAmount(bp);

  try {
    const claim = await db.transaction(async (tx) => {
      const [deducted] = await tx
        .update(users)
        .set({
          buleliPointsBalance: sql`${users.buleliPointsBalance} - ${bp}`,
        })
        .where(
          and(
            eq(users.id, args.userId),
            sql`${users.buleliPointsBalance} >= ${bp}`,
          ),
        )
        .returning({ bal: users.buleliPointsBalance });

      if (!deducted) {
        throw new Error("mcb_claim_insufficient_bp");
      }

      const [inserted] = await tx
        .insert(mcbClaims)
        .values({
          userId: args.userId,
          bpAmount: bp,
          mcbAmount: String(bpToMcbAmount(bp)),
          walletAddress: wallet,
          status: MCB_CLAIM_STATUS.PENDING,
        })
        .returning();

      await tx.insert(rewardPointLedger).values({
        userId: args.userId,
        amount: -bp,
        grantType: null,
        note: `mcb_claim:${inserted.id}`,
        meta: { claimId: inserted.id, walletAddress: wallet },
      });

      return { row: inserted, balance: deducted.bal };
    });

    return {
      ok: true,
      claim: mapClaimRow(claim.row),
      balance: claim.balance,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "mcb_claim_failed";
    return { ok: false, code: msg };
  }
}

export async function listAdminMcbClaims(args?: {
  status?: McbClaimStatus;
  limit?: number;
}) {
  const db = getDb();
  const limit = args?.limit ?? 50;
  const conditions = args?.status
    ? eq(mcbClaims.status, args.status)
    : undefined;

  const rows = await db
    .select({
      id: mcbClaims.id,
      userId: mcbClaims.userId,
      userEmail: users.email,
      bpAmount: mcbClaims.bpAmount,
      mcbAmount: mcbClaims.mcbAmount,
      walletAddress: mcbClaims.walletAddress,
      status: mcbClaims.status,
      txHash: mcbClaims.txHash,
      rejectReason: mcbClaims.rejectReason,
      createdAt: mcbClaims.createdAt,
      completedAt: mcbClaims.completedAt,
    })
    .from(mcbClaims)
    .innerJoin(users, eq(mcbClaims.userId, users.id))
    .where(conditions)
    .orderBy(desc(mcbClaims.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    bpAmount: r.bpAmount,
    mcbAmount: r.mcbAmount?.toString?.() ?? String(r.mcbAmount),
    walletAddress: r.walletAddress,
    status: r.status as McbClaimStatus,
    txHash: r.txHash,
    rejectReason: r.rejectReason,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));
}

export async function completeMcbClaim(args: {
  claimId: string;
  txHash: string;
  staffUserId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const txHash = args.txHash.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { ok: false, code: "mcb_claim_invalid_tx" };
  }

  const db = getDb();
  const [claim] = await db
    .select()
    .from(mcbClaims)
    .where(eq(mcbClaims.id, args.claimId))
    .limit(1);

  if (!claim) return { ok: false, code: "mcb_claim_not_found" };
  if (claim.status !== MCB_CLAIM_STATUS.PENDING) {
    return { ok: false, code: "mcb_claim_not_pending" };
  }

  await db
    .update(mcbClaims)
    .set({
      status: MCB_CLAIM_STATUS.COMPLETED,
      txHash,
      processedByUserId: args.staffUserId,
      completedAt: new Date(),
    })
    .where(eq(mcbClaims.id, args.claimId));

  return { ok: true };
}

export async function rejectMcbClaim(args: {
  claimId: string;
  reason: string;
  staffUserId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const reason = args.reason.trim().slice(0, 500);
  if (!reason) return { ok: false, code: "mcb_claim_reject_reason_required" };

  const db = getDb();

  try {
    await db.transaction(async (tx) => {
      const [claim] = await tx
        .select()
        .from(mcbClaims)
        .where(eq(mcbClaims.id, args.claimId))
        .limit(1);

      if (!claim) throw new Error("mcb_claim_not_found");
      if (claim.status !== MCB_CLAIM_STATUS.PENDING) {
        throw new Error("mcb_claim_not_pending");
      }

      await tx
        .update(mcbClaims)
        .set({
          status: MCB_CLAIM_STATUS.REJECTED,
          rejectReason: reason,
          processedByUserId: args.staffUserId,
          completedAt: new Date(),
        })
        .where(eq(mcbClaims.id, args.claimId));

      await tx
        .update(users)
        .set({
          buleliPointsBalance: sql`${users.buleliPointsBalance} + ${claim.bpAmount}`,
        })
        .where(eq(users.id, claim.userId));

      await tx.insert(rewardPointLedger).values({
        userId: claim.userId,
        amount: claim.bpAmount,
        grantType: null,
        note: `mcb_claim_refund:${claim.id}`,
        meta: { claimId: claim.id, reason },
      });
    });

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "mcb_claim_reject_failed";
    return { ok: false, code: msg };
  }
}
