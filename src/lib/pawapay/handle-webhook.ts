import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb, pawapayWebhookEvents, users } from "@/db";
import type {
  PawapayDepositCallback,
  PawapayPayoutCallback,
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
  metadata: z.record(z.string(), z.string()).optional(),
});

const payoutCallbackZ = z.object({
  payoutId: z.string().min(1),
  status: z.enum(["COMPLETED", "PROCESSING", "FAILED"]),
  amount: z.string(),
  currency: z.string(),
  country: z.string(),
  recipient: z.unknown(),
  created: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
});

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

  return {
    ok: false,
    message: "Expected depositId or payoutId in JSON body.",
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

  const userIdRaw = cb.metadata?.userId?.trim();
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
    userId: cb.metadata?.userId && UUID_RE.test(cb.metadata.userId)
      ? cb.metadata.userId
      : null,
    effect,
    rawBody,
  });

  return { ok: true };
}
