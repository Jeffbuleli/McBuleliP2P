import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { scheduleEmailTask } from "@/lib/email/schedule-email";
import { resolveEmailLocale } from "@/lib/email/locale";
import { notifyWithdrawalRejectedEmail } from "@/lib/email/wallet-crypto-notify";
import { createUserNotification } from "@/lib/notifications-service";
import { getSessionUserId } from "@/lib/session";
import {
  refundAndRejectWithdrawal,
  userMayCancelWithdrawal,
} from "@/lib/withdraw-refund";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [w] = await db
    .select()
    .from(withdrawals)
    .where(and(eq(withdrawals.id, id), eq(withdrawals.userId, userId)))
    .limit(1);

  if (!w) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!userMayCancelWithdrawal(w)) {
    return NextResponse.json(
      {
        error:
          w.externalId?.trim()
            ? "withdraw_cancel_already_sent"
            : "withdraw_cancel_not_allowed",
      },
      { status: 409 },
    );
  }

  const locale = await resolveEmailLocale(req);
  const reason =
    w.failureReason?.trim() ||
    (locale === "fr"
      ? "Retrait annulé à votre demande."
      : "Withdrawal cancelled at your request.");

  const out = await refundAndRejectWithdrawal({
    withdrawalId: id,
    reason,
    processedByUserId: null,
  });

  if (!out.ok) {
    return NextResponse.json({ error: out.code }, { status: 409 });
  }

  await createUserNotification({
    userId,
    kind: "withdrawal_rejected",
    payload: {
      withdrawalId: id,
      asset: w.asset,
      reason,
    },
  });

  scheduleEmailTask(async () => {
    const locale = await resolveEmailLocale(req);
    await notifyWithdrawalRejectedEmail({
      userId,
      withdrawalId: id,
      asset: w.asset,
      amount: w.amount?.toString?.() ?? String(w.amount),
      fee: w.fee?.toString?.() ?? String(w.fee),
      networkCanonical: w.networkCanonical,
      address: w.toAddress,
      reason,
      locale,
    });
  });

  const [updated] = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.id, id))
    .limit(1);

  return NextResponse.json({ withdrawal: updated, refund: out.refund });
}
