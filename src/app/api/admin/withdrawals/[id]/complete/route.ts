import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { adminCompleteWithdrawalSchema } from "@/lib/validation";
import { WithdrawalStatus } from "@/lib/status";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { createUserNotification } from "@/lib/notifications-service";

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

  const parsed = adminCompleteWithdrawalSchema.safeParse(await req.json());
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
      { message: "Complete only withdrawals in progress (claimed)." },
      { status: 409 },
    );
  }
  if (
    staff.role !== "super_admin" &&
    w.assignedToUserId !== staff.id
  ) {
    return NextResponse.json(
      { message: "Only the assigned agent or a super admin can complete." },
      { status: 403 },
    );
  }

  const [updated] = await db
    .update(withdrawals)
    .set({
      status: WithdrawalStatus.COMPLETED,
      txid: parsed.data.txid.trim(),
      agentNote: parsed.data.agentNote ?? null,
      processedByUserId: staff.id,
      completedAt: new Date(),
    })
    .where(eq(withdrawals.id, id))
    .returning();

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.WITHDRAWAL_COMPLETE,
    resourceType: "withdrawal",
    resourceId: id,
    meta: {
      txid: parsed.data.txid.trim(),
      asset: w.asset,
      amount: w.amount?.toString?.() ?? String(w.amount),
    },
  });

  await createUserNotification({
    userId: w.userId,
    kind: "withdrawal_completed",
    payload: {
      withdrawalId: id,
      asset: w.asset,
      amount: w.amount?.toString?.() ?? String(w.amount),
      txid: parsed.data.txid.trim(),
    },
  });

  return NextResponse.json({ withdrawal: updated });
}
