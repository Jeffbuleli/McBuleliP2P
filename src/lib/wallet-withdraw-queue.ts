import crypto from "node:crypto";
import { and, asc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb, withdrawalQueueJobs, withdrawals } from "@/db";
import { WithdrawalStatus } from "@/lib/status";
import {
  walletWithdrawAutoEnabled,
  walletWithdrawalBatchDelayMaxMinutes,
  walletWithdrawalBatchDelayMinMinutes,
} from "@/lib/usdt-wallet-features";
import { binanceWithdraw, binanceWithdrawHistoryById, binanceUsdtWithdrawFee } from "@/lib/binance";
import { createUserNotification } from "@/lib/notifications-service";
import { notifyWithdrawalCompletedEmail } from "@/lib/email/wallet-crypto-notify";
import type { NetworkId } from "@/lib/networks";
import { finalizeUsdtWithdrawFeeSplit } from "@/lib/withdraw-fee-split";

export type WithdrawDecision = "AUTO_NOW" | "DELAYED_BATCH" | "MANUAL_REVIEW";

export async function enqueueWithdrawalJob(args: {
  withdrawalId: string;
  decision: WithdrawDecision;
}) {
  const db = getDb();
  const jitter =
    args.decision === "DELAYED_BATCH"
      ? Math.floor(
          (walletWithdrawalBatchDelayMinMinutes() +
            Math.random() *
              (walletWithdrawalBatchDelayMaxMinutes() -
                walletWithdrawalBatchDelayMinMinutes())) *
            60_000,
        )
      : 0;
  const runAfter = new Date(Date.now() + jitter);
  const idem = `wd:${args.withdrawalId}:v1`;
  await db
    .insert(withdrawalQueueJobs)
    .values({
      withdrawalId: args.withdrawalId,
      idempotencyKey: idem,
      status: "queued",
      runAfter,
      maxAttempts: 5,
    })
    .onConflictDoNothing();
}

const AUTO_REPAIR_STATUSES = [
  WithdrawalStatus.PENDING_AGENT,
  WithdrawalStatus.QUEUED,
  WithdrawalStatus.PROCESSING,
] as const;

/** Re-queue USDT binance withdrawals that never got a worker job (e.g. keys added later). */
async function repairOrphanBinanceWithdrawals(): Promise<number> {
  if (!walletWithdrawAutoEnabled()) return 0;
  const db = getDb();
  const rows = await db
    .select({ id: withdrawals.id, status: withdrawals.status })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.asset, "USDT"),
        eq(withdrawals.provider, "binance"),
        inArray(withdrawals.status, [...AUTO_REPAIR_STATUSES]),
      ),
    )
    .limit(30);

  let repaired = 0;
  for (const row of rows) {
    const [job] = await db
      .select({
        id: withdrawalQueueJobs.id,
        status: withdrawalQueueJobs.status,
      })
      .from(withdrawalQueueJobs)
      .where(eq(withdrawalQueueJobs.withdrawalId, row.id))
      .limit(1);

    if (job) {
      if (job.status === "done") continue;
      if (job.status === "queued" || job.status === "running") continue;
      await db
        .update(withdrawalQueueJobs)
        .set({
          status: "queued",
          runAfter: new Date(),
          attempts: 0,
          lastError: null,
          lockToken: null,
          lockedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(withdrawalQueueJobs.id, job.id));
    } else {
      await enqueueWithdrawalJob({
        withdrawalId: row.id,
        decision: "AUTO_NOW",
      });
    }

    if (row.status === WithdrawalStatus.PENDING_AGENT) {
      await db
        .update(withdrawals)
        .set({ status: WithdrawalStatus.QUEUED, failureReason: null })
        .where(eq(withdrawals.id, row.id));
    }

    repaired++;
  }
  return repaired;
}

async function revertWithdrawalAfterFailure(args: {
  withdrawalId: string;
  priorStatus: string;
  error: string;
}) {
  const db = getDb();
  const status =
    args.priorStatus === WithdrawalStatus.DELAYED_BATCH
      ? WithdrawalStatus.DELAYED_BATCH
      : WithdrawalStatus.QUEUED;
  await db
    .update(withdrawals)
    .set({
      status,
      failureReason: args.error.slice(0, 1000),
    })
    .where(eq(withdrawals.id, args.withdrawalId));
}

async function releaseStaleRunningJobs(maxAgeMs = 10 * 60_000) {
  const db = getDb();
  const cutoff = new Date(Date.now() - maxAgeMs);
  await db
    .update(withdrawalQueueJobs)
    .set({
      status: "queued",
      lockToken: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(withdrawalQueueJobs.status, "running"),
        or(
          isNull(withdrawalQueueJobs.lockedAt),
          lte(withdrawalQueueJobs.lockedAt, cutoff),
        ),
      ),
    );
}

async function lockNextJob() {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(withdrawalQueueJobs)
    .where(
      and(
        eq(withdrawalQueueJobs.status, "queued"),
        lte(withdrawalQueueJobs.runAfter, now),
      ),
    )
    .orderBy(asc(withdrawalQueueJobs.runAfter))
    .limit(1);
  if (!row) return null;

  const lockToken = crypto.randomUUID();
  const [locked] = await db
    .update(withdrawalQueueJobs)
    .set({
      status: "running",
      lockToken,
      lockedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(withdrawalQueueJobs.id, row.id),
        or(eq(withdrawalQueueJobs.status, "queued"), eq(withdrawalQueueJobs.status, "retry")),
      ),
    )
    .returning();
  return locked ?? null;
}

