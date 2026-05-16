import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, deposits } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { adminApproveDepositSchema } from "@/lib/validation";
import { DepositStatus } from "@/lib/status";
import { applyConfirmedDeposit } from "@/lib/deposit-verify";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { fmtWalletAmount } from "@/lib/wallet-types";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let staff;
  try {
    staff = await requireStaffScope("withdrawals");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const parsed = adminApproveDepositSchema.safeParse(await req.json());
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Invalid payload";
    return NextResponse.json({ message: first }, { status: 400 });
  }

  const amountNum = Number(parsed.data.amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [d] = await db.select().from(deposits).where(eq(deposits.id, id)).limit(1);

  if (!d) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (d.status !== DepositStatus.PENDING_VALIDATION) {
    return NextResponse.json(
      { message: "Only pending deposits can be approved." },
      { status: 409 },
    );
  }
  if (!d.txid?.trim()) {
    return NextResponse.json(
      { message: "Deposit has no TXID from the user." },
      { status: 409 },
    );
  }

  const amountStr = fmtWalletAmount(amountNum);
  const txidNorm = d.txid.trim();

  try {
    await applyConfirmedDeposit({
      deposit: d,
      userId: d.userId,
      txidNorm,
      amountStr,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not credit deposit";
    return NextResponse.json({ message: msg }, { status: 409 });
  }

  const [updated] = await db
    .select()
    .from(deposits)
    .where(eq(deposits.id, id))
    .limit(1);

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.DEPOSIT_APPROVE,
    resourceType: "deposit",
    resourceId: id,
    meta: {
      amount: amountStr,
      txid: txidNorm,
      agentNote: parsed.data.agentNote ?? null,
    },
  });

  return NextResponse.json({ deposit: updated });
}
