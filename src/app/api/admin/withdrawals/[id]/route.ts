import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users, withdrawals } from "@/db";
import { StaffAuthError, requireStaff } from "@/lib/session-user";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [row] = await db
    .select({
      withdrawal: withdrawals,
      userEmail: users.email,
    })
    .from(withdrawals)
    .innerJoin(users, eq(withdrawals.userId, users.id))
    .where(eq(withdrawals.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    withdrawal: row.withdrawal,
    userEmail: row.userEmail,
  });
}
