import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, deposits } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { depositConfirmSchema } from "@/lib/validation";
import { normalizeTxid } from "@/lib/networks";
import {
  applyConfirmedDeposit,
  markDepositFailed,
  verifyDepositTx,
} from "@/lib/deposit-verify";
import { DepositStatus } from "@/lib/status";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = depositConfirmSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const txidNorm = normalizeTxid(parsed.data.txid);
  const { id } = await ctx.params;
  const db = getDb();
  const [d] = await db
    .select()
    .from(deposits)
    .where(and(eq(deposits.id, id), eq(deposits.userId, userId)))
    .limit(1);
  if (!d) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    d.status !== DepositStatus.AWAITING_TXID &&
    d.status !== DepositStatus.PENDING_VALIDATION
  ) {
    return NextResponse.json(
      { error: "Deposit cannot accept TXID in this state" },
      { status: 409 },
    );
  }

  await db
    .update(deposits)
    .set({ status: DepositStatus.PENDING_VALIDATION })
    .where(eq(deposits.id, id));

  let result;
  try {
    result = await verifyDepositTx(d, txidNorm);
  } catch (e) {
    await db
      .update(deposits)
      .set({
        status: DepositStatus.AWAITING_TXID,
        failureReason:
          e instanceof Error ? e.message : "Validation error against exchange",
      })
      .where(eq(deposits.id, id));
    return NextResponse.json(
      {
        status: "error",
        message: e instanceof Error ? e.message : "Exchange lookup failed",
      },
      { status: 502 },
    );
  }

  if (result.ok) {
    try {
      await applyConfirmedDeposit({
        deposit: d,
        userId,
        txidNorm,
        amountStr: result.amount,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not finalize deposit";
      if (msg.includes("already used")) {
        return NextResponse.json({ status: "rejected", reason: msg }, { status: 409 });
      }
      await db
        .update(deposits)
        .set({ status: DepositStatus.AWAITING_TXID, failureReason: msg })
        .where(eq(deposits.id, id));
      return NextResponse.json({ status: "error", message: msg }, { status: 500 });
    }
    const [done] = await db
      .select()
      .from(deposits)
      .where(eq(deposits.id, id))
      .limit(1);
    return NextResponse.json({ status: "confirmed", deposit: done });
  }

  if (result.failed) {
    await markDepositFailed(id, userId, result.reason);
    const [failed] = await db
      .select()
      .from(deposits)
      .where(eq(deposits.id, id))
      .limit(1);
    return NextResponse.json({
      status: "failed",
      reason: result.reason,
      deposit: failed,
    });
  }

  // For manual PI deposits we accept TXID and keep it pending for staff review.
  if (d.provider === "manual" && d.asset.toUpperCase() === "PI") {
    await db
      .update(deposits)
      .set({
        status: DepositStatus.PENDING_VALIDATION,
        txid: txidNorm,
        failureReason: result.reason,
      })
      .where(eq(deposits.id, id));
    const [pending] = await db
      .select()
      .from(deposits)
      .where(eq(deposits.id, id))
      .limit(1);
    return NextResponse.json({ status: "pending", message: result.reason, deposit: pending });
  }

  await db
    .update(deposits)
    .set({
      status: DepositStatus.PENDING_VALIDATION,
      failureReason: result.reason,
    })
    .where(eq(deposits.id, id));
  return NextResponse.json({ status: "pending", message: result.reason });
}
