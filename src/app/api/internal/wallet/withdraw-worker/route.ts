import { NextResponse } from "next/server";
import { runRetryFailedJobs, runWithdrawalWorker } from "@/lib/wallet-withdraw-queue";
import { walletAutomationEnabled, walletCronSecret, walletWithdrawAutoEnabled } from "@/lib/usdt-wallet-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!walletCronSecret() || secret !== walletCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (!walletAutomationEnabled() || !walletWithdrawAutoEnabled()) {
    return NextResponse.json({ ok: true, skipped: "wallet_auto_withdraw_disabled" });
  }
  const retried = await runRetryFailedJobs();
  const out = await runWithdrawalWorker(25);
  return NextResponse.json({ ok: true, retried: retried.reopened, ...out });
}
