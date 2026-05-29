import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { WithdrawalStatus } from "@/lib/status";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { createUserNotification } from "@/lib/notifications-service";
import { scheduleEmailTask } from "@/lib/email/schedule-email";
import { resolveEmailLocale } from "@/lib/email/locale";
import { notifyWithdrawalClaimedEmail } from "@/lib/email/wallet-crypto-notify";

/**
 * Agent takes ownership of a pending withdrawal → PROCESSING.
 * Other agents see it as in progress (same ticket, new status).
 */
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
  if (w.status !== WithdrawalStatus.PENDING_AGENT) {
    return NextResponse.json(
      { message: "This withdrawal is not waiting for an agent." },
      { status: 409 },
    );
  }
  if (w.assignedToUserId) {
    return NextResponse.json(
      { message: "Already assigned." },
      { status: 409 },
    );
  }

  const [updated] = await db
    .update(withdrawals)
    .set({
      status: WithdrawalStatus.PROCESSING,
      assignedToUserId: staff.id,
    })
    .where(eq(withdrawals.id, id))
    .returning();

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.WITHDRAWAL_CLAIM,
    resourceType: "withdrawal",
    resourceId: id,
    meta: {
      asset: w.asset,
      amount: w.amount?.toString?.() ?? String(w.amount),
      status: updated?.status,
    },
  });

  await createUserNotification({
    userId: w.userId,
    kind: "withdrawal_claimed",
    payload: {
      withdrawalId: id,
      asset: w.asset,
    },
  });

  scheduleEmailTask(async () => {
    const locale = await resolveEmailLocale(req);
    await notifyWithdrawalClaimedEmail({
      userId: w.userId,
      withdrawalId: id,
      asset: w.asset,
      amount: w.amount?.toString?.() ?? String(w.amount),
      fee: w.fee?.toString?.() ?? String(w.fee),
      networkCanonical: w.networkCanonical,
      address: w.toAddress,
      locale,
    });
  });

  return NextResponse.json({ withdrawal: updated });
}
