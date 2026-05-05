import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, loans, users, withdrawals } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { withdrawalSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { isValidAddressForNetwork } from "@/lib/address-format";
import { WithdrawalStatus } from "@/lib/status";
import {
  parseNetWithdrawal,
  parseNetWithdrawalPi,
} from "@/lib/withdraw-fees";
import { getPiOkxChain } from "@/lib/pi-constants";
import {
  isKycApproved,
  requiresKycForLargeWithdrawal,
} from "@/lib/kyc-policy";

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

  if (!isValidAddressForNetwork(body.address, body.network)) {
    return NextResponse.json(
      {
        message:
          "Destination address format is invalid for the selected network.",
      },
      { status: 400 },
    );
  }

  const amounts =
    body.asset === "PI"
      ? parseNetWithdrawalPi({ netAmountStr: body.amount })
      : parseNetWithdrawal({ netAmountStr: body.amount });

  if (!amounts.ok) {
    return NextResponse.json({ message: amounts.message }, { status: 400 });
  }

  const { net, fee, totalDebit } = amounts;
  const db = getDb();

  // Loans v1: block external withdrawals while a loan is open.
  const [openLoan] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(and(eq(loans.userId, userId), eq(loans.status, "open")))
    .limit(1);
  if (openLoan) {
    return NextResponse.json(
      { ok: false, message: "loan_withdraw_blocked" },
      { status: 403 },
    );
  }

  // KYC is currently "paused" (feature-flagged off). If enabled later, we only
  // require KYC for large withdrawals in selected partner corridors.
  const [me] = await db
    .select({
      countryCode: users.countryCode,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (
    body.asset === "USDT" &&
    requiresKycForLargeWithdrawal({
      userCountryCode: me?.countryCode ?? null,
      netAmountUsdt: Number(net),
    }) &&
    !isKycApproved(me?.kycStatus)
  ) {
    return NextResponse.json(
      {
        message:
          "KYC is required for large withdrawals in your country. Please contact support.",
      },
      { status: 403 },
    );
  }

  const networkCex =
    body.asset === "USDT"
      ? USDT_NETWORKS[body.network].binanceNetwork
      : getPiOkxChain();

  const w = await db.transaction(async (tx) => {
    if (body.asset === "PI") {
      const [deducted] = await tx
        .update(users)
        .set({
          piBalance: sql`${users.piBalance} - ${totalDebit}::numeric`,
        })
        .where(
          and(
            eq(users.id, userId),
            sql`${users.piBalance} >= ${totalDebit}::numeric`,
          ),
        )
        .returning({ piBalance: users.piBalance });

      if (!deducted) return null;

      const [row] = await tx
        .insert(withdrawals)
        .values({
          userId,
          provider: "manual",
          asset: body.asset,
          networkCanonical: body.network,
          networkCex,
          toAddress: body.address.trim(),
          memoTo: body.memo?.trim() || null,
          amount: net,
          fee,
          status: WithdrawalStatus.PENDING_AGENT,
        })
        .returning();
      return row;
    }

    const [deducted] = await tx
      .update(users)
      .set({
        balance: sql`${users.balance} - ${totalDebit}::numeric`,
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.balance} >= ${totalDebit}::numeric`,
        ),
      )
      .returning({ balance: users.balance });

    if (!deducted) return null;

    const [row] = await tx
      .insert(withdrawals)
      .values({
        userId,
        provider: "manual",
        asset: body.asset,
        networkCanonical: body.network,
        networkCex,
        toAddress: body.address.trim(),
        memoTo: body.memo?.trim() || null,
        amount: net,
        fee,
        status: WithdrawalStatus.PENDING_AGENT,
      })
      .returning();
    return row;
  });

  if (!w) {
    return NextResponse.json(
      {
        message:
          "Insufficient balance (remember the fixed fee is added to the net amount).",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    withdrawal: w,
    message:
      "Withdrawal queued. Our team will process it and you will see the on-chain TXID once sent.",
  });
}
