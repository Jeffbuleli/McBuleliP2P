import { NextResponse } from "next/server";
import { createUserNotification } from "@/lib/notifications-service";
import { notifyWithdrawalQueuedEmail } from "@/lib/email/wallet-crypto-notify";
import { scheduleEmailTask } from "@/lib/email/schedule-email";
import { resolveEmailLocale } from "@/lib/email/locale";
import { notifyStaffWithdrawalsScope } from "@/lib/staff-notifications";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, loans, users, withdrawals } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { withdrawalSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { isValidAddressForNetwork } from "@/lib/address-format";
import { WithdrawalStatus } from "@/lib/status";
import {
  parseNetWithdrawal,
  parseNetWithdrawalPi,
} from "@/lib/withdraw-fees";
import {
  piWithdrawFeeSplit,
  resolveUsdtFeeSplitForQuote,
} from "@/lib/withdraw-fee-split";
import { resolveUsdtWithdrawQuote } from "@/lib/withdraw-quote";
import { walletWithdrawAutoEnabled } from "@/lib/usdt-wallet-features";
import { checkKycGate } from "@/lib/kyc-guard";
import { getPiOkxChain } from "@/lib/pi-constants";
import { applyUsdtWithdrawalAutomation } from "@/lib/wallet-withdraw-automation";
import { userNeedsStepUp } from "@/lib/auth/step-up";
import { runWithdrawalWorker } from "@/lib/wallet-withdraw-queue";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const list = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.userId, userId))
    .orderBy(desc(withdrawals.createdAt))
    .limit(50);
  return NextResponse.json({ withdrawals: list });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const totpCode = typeof raw?.totpCode === "string" ? raw.totpCode : null;
  const passkeyChallengeId =
    typeof raw?.passkeyChallengeId === "string" ? raw.passkeyChallengeId : null;
  const passkeyResponse = raw?.passkeyResponse;

  const { assertStepUp } = await import("@/lib/auth/step-up");
  const step = await assertStepUp({
    userId,
    totpCode,
    passkeyChallengeId,
    passkeyResponse,
  });
  if (!step.ok) {
    return NextResponse.json(
      {
        message: step.error,
        error: step.error,
        requiresStepUp: step.error === "step_up_required",
      },
      { status: 403 },
    );
  }

  const parsed = withdrawalSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first =
      Object.values(flat.fieldErrors).flat()[0] ?? "Invalid withdrawal request.";
    return NextResponse.json(
      { message: first, fieldErrors: flat.fieldErrors },
      { status: 400 },
    );
  }
  const body = parsed.data;

  if (!isValidAddressForNetwork(body.address, body.network)) {
    return NextResponse.json(
      {
        message:
          "Destination address format is invalid for the selected network.",
      },
      { status: 400 },
    );
  }

  let usdtQuote: Awaited<ReturnType<typeof resolveUsdtWithdrawQuote>> | null =
    null;
  if (body.asset === "USDT") {
    usdtQuote = await resolveUsdtWithdrawQuote({
      network: body.network,
      address: body.address.trim(),
    });
  }

  const amounts =
    body.asset === "PI"
      ? parseNetWithdrawalPi({ netAmountStr: body.amount })
      : parseNetWithdrawal({
          netAmountStr: body.amount,
          userFeeUsdt: usdtQuote!.userFeeUsdt,
          minNetUsdt: usdtQuote!.minNetUsdt,
        });

  if (!amounts.ok) {
    return NextResponse.json({ message: amounts.message }, { status: 400 });
  }

  const { net, fee, totalDebit } = amounts;
  const db = getDb();

  // Loans v1: block external withdrawals while a loan is open.
  const [openLoan] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(and(eq(loans.userId, userId), eq(loans.status, "open")))
    .limit(1);
  if (openLoan) {
    return NextResponse.json(
      { ok: false, message: "loan_withdraw_blocked" },
      { status: 403 },
    );
  }

  const kyc = await checkKycGate(userId, "withdraw");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }

  const networkCex =
    body.asset === "USDT"
      ? USDT_NETWORKS[body.network].binanceNetwork
      : getPiOkxChain();

  const feeSplit =
    body.asset === "USDT" && usdtQuote
      ? await resolveUsdtFeeSplitForQuote({
          isInternal: usdtQuote.isInternal,
          userFeeUsdt: usdtQuote.userFeeUsdt,
          binanceListFeeUsdt: usdtQuote.binanceListFeeUsdt,
        })
      : piWithdrawFeeSplit(fee);

  const usdtProvider = walletWithdrawAutoEnabled() ? "binance" : "manual";

  const w = await db.transaction(async (tx) => {
    if (body.asset === "PI") {
      const [deducted] = await tx
        .update(users)
        .set({
          piBalance: sql`${users.piBalance} - ${totalDebit}::numeric`,
        })
        .where(
          and(
            eq(users.id, userId),
            sql`${users.piBalance} >= ${totalDebit}::numeric`,
          ),
        )
        .returning({ piBalance: users.piBalance });

      if (!deducted) return null;

      const [row] = await tx
        .insert(withdrawals)
        .values({
          userId,
          provider: "manual",
          asset: body.asset,
          networkCanonical: body.network,
          networkCex,
          toAddress: body.address.trim(),
          memoTo: body.memo?.trim() || null,
          amount: net,
          fee,
          providerFee: feeSplit.providerFee,
          platformFee: feeSplit.platformFee,
          status: WithdrawalStatus.PENDING_AGENT,
        })
        .returning();
      return row;
    }

    const [deducted] = await tx
      .update(users)
      .set({
        balance: sql`${users.balance} - ${totalDebit}::numeric`,
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.balance} >= ${totalDebit}::numeric`,
        ),
      )
      .returning({ balance: users.balance });

    if (!deducted) return null;

    const [row] = await tx
      .insert(withdrawals)
      .values({
        userId,
        provider: usdtProvider,
        asset: body.asset,
        networkCanonical: body.network,
        networkCex,
        toAddress: body.address.trim(),
        memoTo: body.memo?.trim() || null,
        amount: net,
        fee,
        providerFee: feeSplit.providerFee,
        platformFee: feeSplit.platformFee,
        status: WithdrawalStatus.PENDING_AGENT,
      })
      .returning();
    return row;
  });

  if (!w) {
    return NextResponse.json(
      {
        message:
          "Insufficient balance (remember the fixed fee is added to the net amount).",
      },
      { status: 400 },
    );
  }

  let finalWithdrawal = w;
  let automation: Awaited<ReturnType<typeof applyUsdtWithdrawalAutomation>> = null;
  if (body.asset === "USDT") {
    const deviceId =
      typeof raw?.deviceId === "string"
        ? raw.deviceId
        : req.headers.get("x-device-id");
    const needsStepUp = await userNeedsStepUp(userId);
    const stepUpVerified =
      step.ok &&
      (!needsStepUp ||
        Boolean(passkeyChallengeId && passkeyResponse) ||
        Boolean(totpCode?.trim()));
    automation = await applyUsdtWithdrawalAutomation({
      userId,
      withdrawalId: w.id,
      networkCanonical: body.network,
      address: body.address.trim(),
      amountNet: net,
      deviceId,
      stepUpVerified,
    });
    if (automation) {
      finalWithdrawal = { ...w, status: automation.status };
      if (
        automation.status === WithdrawalStatus.QUEUED ||
        automation.status === WithdrawalStatus.DELAYED_BATCH
      ) {
        scheduleEmailTask(async () => {
          await runWithdrawalWorker(3);
        });
      }
    }
  }

  await createUserNotification({
    userId,
    kind: "withdrawal_queued",
    payload: {
      withdrawalId: w.id,
      asset: body.asset,
      amount: net,
      fee,
    },
  });

  const emailLocale = await resolveEmailLocale(req);

  scheduleEmailTask(async () => {
    await notifyWithdrawalQueuedEmail({
      userId,
      withdrawalId: w.id,
      asset: body.asset,
      amount: net,
      fee,
      networkCanonical: body.network,
      address: body.address.trim(),
      locale: emailLocale,
    });
  });

  if (
    !automation ||
    automation.riskLevel === "HIGH" ||
    finalWithdrawal.status === WithdrawalStatus.PENDING_AGENT
  ) {
    await notifyStaffWithdrawalsScope({
      kind: "admin_withdrawal_order",
      payload: {
        withdrawalId: w.id,
        asset: body.asset,
        amount: net,
        fee,
      },
    });
  }

  const message =
    automation?.messageKey === "withdraw_auto_low"
      ? "withdraw_auto_low"
      : automation?.messageKey === "withdraw_auto_medium"
        ? "withdraw_auto_medium"
        : "withdraw_manual_review";

  return NextResponse.json({
    withdrawal: finalWithdrawal,
    risk: automation
      ? { level: automation.riskLevel, score: automation.riskScore }
      : null,
    message,
  });
}
