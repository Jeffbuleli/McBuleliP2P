import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, users, withdrawals } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { withdrawalSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { isValidAddressForNetwork } from "@/lib/address-format";
import { getMinWithdraw } from "@/lib/env";
import { binanceWithdraw } from "@/lib/binance";
import { okxWithdraw } from "@/lib/okx";
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
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const amt = body.amount;

  if (!isValidAddressForNetwork(body.address, body.network)) {
    return NextResponse.json(
      { error: "Destination address format is invalid for the selected network." },
      { status: 400 },
    );
  }

  const min = getMinWithdraw(body.asset);
  if (Number(amt) < min) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${min} ${body.asset}` },
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
        provider: body.provider,
        asset: body.asset,
        networkCanonical: body.network,
        networkCex:
          body.provider === "binance" ? netSpec.binanceNetwork : netSpec.okxChain,
        toAddress: body.address.trim(),
        memoTo: body.memo?.trim() || null,
        amount: amt,
        status: WithdrawalStatus.PROCESSING,
      })
      .returning();
    return row;
  });

  if (!w) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  try {
    if (body.provider === "binance") {
      const res = await binanceWithdraw({
        coin: body.asset,
        network: body.network,
        address: body.address.trim(),
        amount: amt,
        tag: body.memo?.trim() || undefined,
      });
      const extId = typeof res === "object" && res && "id" in res ? String(res.id) : JSON.stringify(res);
      const [updated] = await db
        .update(withdrawals)
        .set({
          externalId: extId,
          status: WithdrawalStatus.COMPLETED,
          completedAt: new Date(),
        })
        .where(eq(withdrawals.id, w.id))
        .returning();
      return NextResponse.json({ withdrawal: updated });
    }

    const ext = await okxWithdraw({
      ccy: body.asset,
      amt: amt,
      chain: netSpec.okxChain,
      toAddr: body.address.trim(),
      tag: body.memo?.trim() || undefined,
    });
    const [updated] = await db
      .update(withdrawals)
      .set({
        externalId: ext.wdId,
        status: WithdrawalStatus.COMPLETED,
        completedAt: new Date(),
      })
      .where(eq(withdrawals.id, w.id))
      .returning();
    return NextResponse.json({ withdrawal: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Withdrawal failed";
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} + ${amt}::numeric`,
        })
        .where(eq(users.id, userId));
      await tx
        .update(withdrawals)
        .set({
          status: WithdrawalStatus.FAILED,
          failureReason: msg,
        })
        .where(eq(withdrawals.id, w.id));
    });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
