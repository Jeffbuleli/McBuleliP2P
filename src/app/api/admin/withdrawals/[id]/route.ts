import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, users, withdrawals } from "@/db";
import {
  StaffAuthError,
  requireStaffScope,
  type SessionUser,
} from "@/lib/session-user";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let staff: SessionUser;
  try {
    staff = await requireStaffScope("withdrawals");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { id } = await ctx.params;
  const assignee = alias(users, "withdrawal_assignee");
  const db = getDb();
  const [row] = await db
    .select({
      withdrawal: withdrawals,
      userEmail: users.email,
      assigneeEmail: assignee.email,
    })
    .from(withdrawals)
    .innerJoin(users, eq(withdrawals.userId, users.id))
    .leftJoin(assignee, eq(withdrawals.assignedToUserId, assignee.id))
    .where(eq(withdrawals.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    withdrawal: row.withdrawal,
    userEmail: row.userEmail,
    assigneeEmail: row.assigneeEmail,
    viewer: { id: staff.id, role: staff.role },
  });
}
