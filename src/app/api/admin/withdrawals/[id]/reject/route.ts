import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { adminRejectWithdrawalSchema } from "@/lib/validation";
import { WithdrawalStatus } from "@/lib/status";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { createUserNotification } from "@/lib/notifications-service";
import { scheduleEmailTask } from "@/lib/email/schedule-email";
import { resolveEmailLocale } from "@/lib/email/locale";
import { notifyWithdrawalRejectedEmail } from "@/lib/email/wallet-crypto-notify";
import {
  CANCELLABLE_WITHDRAWAL_STATUSES,
  refundAndRejectWithdrawal,
} from "@/lib/withdraw-refund";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let staff;
  try {
    staff = await requireStaffScope("withdrawals");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const parsed = adminRejectWithdrawalSchema.safeParse(await req.json());
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Invalid payload";
    return NextResponse.json({ message: first }, { status: 400 });
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [w] = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.id, id))
    .limit(1);

  if (!w) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (
    !(CANCELLABLE_WITHDRAWAL_STATUSES as readonly string[]).includes(w.status)
  ) {
    return NextResponse.json(
      { message: "Withdrawal cannot be rejected in its current state." },
      { status: 409 },
    );
  }
  if (
    w.status === WithdrawalStatus.PROCESSING &&
    staff.role !== "super_admin" &&
    w.assignedToUserId !== staff.id
  ) {
    return NextResponse.json(
      { message: "Only the assigned agent or a super admin can reject." },
      { status: 403 },
    );
  }

  const reason = parsed.data.reason.trim();
  const out = await refundAndRejectWithdrawal({
    withdrawalId: id,
    reason,
    processedByUserId: staff.id,
  });

  if (!out.ok) {
    return NextResponse.json({ message: out.message }, { status: 409 });
  }

  const [updated] = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.id, id))
    .limit(1);

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.WITHDRAWAL_REJECT,
    resourceType: "withdrawal",
    resourceId: id,
    meta: {
      reason,
      asset: w.asset,
      refundApprox: out.refund,
    },
  });

  await createUserNotification({
    userId: w.userId,
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
      userId: w.userId,
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

  return NextResponse.json({ withdrawal: updated });
}
