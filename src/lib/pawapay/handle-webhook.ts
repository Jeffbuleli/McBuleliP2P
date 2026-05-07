import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { fiatPawapayTransactions, getDb, pawapayWebhookEvents, users } from "@/db";
import { walletLedgerEntries } from "@/db/schema";
import type {
  PawapayDepositCallback,
  PawapayPayoutCallback,
  PawapayRefundCallback,
} from "@/lib/pawapay/callback-types";
import { cdfPerOneUsd } from "@/lib/fx";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { tryAwardReferralFromFiatPawapayDeposit } from "@/lib/referral-service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function allowedFiat(currency: string): boolean {
  const c = currency.toUpperCase();
  return c === "CDF" || c === "USD";
}

const depositCallbackZ = z.object({
  depositId: z.string().min(1),
  status: z.enum(["COMPLETED", "PROCESSING", "FAILED"]),
  amount: z.string(),
  currency: z.string(),
  country: z.string(),
  payer: z.unknown(),
  created: z.string(),
  metadata: z
    .union([
      z.record(z.string(), z.string()),
      // PawaPay v2 TransactionMetadataRequest is an array of objects,
      // e.g. [{ userId: "..." }, { batchId: "..." }]
      z.array(z.record(z.string(), z.union([z.string(), z.boolean()]))),
    ])
    .optional(),
});

const payoutCallbackZ = z.object({
  payoutId: z.string().min(1),
  status: z.enum(["COMPLETED", "PROCESSING", "FAILED"]),
  amount: z.string(),
  currency: z.string(),
  country: z.string(),
  recipient: z.unknown(),
  created: z.string(),
  metadata: z
    .union([
      z.record(z.string(), z.string()),
      z.array(z.record(z.string(), z.union([z.string(), z.boolean()]))),
    ])
    .optional(),
});

const refundCallbackZ = z.object({
  refundId: z.string().min(1),
  status: z.enum(["COMPLETED", "PROCESSING", "FAILED"]),
  amount: z.string(),
  currency: z.string(),
  country: z.string(),
  recipient: z.unknown(),
  created: z.string(),
  metadata: z
    .union([
      z.record(z.string(), z.string()),
      z.array(z.record(z.string(), z.union([z.string(), z.boolean()]))),
    ])
    .optional(),
});

function metadataToRecord(
  metadata: unknown,
): Record<string, string> | undefined {
  if (!metadata) return undefined;
  if (typeof metadata === "object" && !Array.isArray(metadata)) {
    const rec = metadata as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v === "string") out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (Array.isArray(metadata)) {
    const out: Record<string, string> = {};
    for (const item of metadata) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
        if (k === "isPII") continue;
        if (typeof v === "string") out[k] = v;
      }
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

export async function handlePawapayWebhookJson(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const obj = raw as Record<string, unknown>;

  if (typeof obj.depositId === "string") {
    const parsed = depositCallbackZ.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: "Invalid deposit callback shape." };
    }
    return handleDeposit(parsed.data as PawapayDepositCallback);
  }

  if (typeof obj.payoutId === "string") {
    const parsed = payoutCallbackZ.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: "Invalid payout callback shape." };
    }
    return handlePayout(parsed.data as PawapayPayoutCallback);
  }

  if (typeof obj.refundId === "string") {
    const parsed = refundCallbackZ.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: "Invalid refund callback shape." };
    }
    return handleRefund(parsed.data as PawapayRefundCallback);
  }

  return {
    ok: false,
    message: "Expected depositId, payoutId, or refundId in JSON body.",
  };
}

async function insertLedger(args: {
  dedupKey: string;
  kind: string;
  pawapayId: string;
  status: string;
  currency: string;
  amount: string;
  userId: string | null;
  effect: string;
  rawBody: string;
}) {
  const db = getDb();
  const [row] = await db
    .insert(pawapayWebhookEvents)
    .values({
      dedupKey: args.dedupKey,
      kind: args.kind,
      pawapayId: args.pawapayId,
      status: args.status,
      currency: args.currency,
      amount: args.amount,
      userId: args.userId,
      effect: args.effect,
      rawBody: args.rawBody,
    })
    .onConflictDoNothing()
    .returning({ id: pawapayWebhookEvents.id });
  return Boolean(row);
}

