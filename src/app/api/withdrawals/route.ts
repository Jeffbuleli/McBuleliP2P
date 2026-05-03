import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, users, withdrawals } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { withdrawalSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { isValidAddressForNetwork } from "@/lib/address-format";
import { getMinWithdraw } from "@/lib/env";
import { WithdrawalStatus } from "@/lib/status";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const list = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.userId, userId))
    .orderBy(desc(withdrawals.createdAt))
    .limit(50);
  return NextResponse.json({ withdrawals: list });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = withdrawalSchema.safeParse(await req.json());
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first =
      Object.values(flat.fieldErrors).flat()[0] ?? "Invalid withdrawal request.";
    return NextResponse.json(
      { message: first, fieldErrors: flat.fieldErrors },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const amt = body.amount;

  if (!isValidAddressForNetwork(body.address, body.network)) {
    return NextResponse.json(
      {
        message:
          "Destination address format is invalid for the selected network.",
      },
      { status: 400 },
    );
  }

  const min = getMinWithdraw(body.asset);
  if (Number(amt) < min) {
    return NextResponse.json(
      { message: `Minimum withdrawal is ${min} ${body.asset}` },
      { status: 400 },
    );
  }

  const netSpec = USDT_NETWORKS[body.network];
  const db = getDb();

  const w = await db.transaction(async (tx) => {
    const [deducted] = await tx
      .update(users)
      .set({
        balance: sql`${users.balance} - ${amt}::numeric`,
      })
      .where(and(eq(users.id, userId), sql`${users.balance} >= ${amt}::numeric`))
      .returning({ balance: users.balance });

    if (!deducted) {
      return null;
    }

    const [row] = await tx
      .insert(withdrawals)
      .values({
        userId,
        provider: "manual",
        asset: body.asset,
        networkCanonical: body.network,
        networkCex: netSpec.binanceNetwork,
        toAddress: body.address.trim(),
        memoTo: body.memo?.trim() || null,
        amount: amt,
        status: WithdrawalStatus.PENDING_AGENT,
      })
      .returning();
    return row;
  });

  if (!w) {
    return NextResponse.json({ message: "Insufficient balance" }, { status: 400 });
  }

  return NextResponse.json({
    withdrawal: w,
    message:
      "Withdrawal submitted. Our team will process it and you will see the on-chain TXID once sent.",
  });
}
