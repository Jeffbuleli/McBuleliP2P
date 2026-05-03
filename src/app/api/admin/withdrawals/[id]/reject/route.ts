import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, users, withdrawals } from "@/db";
import { StaffAuthError, requireStaff } from "@/lib/session-user";
import { adminRejectWithdrawalSchema } from "@/lib/validation";
import { WithdrawalStatus } from "@/lib/status";

export async function POST(
  req: Request,
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
  if (w.status !== WithdrawalStatus.PENDING_AGENT) {
    return NextResponse.json(
      { message: "This withdrawal is not pending operator action." },
      { status: 409 },
    );
  }

  const amt = w.amount;

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        balance: sql`${users.balance} + ${amt}::numeric`,
      })
      .where(eq(users.id, w.userId));
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

  return NextResponse.json({ withdrawal: updated });
}
