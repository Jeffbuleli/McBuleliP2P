import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, deposits, users } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaffScope("withdrawals");
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
      id: deposits.id,
      userId: deposits.userId,
      userEmail: users.email,
      asset: deposits.asset,
      networkCanonical: deposits.networkCanonical,
      networkCex: deposits.networkCex,
      provider: deposits.provider,
      status: deposits.status,
      txid: deposits.txid,
      amount: deposits.amount,
      declaredAmountUsdt: deposits.declaredAmountUsdt,
      userNote: deposits.userNote,
      addressShown: deposits.addressShown,
      memoShown: deposits.memoShown,
      failureReason: deposits.failureReason,
      createdAt: deposits.createdAt,
      confirmedAt: deposits.confirmedAt,
    })
    .from(deposits)
    .innerJoin(users, eq(deposits.userId, users.id))
    .where(eq(deposits.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ deposit: row });
}