async function handleDeposit(
  cb: PawapayDepositCallback,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const dedupKey = `deposit:${cb.depositId}:${cb.status}`;
  const currency = cb.currency.toUpperCase();
  const rawBody = JSON.stringify(cb);
  const meta = metadataToRecord((cb as unknown as { metadata?: unknown }).metadata);

  if (!allowedFiat(cb.currency)) {
    await insertLedger({
      dedupKey,
      kind: "deposit",
      pawapayId: cb.depositId,
      status: cb.status,
      currency,
      amount: cb.amount,
      userId: null,
      effect: "skipped_currency",
      rawBody,
    });
    return { ok: true };
  }

  if (cb.status !== "COMPLETED") {
    // Keep local tx status in sync for UX (best-effort).
    try {
      const db = getDb();
      await db
        .update(fiatPawapayTransactions)
        .set({
          status: cb.status === "FAILED" ? "FAILED" : "PROCESSING",
          failureCode:
            cb.status === "FAILED" && typeof (cb as any)?.failureReason?.failureCode === "string"
              ? String((cb as any).failureReason.failureCode)
              : null,
          failureMessage:
            cb.status === "FAILED" && typeof (cb as any)?.failureReason?.failureMessage === "string"
              ? String((cb as any).failureReason.failureMessage)
              : null,
          updatedAt: new Date(),
          completedAt: cb.status === "FAILED" ? new Date() : null,
        })
        .where(eq(fiatPawapayTransactions.pawapayId, cb.depositId));
    } catch {
      // best-effort
    }

    await insertLedger({
      dedupKey,
      kind: "deposit",
      pawapayId: cb.depositId,
      status: cb.status,
      currency,
      amount: cb.amount,
      userId: null,
      effect: "non_final",
      rawBody,
    });
    return { ok: true };
  }

  // Update local tx status (best-effort).
  try {
    const db = getDb();
    await db
      .update(fiatPawapayTransactions)
      .set({
        status: "COMPLETED",
        updatedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(fiatPawapayTransactions.pawapayId, cb.depositId));
  } catch {
    // best-effort
  }

  const userIdRaw = meta?.userId?.trim();
  if (!userIdRaw || !UUID_RE.test(userIdRaw)) {
    await insertLedger({
      dedupKey,
      kind: "deposit",
      pawapayId: cb.depositId,
      status: cb.status,
      currency,
      amount: cb.amount,
      userId: null,
      effect: "no_metadata_userId",
      rawBody,
    });
    return { ok: true };
  }

  const gross = Number(cb.amount);
  if (!Number.isFinite(gross) || gross <= 0) {
    await insertLedger({
      dedupKey,
      kind: "deposit",
      pawapayId: cb.depositId,
      status: cb.status,
      currency,
      amount: cb.amount,
      userId: userIdRaw,
      effect: "invalid_amount",
      rawBody,
    });
    return { ok: true };
  }

  const net = gross * (1 - FIAT_FEE_RATE);
  const fee = gross - net;
  const pocket = currency === "USD" ? "USD" : "CDF";
  const netStr = fmtWalletAmount(net);
  const feeUsdEq =
    pocket === "USD"
      ? fmtWalletAmount(fee)
      : fmtWalletAmount(fee / cdfPerOneUsd());

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(pawapayWebhookEvents)
        .values({
          dedupKey,
          kind: "deposit",
          pawapayId: cb.depositId,
          status: cb.status,
          currency,
          amount: cb.amount,
          userId: userIdRaw,
          effect: "credited_fiat",
          rawBody,
        })
        .onConflictDoNothing()
        .returning({ id: pawapayWebhookEvents.id });

      if (!inserted) {
        return;
      }

      await creditUserAsset(tx, userIdRaw, pocket, netStr);

      await insertWalletLedgerLines(tx, [
        {
          batchId: randomUUID(),
          userId: userIdRaw,
          entryType: "fiat_deposit",
          asset: pocket,
          amount: netStr,
          feeUsdEquivalent: feeUsdEq,
          meta: {
            gross: cb.amount,
            feeRate: FIAT_FEE_RATE,
            fee: fmtWalletAmount(fee),
            pawapayDepositId: cb.depositId,
          },
        },
      ]);
    });
  } catch {
    return { ok: false, message: "Persistence error." };
  }

  await tryAwardReferralFromFiatPawapayDeposit({
    userId: userIdRaw,
    grossAmount: gross,
    currency,
    feeUsdEquivalentStr: feeUsdEq,
    pawapayDepositId: cb.depositId,
  });

  return { ok: true };
}

