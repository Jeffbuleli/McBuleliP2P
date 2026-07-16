import { randomUUID } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  communityAdCampaigns,
  communityAdProducts,
  communityBrands,
  communityCreatorFundMonths,
  getDb,
  mcbCustodialAccounts,
  mcbCustodialLedger,
} from "@/db";
import { communityAdsEnabled } from "@/lib/community/config";
import { splitAdsSpendMcb } from "@/lib/community/ads-config";

export type McbAccountKind =
  | "user"
  | "brand"
  | "creator_fund"
  | "burn_queue"
  | "ops_treasury";

export type McbSpendResult =
  | {
      ok: true;
      batchId: string;
      spent: number;
      split: ReturnType<typeof splitAdsSpendMcb>;
      brandBalance: number;
    }
  | { ok: false; code: string };

function balNum(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

async function ensureAccount(
  kind: McbAccountKind,
  refId: string | null,
): Promise<{ id: string; balance: number }> {
  const db = getDb();
  const existing =
    refId == null
      ? await db
          .select()
          .from(mcbCustodialAccounts)
          .where(
            and(
              eq(mcbCustodialAccounts.kind, kind),
              isNull(mcbCustodialAccounts.refId),
            ),
          )
          .limit(1)
      : await db
          .select()
          .from(mcbCustodialAccounts)
          .where(
            and(
              eq(mcbCustodialAccounts.kind, kind),
              eq(mcbCustodialAccounts.refId, refId),
            ),
          )
          .limit(1);

  if (existing[0]) {
    return { id: existing[0].id, balance: balNum(existing[0].balance) };
  }

  const [created] = await db
    .insert(mcbCustodialAccounts)
    .values({ kind, refId, balance: "0" })
    .returning();
  return { id: created!.id, balance: 0 };
}

export async function getMcbCustodialBalance(
  kind: McbAccountKind,
  refId: string | null = null,
): Promise<number> {
  const acc = await ensureAccount(kind, refId);
  return acc.balance;
}

export async function creditMcbCustodial(args: {
  kind: McbAccountKind;
  refId?: string | null;
  amount: number;
  entryType: string;
  meta?: Record<string, unknown>;
  batchId?: string;
}): Promise<{ ok: true; balance: number; batchId: string } | { ok: false; code: string }> {
  if (!(args.amount > 0) || !Number.isFinite(args.amount)) {
    return { ok: false, code: "mcb_invalid_amount" };
  }
  const batchId = args.batchId ?? randomUUID();
  const db = getDb();
  const acc = await ensureAccount(args.kind, args.refId ?? null);
  const amt = args.amount.toFixed(18);

  const [updated] = await db
    .update(mcbCustodialAccounts)
    .set({
      balance: sql`${mcbCustodialAccounts.balance} + ${amt}::numeric`,
      updatedAt: new Date(),
    })
    .where(eq(mcbCustodialAccounts.id, acc.id))
    .returning({ balance: mcbCustodialAccounts.balance });

  await db.insert(mcbCustodialLedger).values({
    batchId,
    accountId: acc.id,
    amount: amt,
    entryType: args.entryType,
    meta: args.meta ?? null,
  });

  return { ok: true, balance: balNum(updated?.balance), batchId };
}

/** Debit brand McB and split to creator_fund / burn_queue / ops (Horizon B2). */
export async function spendAdsMcb(args: {
  brandId: string;
  campaignId: string;
  amount: number;
}): Promise<McbSpendResult> {
  if (!communityAdsEnabled()) {
    return { ok: false, code: "ads_disabled" };
  }
  if (!(args.amount > 0) || !Number.isFinite(args.amount)) {
    return { ok: false, code: "mcb_invalid_amount" };
  }

  const db = getDb();
  const [brand] = await db
    .select({ id: communityBrands.id, status: communityBrands.status })
    .from(communityBrands)
    .where(eq(communityBrands.id, args.brandId))
    .limit(1);
  if (!brand || brand.status !== "active") {
    return { ok: false, code: "brand_inactive" };
  }

  const [campaign] = await db
    .select({
      id: communityAdCampaigns.id,
      status: communityAdCampaigns.status,
      brandId: communityAdCampaigns.brandId,
    })
    .from(communityAdCampaigns)
    .where(eq(communityAdCampaigns.id, args.campaignId))
    .limit(1);
  if (!campaign || campaign.brandId !== args.brandId) {
    return { ok: false, code: "campaign_not_found" };
  }

  const split = splitAdsSpendMcb(args.amount);
  const batchId = randomUUID();
  const amtStr = args.amount.toFixed(18);
  const monthKey = new Date().toISOString().slice(0, 7);

  try {
    const brandBalance = await db.transaction(async (tx) => {
      const brandAcc = await ensureAccountInTx(tx, "brand", args.brandId);
      const [debited] = await tx
        .update(mcbCustodialAccounts)
        .set({
          balance: sql`${mcbCustodialAccounts.balance} - ${amtStr}::numeric`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mcbCustodialAccounts.id, brandAcc.id),
            sql`${mcbCustodialAccounts.balance} >= ${amtStr}::numeric`,
          ),
        )
        .returning({ balance: mcbCustodialAccounts.balance });
      if (!debited) throw new Error("mcb_insufficient");

      await tx.insert(mcbCustodialLedger).values({
        batchId,
        accountId: brandAcc.id,
        amount: `-${amtStr}`,
        entryType: "ads_spend",
        meta: { campaignId: args.campaignId, split },
      });

      await creditPoolInTx(tx, batchId, "creator_fund", split.creatorFund, {
        campaignId: args.campaignId,
      });
      await creditPoolInTx(tx, batchId, "burn_queue", split.burn, {
        campaignId: args.campaignId,
      });
      await creditPoolInTx(tx, batchId, "ops_treasury", split.ops, {
        campaignId: args.campaignId,
      });

      await tx
        .update(communityAdCampaigns)
        .set({
          spentMcb: sql`${communityAdCampaigns.spentMcb} + ${amtStr}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(communityAdCampaigns.id, args.campaignId));

      await tx
        .insert(communityCreatorFundMonths)
        .values({
          monthKey,
          totalMcb: String(split.creatorFund),
          status: "open",
        })
        .onConflictDoUpdate({
          target: communityCreatorFundMonths.monthKey,
          set: {
            totalMcb: sql`${communityCreatorFundMonths.totalMcb} + ${String(split.creatorFund)}::numeric`,
          },
        });

      return balNum(debited.balance);
    });

    return {
      ok: true,
      batchId,
      spent: args.amount,
      split,
      brandBalance,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ads_spend_failed";
    return { ok: false, code: msg };
  }
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function ensureAccountInTx(
  tx: Tx,
  kind: McbAccountKind,
  refId: string | null,
): Promise<{ id: string }> {
  const existing =
    refId == null
      ? await tx
          .select({ id: mcbCustodialAccounts.id })
          .from(mcbCustodialAccounts)
          .where(
            and(
              eq(mcbCustodialAccounts.kind, kind),
              isNull(mcbCustodialAccounts.refId),
            ),
          )
          .limit(1)
      : await tx
          .select({ id: mcbCustodialAccounts.id })
          .from(mcbCustodialAccounts)
          .where(
            and(
              eq(mcbCustodialAccounts.kind, kind),
              eq(mcbCustodialAccounts.refId, refId),
            ),
          )
          .limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx
    .insert(mcbCustodialAccounts)
    .values({ kind, refId, balance: "0" })
    .returning({ id: mcbCustodialAccounts.id });
  return created!;
}

async function creditPoolInTx(
  tx: Tx,
  batchId: string,
  kind: "creator_fund" | "burn_queue" | "ops_treasury",
  amount: number,
  meta: Record<string, unknown>,
): Promise<void> {
  if (amount <= 0) return;
  const acc = await ensureAccountInTx(tx, kind, null);
  const amt = amount.toFixed(18);
  await tx
    .update(mcbCustodialAccounts)
    .set({
      balance: sql`${mcbCustodialAccounts.balance} + ${amt}::numeric`,
      updatedAt: new Date(),
    })
    .where(eq(mcbCustodialAccounts.id, acc.id));
  await tx.insert(mcbCustodialLedger).values({
    batchId,
    accountId: acc.id,
    amount: amt,
    entryType: `ads_${kind}`,
    meta,
  });
}

export async function listAdminAdCampaigns(args?: {
  status?: string;
  limit?: number;
}) {
  const db = getDb();
  const limit = Math.min(args?.limit ?? 50, 100);
  const base = db
    .select({
      id: communityAdCampaigns.id,
      status: communityAdCampaigns.status,
      budgetMcb: communityAdCampaigns.budgetMcb,
      spentMcb: communityAdCampaigns.spentMcb,
      creativeBody: communityAdCampaigns.creativeBody,
      startsAt: communityAdCampaigns.startsAt,
      endsAt: communityAdCampaigns.endsAt,
      createdAt: communityAdCampaigns.createdAt,
      brandId: communityBrands.id,
      brandName: communityBrands.displayName,
      productCode: communityAdProducts.code,
    })
    .from(communityAdCampaigns)
    .innerJoin(
      communityBrands,
      eq(communityAdCampaigns.brandId, communityBrands.id),
    )
    .innerJoin(
      communityAdProducts,
      eq(communityAdCampaigns.productId, communityAdProducts.id),
    );

  const rows = args?.status
    ? await base
        .where(eq(communityAdCampaigns.status, args.status))
        .limit(limit)
    : await base.limit(limit);

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    budgetMcb: String(r.budgetMcb),
    spentMcb: String(r.spentMcb),
    creativeBody: r.creativeBody,
    startsAt: r.startsAt?.toISOString() ?? null,
    endsAt: r.endsAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    brandId: r.brandId,
    brandName: r.brandName,
    productCode: r.productCode,
  }));
}

export async function setAdCampaignStatus(args: {
  campaignId: string;
  status: "approved" | "active" | "paused" | "rejected";
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const db = getDb();
  const [updated] = await db
    .update(communityAdCampaigns)
    .set({ status: args.status, updatedAt: new Date() })
    .where(eq(communityAdCampaigns.id, args.campaignId))
    .returning({ id: communityAdCampaigns.id });
  if (!updated) return { ok: false, code: "campaign_not_found" };
  return { ok: true };
}

export async function getAdsPoolSnapshot() {
  const [fund, burn, ops] = await Promise.all([
    getMcbCustodialBalance("creator_fund"),
    getMcbCustodialBalance("burn_queue"),
    getMcbCustodialBalance("ops_treasury"),
  ]);
  return { creatorFund: fund, burnQueue: burn, opsTreasury: ops };
}
