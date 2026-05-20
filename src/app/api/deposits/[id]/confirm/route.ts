import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getDb, deposits, txidLedger } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { depositConfirmSchema } from "@/lib/validation";
import { normalizeTxid } from "@/lib/networks";
import { createUserNotification } from "@/lib/notifications-service";
import { notifyStaffWithdrawalsScope } from "@/lib/staff-notifications";
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

  const [ledgerDup] = await db
    .select({ txidNorm: txidLedger.txidNorm })
    .from(txidLedger)
    .where(eq(txidLedger.txidNorm, txidNorm))
    .limit(1);
  if (ledgerDup) {
    return NextResponse.json(
      { status: "rejected", reason: "This TXID was already used." },
      { status: 409 },
    );
  }

  const [otherDeposit] = await db
    .select({ id: deposits.id })
    .from(deposits)
    .where(
      and(
        eq(deposits.txid, txidNorm),
        ne(deposits.id, id),
        ne(deposits.status, DepositStatus.FAILED),
      ),
    )
    .limit(1);
  if (otherDeposit) {
    return NextResponse.json(
      { status: "rejected", reason: "This TXID is already linked to another deposit." },
      { status: 409 },
    );
  }

  const pendingMessage =
    d.asset.toUpperCase() === "PI"
      ? "TXID received. Our team will verify it on the Pi explorer before crediting your balance."
      : "TXID received. Our team will verify the transfer before crediting your balance.";

  const [pending] = await db
    .update(deposits)
    .set({
      status: DepositStatus.PENDING_VALIDATION,
      txid: txidNorm,
      failureReason: null,
    })
    .where(eq(deposits.id, id))
    .returning();

  await createUserNotification({
    userId,
    kind: "deposit_validation_pending",
    payload: { depositId: id, asset: d.asset },
  });

  await notifyStaffWithdrawalsScope({
    kind: "admin_deposit_review",
    payload: { depositId: id, asset: d.asset },
  });

  return NextResponse.json({
    status: "pending",
    message: pendingMessage,
    deposit: pending,
  });
}