async function markFailed(jobId: string, error: string) {
  const db = getDb();
  const [job] = await db
    .select()
    .from(withdrawalQueueJobs)
    .where(eq(withdrawalQueueJobs.id, jobId))
    .limit(1);
  if (!job) return;
  const attempts = (job.attempts ?? 0) + 1;
  const terminal = attempts >= (job.maxAttempts ?? 5);
  await db
    .update(withdrawalQueueJobs)
    .set({
      status: terminal ? "failed" : "retry",
      attempts,
      runAfter: new Date(Date.now() + Math.min(60, attempts * 5) * 60_000),
      lastError: error.slice(0, 1000),
      updatedAt: new Date(),
    })
    .where(eq(withdrawalQueueJobs.id, jobId));
}

async function markDone(args: { jobId: string; txid?: string | null; providerRef?: string | null }) {
  const db = getDb();
  await db
    .update(withdrawalQueueJobs)
    .set({
      status: "done",
      txid: args.txid ?? null,
      providerRef: args.providerRef ?? null,
      updatedAt: new Date(),
    })
    .where(eq(withdrawalQueueJobs.id, args.jobId));
}

async function executeJob(job: typeof withdrawalQueueJobs.$inferSelect): Promise<{
  ok: boolean;
  txid?: string;
  providerRef?: string;
  message?: string;
}> {
  const db = getDb();
  const [w] = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.id, job.withdrawalId))
    .limit(1);
  if (!w) return { ok: false, message: "withdrawal_not_found" };
  if (w.status === WithdrawalStatus.COMPLETED || w.status === WithdrawalStatus.REJECTED) {
    return { ok: true, message: "already_finalized" };
  }
  if (!walletWithdrawAutoEnabled()) {
    return { ok: false, message: "wallet_auto_withdraw_disabled" };
  }

  const priorStatus = w.status;

  if (
    w.status === WithdrawalStatus.QUEUED ||
    w.status === WithdrawalStatus.DELAYED_BATCH ||
    w.status === WithdrawalStatus.PROCESSING
  ) {
    await db
      .update(withdrawals)
      .set({ status: WithdrawalStatus.PROCESSING, failureReason: null })
      .where(eq(withdrawals.id, w.id));
  }

  if (w.asset.toUpperCase() === "USDT") {
    try {
      const network = w.networkCanonical as NetworkId;
      const sent = await binanceWithdraw({
        coin: "USDT",
        network,
        address: w.toAddress,
        amount: String(w.amount),
        tag: w.memoTo ?? undefined,
        withdrawOrderId: w.id,
        walletType: 0,
      });

      const history = await binanceWithdrawHistoryById(sent.id).catch(() => null);
      const actualFee = history ? Number(history.transactionFee) : null;
      const listFee = await binanceUsdtWithdrawFee(network).catch(() => 0);
      const feeSplit = await finalizeUsdtWithdrawFeeSplit({
        network,
        userFeeUsdt: Number(w.fee),
        actualBinanceFeeUsdt: Number.isFinite(actualFee ?? NaN) ? actualFee : null,
        binanceListFeeUsdt: listFee,
      });

      await db
        .update(withdrawals)
        .set({
          status: WithdrawalStatus.COMPLETED,
          externalId: sent.id,
          txid: history?.txId?.trim() || sent.id,
          providerFee: feeSplit.providerFee,
          platformFee: feeSplit.platformFee,
          completedAt: new Date(),
        })
        .where(eq(withdrawals.id, w.id));
      const txid = history?.txId?.trim() || sent.id;
      await createUserNotification({
        userId: w.userId,
        kind: "withdrawal_completed",
        payload: {
          withdrawalId: w.id,
          asset: w.asset,
          amount: String(w.amount),
          txid,
        },
      });
      await notifyWithdrawalCompletedEmail({
        userId: w.userId,
        withdrawalId: w.id,
        asset: w.asset,
        amount: String(w.amount),
        fee: String(w.fee),
        networkCanonical: w.networkCanonical,
        address: w.toAddress,
        txid,
      });
      return {
        ok: true,
        providerRef: sent.id,
        txid,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[withdraw-worker] binance_withdraw_failed", {
        withdrawalId: w.id,
        error: msg,
      });
      await revertWithdrawalAfterFailure({
        withdrawalId: w.id,
        priorStatus,
        error: msg,
      });
      return { ok: false, message: msg };
    }
  }

  // PI/manual or unsupported stays in ops lane.
  await db
    .update(withdrawals)
    .set({ status: WithdrawalStatus.PENDING_AGENT })
    .where(eq(withdrawals.id, w.id));
  return { ok: true, message: "manual_lane" };
}

export async function runWithdrawalWorker(maxJobs = 20): Promise<{
  processed: number;
  completed: number;
  failed: number;
  repaired: number;
}> {
  await releaseStaleRunningJobs();
  const repaired = await repairOrphanBinanceWithdrawals();
  let processed = 0;
  let completed = 0;
  let failed = 0;
  for (let i = 0; i < maxJobs; i++) {
    const job = await lockNextJob();
    if (!job) break;
    processed++;
    const out = await executeJob(job);
    if (out.ok) {
      completed++;
      await markDone({
        jobId: job.id,
        txid: out.txid,
        providerRef: out.providerRef,
      });
    } else {
      failed++;
      await markFailed(job.id, out.message ?? "unknown_error");
    }
  }
  return { processed, completed, failed, repaired };
}

export async function runRetryFailedJobs(): Promise<{ reopened: number }> {
  const db = getDb();
  const rows = await db
    .update(withdrawalQueueJobs)
    .set({
      status: "queued",
      runAfter: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(withdrawalQueueJobs.status, "retry"),
        lte(withdrawalQueueJobs.runAfter, new Date()),
      ),
    )
    .returning({ id: withdrawalQueueJobs.id });
  return { reopened: rows.length };
}

