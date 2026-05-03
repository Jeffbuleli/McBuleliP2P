import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { StaffAuthError, requireStaff } from "@/lib/session-user";
import { adminCompleteWithdrawalSchema } from "@/lib/validation";
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
  if (w.status !== WithdrawalStatus.PENDING_AGENT) {
    return NextResponse.json(
      { message: "This withdrawal is not pending operator action." },
      { status: 409 },
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

  return NextResponse.json({ withdrawal: updated });
}
