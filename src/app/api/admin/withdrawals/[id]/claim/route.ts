import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { StaffAuthError, requireStaff } from "@/lib/session-user";
import { WithdrawalStatus } from "@/lib/status";

/**
 * Agent takes ownership of a pending withdrawal → PROCESSING.
 * Other agents see it as in progress (same ticket, new status).
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let staff;
  try {
    staff = await requireStaff();
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

  return NextResponse.json({ withdrawal: updated });
}
