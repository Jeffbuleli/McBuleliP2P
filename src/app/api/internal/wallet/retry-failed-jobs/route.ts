import { NextResponse } from "next/server";
import { runRetryFailedJobs } from "@/lib/wallet-withdraw-queue";
import { walletCronSecret } from "@/lib/usdt-wallet-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!walletCronSecret() || secret !== walletCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const out = await runRetryFailedJobs();
  return NextResponse.json({ ok: true, ...out });
}