async function handlePayout(
  cb: PawapayPayoutCallback,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const dedupKey = `payout:${cb.payoutId}:${cb.status}`;
  const currency = cb.currency.toUpperCase();
  const rawBody = JSON.stringify(cb);
  const meta = metadataToRecord((cb as unknown as { metadata?: unknown }).metadata);

  if (!allowedFiat(cb.currency)) {
    await insertLedger({
      dedupKey,
      kind: "payout",
      pawapayId: cb.payoutId,
      status: cb.status,
      currency,
      amount: cb.amount,
      userId: null,
      effect: "skipped_currency",
      rawBody,
    });
    return { ok: true };
  }

  const effect =
    cb.status === "COMPLETED"
      ? "payout_completed_logged"
      : cb.status === "FAILED"
        ? "payout_failed_logged"
        : "payout_non_final";

  await insertLedger({
    dedupKey,
    kind: "payout",
    pawapayId: cb.payoutId,
    status: cb.status,
    currency,
    amount: cb.amount,
    userId: meta?.userId && UUID_RE.test(meta.userId) ? meta.userId : null,
    effect,
    rawBody,
  });

  // Update local tx status (best-effort).
  try {
    const db = getDb();
    await db
      .update(fiatPawapayTransactions)
      .set({
        status: cb.status === "COMPLETED" ? "COMPLETED" : cb.status === "FAILED" ? "FAILED" : "PROCESSING",
        failureCode:
          cb.status === "FAILED" && typeof (cb as any)?.failureReason?.failureCode === "string"
            ? String((cb as any).failureReason.failureCode)
            : null,
        failureMessage:
          cb.status === "FAILED" && typeof (cb as any)?.failureReason?.failureMessage === "string"
            ? String((cb as any).failureReason.failureMessage)
            : null,
        updatedAt: new Date(),
        completedAt: cb.status === "COMPLETED" || cb.status === "FAILED" ? new Date() : null,
      })
      .where(eq(fiatPawapayTransactions.pawapayId, cb.payoutId));
  } catch {
    // best-effort
  }

  if (cb.status === "FAILED") {
    const userIdRaw = meta?.userId?.trim();
    const batchId = meta?.batchId?.trim();
    if (userIdRaw && UUID_RE.test(userIdRaw) && batchId && UUID_RE.test(batchId)) {
      const pocket = currency === "USD" ? "USD" : "CDF";
      const net = Number(cb.amount);
      if (Number.isFinite(net) && net > 0) {
        // Refund the original gross (not just net) if possible, since the payout failed.
        // We can recover gross from the user's ledger line created at initiation.
        const grossFromLedger = await (async () => {
          const db = getDb();
          const [row] = await db
            .select({ amount: walletLedgerEntries.amount })
            .from(walletLedgerEntries)
            .where(
              sql`${walletLedgerEntries.batchId} = ${batchId}::uuid and ${walletLedgerEntries.userId} = ${userIdRaw}::uuid and ${walletLedgerEntries.entryType} = 'fiat_withdraw'`,
            )
            .limit(1);
          if (!row) return null;
          const a = Number(row.amount);
          if (!Number.isFinite(a) || a === 0) return null;
          return Math.abs(a);
        })();

        const refundAmount = grossFromLedger ?? net;
        const refundStr = fmtWalletAmount(refundAmount);
        const feeUsdEq = "0";
        const refundDedup = `payout_refund:${cb.payoutId}:${cb.status}`;
        const db = getDb();
        try {
          await db.transaction(async (tx) => {
            const [inserted] = await tx
              .insert(pawapayWebhookEvents)
              .values({
                dedupKey: refundDedup,
                kind: "payout_refund",
                pawapayId: cb.payoutId,
                status: cb.status,
                currency,
                amount: cb.amount,
                userId: userIdRaw,
                effect: "refunded_net",
                rawBody,
              })
              .onConflictDoNothing()
              .returning({ id: pawapayWebhookEvents.id });
            if (!inserted) return;

            // Avoid double-refunds if initiation already refunded.
            const existing = await tx
              .select({ id: walletLedgerEntries.id })
              .from(walletLedgerEntries)
              .where(
                sql`${walletLedgerEntries.batchId} = ${batchId}::uuid and ${walletLedgerEntries.entryType} = 'fiat_withdraw_refund' and (${walletLedgerEntries.meta} ->> 'pawapayPayoutId') = ${cb.payoutId}`,
              )
              .limit(1);
            if (existing.length > 0) return;

            await creditUserAsset(tx, userIdRaw, pocket, refundStr);
            await insertWalletLedgerLines(tx, [
              {
                batchId,
                userId: userIdRaw,
                entryType: "fiat_withdraw_refund",
                asset: pocket,
                amount: refundStr,
                feeUsdEquivalent: feeUsdEq,
                meta: {
                  pawapayPayoutId: cb.payoutId,
                  reason: "payout_failed",
                  refunded: grossFromLedger ? "gross" : "net_fallback",
                },
              },
            ]);
          });
        } catch {
          // Best-effort refund; webhook ledger already recorded.
        }
      }
    }
  }

  return { ok: true };
}

async function handleRefund(
  cb: PawapayRefundCallback,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const dedupKey = `refund:${cb.refundId}:${cb.status}`;
  const currency = cb.currency.toUpperCase();
  const rawBody = JSON.stringify(cb);
  const meta = metadataToRecord((cb as unknown as { metadata?: unknown }).metadata);

  if (!allowedFiat(cb.currency)) {
    await insertLedger({
      dedupKey,
      kind: "refund",
      pawapayId: cb.refundId,
      status: cb.status,
      currency,
      amount: cb.amount,
      userId: null,
      effect: "skipped_currency",
      rawBody,
    });
    return { ok: true };
  }

  const userId = meta?.userId && UUID_RE.test(meta.userId) ? meta.userId : null;

  await insertLedger({
    dedupKey,
    kind: "refund",
    pawapayId: cb.refundId,
    status: cb.status,
    currency,
    amount: cb.amount,
    userId,
    effect: cb.status === "COMPLETED" ? "refund_completed_logged" : "refund_non_final",
    rawBody,
  });

  return { ok: true };
}
