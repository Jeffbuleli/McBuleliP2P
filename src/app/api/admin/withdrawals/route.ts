import { NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, users, withdrawals } from "@/db";
import { StaffAuthError, requireStaff } from "@/lib/session-user";
import { WithdrawalStatus } from "@/lib/status";

export async function GET(req: Request) {
  let staff;
  try {
    staff = await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const statusParam =
    searchParams.get("status") ?? WithdrawalStatus.PENDING_AGENT;

  const assignFilter = searchParams.get("assignFilter") ?? "all";

  const assignee = alias(users, "withdrawal_assignee");

  let statusCond =
    statusParam === "active"
      ? inArray(withdrawals.status, [
          WithdrawalStatus.PENDING_AGENT,
          WithdrawalStatus.PROCESSING,
        ])
      : eq(withdrawals.status, statusParam);

  const conditions = [statusCond];

  if (assignFilter === "unassigned") {
    conditions.push(isNull(withdrawals.assignedToUserId));
  } else if (assignFilter === "mine") {
    conditions.push(eq(withdrawals.assignedToUserId, staff.id));
  }

  const db = getDb();
  const rows = await db
    .select({
      id: withdrawals.id,
      userId: withdrawals.userId,
      userEmail: users.email,
      asset: withdrawals.asset,
      networkCanonical: withdrawals.networkCanonical,
      networkCex: withdrawals.networkCex,
      toAddress: withdrawals.toAddress,
      memoTo: withdrawals.memoTo,
      amount: withdrawals.amount,
      fee: withdrawals.fee,
      status: withdrawals.status,
      txid: withdrawals.txid,
      assignedToUserId: withdrawals.assignedToUserId,
      assigneeEmail: assignee.email,
      createdAt: withdrawals.createdAt,
      completedAt: withdrawals.completedAt,
    })
    .from(withdrawals)
    .innerJoin(users, eq(withdrawals.userId, users.id))
    .leftJoin(assignee, eq(withdrawals.assignedToUserId, assignee.id))
    .where(and(...conditions))
    .orderBy(desc(withdrawals.createdAt))
    .limit(100);

  return NextResponse.json({ withdrawals: rows });
}
