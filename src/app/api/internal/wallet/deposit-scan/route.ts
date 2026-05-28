import { NextResponse } from "next/server";
import { markExpiredSessionsNow } from "@/lib/wallet-deposit-sessions";
import { runDepositScanner } from "@/lib/wallet-deposit-scanner";
import { walletAutomationEnabled, walletCronSecret, walletDepositAutoEnabled } from "@/lib/usdt-wallet-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!walletCronSecret() || secret !== walletCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (!walletAutomationEnabled() || !walletDepositAutoEnabled()) {
    return NextResponse.json({ ok: true, skipped: "wallet_auto_deposit_disabled" });
  }
  try {
    const expired = await markExpiredSessionsNow();
    const out = await runDepositScanner();
    return NextResponse.json({ ok: true, expired, ...out });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const hint = message.includes("deposit_sessions")
      ? "Run drizzle migrations 0047 and 0048 on the database."
      : undefined;
    console.error("[wallet/deposit-scan]", message);
    return NextResponse.json(
      { ok: false, error: "deposit_scan_failed", message, hint },
      { status: 500 },
    );
  }
}
