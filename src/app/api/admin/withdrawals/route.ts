import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, users, withdrawals } from "@/db";
import { StaffAuthError, requireStaff } from "@/lib/session-user";
import { WithdrawalStatus } from "@/lib/status";

export async function GET(req: Request) {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const status =
    searchParams.get("status") ?? WithdrawalStatus.PENDING_AGENT;

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
      status: withdrawals.status,
      txid: withdrawals.txid,
      createdAt: withdrawals.createdAt,
      completedAt: withdrawals.completedAt,
    })
    .from(withdrawals)
    .innerJoin(users, eq(withdrawals.userId, users.id))
    .where(eq(withdrawals.status, status))
    .orderBy(desc(withdrawals.createdAt))
    .limit(100);

  return NextResponse.json({ withdrawals: rows });
}
