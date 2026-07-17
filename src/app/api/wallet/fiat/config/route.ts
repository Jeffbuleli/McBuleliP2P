import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { hasFreshpayCardKeys, hasPawapayKeys } from "@/lib/env";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paused = isFiatDepositWithdrawPaused();
  return NextResponse.json({
    ok: true,
    paused,
    mobileMoney: !paused && hasPawapayKeys(),
    card: !paused && hasFreshpayCardKeys(),
  });
}
