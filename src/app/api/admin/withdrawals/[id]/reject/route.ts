import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, users, withdrawals } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { adminRejectWithdrawalSchema } from "@/lib/validation";
import { WithdrawalStatus } from "@/lib/status";
import { totalDebitedFromRow } from "@/lib/withdraw-fees";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";

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
  if (w.status !== WithdrawalStatus.PROCESSING) {
    return NextResponse.json(
      { message: "Reject only withdrawals in progress (claimed)." },
      { status: 409 },
    );
  }
  if (
    staff.role !== "super_admin" &&
    w.assignedToUserId !== staff.id
  ) {
    return NextResponse.json(
      { message: "Only the assigned agent or a super admin can reject." },
      { status: 403 },
    );
  }

  const refund = totalDebitedFromRow(w);
  const isPi = w.asset.toUpperCase() === "PI";

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
        failureReason: parsed.data.reason.trim(),
        processedByUserId: staff.id,
        completedAt: new Date(),
      })
      .where(eq(withdrawals.id, id));
  });

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
      reason: parsed.data.reason.trim(),
      asset: w.asset,
      refundApprox: refund,
    },
  });

  return NextResponse.json({ withdrawal: updated });
}
