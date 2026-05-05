import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { repayLoan } from "@/lib/loans-service";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | {
    loanId?: string;
    amountUsdt?: string;
  };

  const loanId = body?.loanId ?? "";
  const amountUsdt = body?.amountUsdt ?? "";
  if (!loanId) return NextResponse.json({ ok: false, message: "loan_not_found" }, { status: 400 });

  try {
    const res = await repayLoan({ userId, loanId, amountUsdtStr: amountUsdt });
    if (!res.ok) return NextResponse.json(res, { status: 400 });
    return NextResponse.json(res);
  } catch (e) {
    const msg = typeof (e as { message?: unknown })?.message === "string" ? (e as { message: string }).message : "";
    if (msg === "wallet_insufficient_balance") {
      return NextResponse.json({ ok: false, message: msg }, { status: 400 });
    }
    throw e;
  }
}

