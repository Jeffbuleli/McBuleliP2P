import { NextResponse } from "next/server";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";
import { getAdminFuturesTradeStats } from "@/lib/trade-futures-stats";
import { getHouseRiskSnapshot } from "@/lib/trade-house-risk";
import { maybeSendHouseStressAlert } from "@/lib/trade-house-alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const [stats, house] = await Promise.all([
    getAdminFuturesTradeStats(),
    getHouseRiskSnapshot(),
  ]);
  void maybeSendHouseStressAlert(house).catch(() => undefined);
  return NextResponse.json({ ok: true, stats, house });
}
