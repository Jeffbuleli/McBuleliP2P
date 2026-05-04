import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  getDb,
  groupSavingsGroups,
  groupSubscriptionInvoices,
  groupWalletLedgerEntries,
} from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { getGroupUsdtBalance } from "@/lib/group-savings-ledger";
import { GROUP_SUBSCRIPTION_FEE_USDT } from "@/lib/group-savings-types";
import { fmtWalletAmount } from "@/lib/wallet-types";

function periodYYYYMM(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function nextBillingAtFixedDay(now = new Date()): Date {
  // Fixed day: 1st of next month at 00:00 UTC.
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return new Date(Date.UTC(m === 11 ? y + 1 : y, (m + 1) % 12, 1, 0, 0, 0));
}

export async function ensureGroupSubscriptionUpToDate(args: {
  groupId: string;
  now?: Date;
}): Promise<void> {
  const now = args.now ?? new Date();
  // Billing is due once we are past the first day 00:00 UTC of current month.
  const dueAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  if (now.getTime() + 1 < dueAt.getTime()) return;
  await processGroupSubscriptionBilling({ groupId: args.groupId, now });
}

export async function processGroupSubscriptionBilling(args: {
  groupId: string;
  now?: Date;
}): Promise<
  | { ok: true; status: "paid" | "failed" | "skipped" }
  | { ok: false; message: string }
> {
  const db = getDb();
  const now = args.now ?? new Date();
  const period = periodYYYYMM(now);

  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };
  if (g.status === "closed") {
    // Do not bill closed groups.
    return { ok: true, status: "skipped" };
  }
  if (g.status === "pending" || g.status === "rejected") {
    return { ok: true, status: "skipped" };
  }

  const [inv] = await db
    .select()
    .from(groupSubscriptionInvoices)
    .where(
      and(
        eq(groupSubscriptionInvoices.groupId, args.groupId),
        eq(groupSubscriptionInvoices.period, period),
      ),
    )
    .limit(1);
  if (inv?.status === "paid") {
    return { ok: true, status: "paid" };
  }

  const bal = await getGroupUsdtBalance(args.groupId);
  if (bal + 1e-18 < GROUP_SUBSCRIPTION_FEE_USDT) {
    // Mark overdue + suspend.
    await db.transaction(async (tx) => {
      if (!inv) {
        await tx.insert(groupSubscriptionInvoices).values({
          groupId: args.groupId,
          period,
          amountUsdt: fmtWalletAmount(GROUP_SUBSCRIPTION_FEE_USDT),
          status: "failed",
          attemptedAt: now,
          failureReason: "insufficient_group_balance",
        });
      } else if (inv.status !== "failed") {
        await tx
          .update(groupSubscriptionInvoices)
          .set({
            status: "failed",
            attemptedAt: now,
            failureReason: "insufficient_group_balance",
          })
          .where(eq(groupSubscriptionInvoices.id, inv.id));
      }

      const before = {
        status: g.status,
        subscriptionStatus: g.subscriptionStatus,
        nextBillingAt: g.nextBillingAt?.toISOString() ?? null,
      };
      await tx
        .update(groupSavingsGroups)
        .set({
          subscriptionStatus: "overdue",
          status: "suspended",
          nextBillingAt: nextBillingAtFixedDay(now),
          updatedAt: now,
        })
        .where(eq(groupSavingsGroups.id, args.groupId));

      await writeGroupAudit({
        groupId: args.groupId,
        actorUserId: null,
        action: "subscription_failed_insufficient_balance",
        before,
        after: {
          status: "suspended",
          subscriptionStatus: "overdue",
          nextBillingAt: nextBillingAtFixedDay(now).toISOString(),
          period,
        },
      });
    });
    return { ok: true, status: "failed" };
  }

  const batchId = randomUUID();

  try {
    await db.transaction(async (tx) => {
      // Upsert invoice row (create or overwrite failed).
      const [existing] = await tx
        .select()
        .from(groupSubscriptionInvoices)
        .where(
          and(
            eq(groupSubscriptionInvoices.groupId, args.groupId),
            eq(groupSubscriptionInvoices.period, period),
          ),
        )
        .limit(1);
      if (!existing) {
        await tx.insert(groupSubscriptionInvoices).values({
          groupId: args.groupId,
          period,
          amountUsdt: fmtWalletAmount(GROUP_SUBSCRIPTION_FEE_USDT),
          status: "paid",
          attemptedAt: now,
          paidAt: now,
        });
      } else {
        await tx
          .update(groupSubscriptionInvoices)
          .set({
            status: "paid",
            attemptedAt: now,
            paidAt: now,
            failureReason: null,
          })
          .where(eq(groupSubscriptionInvoices.id, existing.id));
      }

      const inserted = await tx
        .insert(groupWalletLedgerEntries)
        .values({
          batchId,
          groupId: args.groupId,
          entryType: "group_subscription_fee",
          asset: "USDT",
          amount: `-${fmtWalletAmount(GROUP_SUBSCRIPTION_FEE_USDT)}`,
          meta: { period },
        })
        .returning({ id: groupWalletLedgerEntries.id });

      const ledgerId = inserted[0]?.id ?? null;
      if (ledgerId) {
        await tx
          .update(groupSubscriptionInvoices)
          .set({ ledgerEntryId: ledgerId })
          .where(
            and(
              eq(groupSubscriptionInvoices.groupId, args.groupId),
              eq(groupSubscriptionInvoices.period, period),
            ),
          );
      }

      const before = {
        status: g.status,
        subscriptionStatus: g.subscriptionStatus,
        nextBillingAt: g.nextBillingAt?.toISOString() ?? null,
      };
      await tx
        .update(groupSavingsGroups)
        .set({
          subscriptionStatus: "active",
          status: "active",
          nextBillingAt: nextBillingAtFixedDay(now),
          updatedAt: now,
        })
        .where(eq(groupSavingsGroups.id, args.groupId));

      await writeGroupAudit({
        groupId: args.groupId,
        actorUserId: null,
        action: "subscription_paid",
        before,
        after: {
          status: "active",
          subscriptionStatus: "active",
          nextBillingAt: nextBillingAtFixedDay(now).toISOString(),
          period,
          ledgerEntryId: ledgerId,
        },
      });
    });
  } catch {
    return { ok: false, message: "subscription_billing_failed" };
  }

  return { ok: true, status: "paid" };
}

