import { NextResponse } from "next/server";
import { runHackathonHoldMaintenance } from "@/lib/hackathon/hold-maintenance";
import { walletCronSecret } from "@/lib/usdt-wallet-features";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!walletCronSecret() || secret !== walletCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const out = await runHackathonHoldMaintenance();
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[hackathon/holds]", message);
    return NextResponse.json(
      { ok: false, error: "hackathon_holds_failed", message },
      { status: 500 },
    );
  }
}
