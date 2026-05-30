import { eq, sql } from "drizzle-orm";
import { getDb, users, withdrawals } from "@/db";
import { WithdrawalStatus } from "@/lib/status";
import { totalDebitedFromRow } from "@/lib/withdraw-fees";

export const CANCELLABLE_WITHDRAWAL_STATUSES = [
  WithdrawalStatus.QUEUED,
  WithdrawalStatus.DELAYED_BATCH,
  WithdrawalStatus.PENDING_AGENT,
  WithdrawalStatus.PROCESSING,
] as const;

export type RefundWithdrawalResult =
  | { ok: true; refund: string }
  | { ok: false; code: string; message: string };

/** Refund user balance and mark withdrawal REJECTED. Idempotent if already REJECTED. */
export async function refundAndRejectWithdrawal(args: {
  withdrawalId: string;
  reason: string;
  processedByUserId?: string | null;
}): Promise<RefundWithdrawalResult> {
  const db = getDb();
  const [w] = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.id, args.withdrawalId))
    .limit(1);

  if (!w) {
    return { ok: false, code: "not_found", message: "Not found" };
  }
  if (w.status === WithdrawalStatus.REJECTED) {
    return { ok: true, refund: totalDebitedFromRow(w) };
  }
  if (w.status === WithdrawalStatus.COMPLETED) {
    return {
      ok: false,
      code: "already_completed",
      message: "Withdrawal already completed",
    };
  }
  if (w.externalId?.trim()) {
    return {
      ok: false,
      code: "already_sent",
      message: "Withdrawal already submitted to provider",
    };
  }

  const refund = totalDebitedFromRow(w);
  const isPi = w.asset.toUpperCase() === "PI";
  const reason = args.reason.trim().slice(0, 1000);

  await db.transaction(async (tx) => {
    if (isPi) {
      await tx
        .update(users)
        .set({
          piBalance: sql`${users.piBalance} + ${refund}::numeric`,
        })
        .where(eq(users.id, w.userId));
    } else {
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} + ${refund}::numeric`,
        })
        .where(eq(users.id, w.userId));
    }
    await tx
      .update(withdrawals)
      .set({
        status: WithdrawalStatus.REJECTED,
        failureReason: reason,
        processedByUserId: args.processedByUserId ?? null,
        completedAt: new Date(),
      })
      .where(eq(withdrawals.id, args.withdrawalId));
  });

  return { ok: true, refund };
}

export function userMayCancelWithdrawal(row: {
  status: string;
  externalId: string | null;
  provider: string | null;
}): boolean {
  if (row.externalId?.trim()) return false;
  if (
    row.provider === "binance" &&
    row.status === WithdrawalStatus.PROCESSING
  ) {
    return false;
  }
  return (CANCELLABLE_WITHDRAWAL_STATUSES as readonly string[]).includes(
    row.status,
  );
}
