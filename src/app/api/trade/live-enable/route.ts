import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { checkKycGate } from "@/lib/kyc-guard";
import { enableTradeLive } from "@/lib/trade-mode";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kyc = await checkKycGate(userId, "trade_live");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }
  const ok = await enableTradeLive(userId);
  if (!ok) {
    return NextResponse.json({ error: "Failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
