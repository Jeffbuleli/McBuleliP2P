import { NextResponse } from "next/server";
import { processFuturesRiskForAllUsers } from "@/lib/trade-futures-service";
import { getHouseRiskSnapshot } from "@/lib/trade-house-risk";
import { maybeSendHouseStressAlert } from "@/lib/trade-house-alerts";
import { getCronSecret } from "@/lib/pool-env";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const result = await processFuturesRiskForAllUsers();
  const snap = await getHouseRiskSnapshot();
  void maybeSendHouseStressAlert(snap).catch(() => undefined);
  return NextResponse.json({ ok: true, ...result, houseAlertLevel: snap.alertLevel });
}

