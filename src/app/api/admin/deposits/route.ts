import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, deposits, users } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { DepositStatus } from "@/lib/status";

export async function GET(req: Request) {
  try {
    await requireStaffScope("withdrawals");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") ?? "pending";

  const statusCond =
    statusParam === "all"
      ? undefined
      : statusParam === "done"
        ? inArray(deposits.status, [
            DepositStatus.CONFIRMED,
            DepositStatus.FAILED,
          ])
        : eq(deposits.status, DepositStatus.PENDING_VALIDATION);

  const db = getDb();
  const rows = await db
    .select({
      id: deposits.id,
      userId: deposits.userId,
      userEmail: users.email,
      asset: deposits.asset,
      networkCanonical: deposits.networkCanonical,
      provider: deposits.provider,
      status: deposits.status,
      txid: deposits.txid,
      amount: deposits.amount,
      declaredAmountUsdt: deposits.declaredAmountUsdt,
      userNote: deposits.userNote,
      addressShown: deposits.addressShown,
      createdAt: deposits.createdAt,
    })
    .from(deposits)
    .innerJoin(users, eq(deposits.userId, users.id))
    .where(statusCond ? and(statusCond) : undefined)
    .orderBy(desc(deposits.createdAt))
    .limit(100);

  return NextResponse.json({ deposits: rows });
}
