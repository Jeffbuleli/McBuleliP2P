import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { fetchReferenceRates } from "@/lib/reference-rates";

/** Reference prices for wallet calculators (authenticated). */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const r = await fetchReferenceRates();
  return NextResponse.json({
    usdtPerUsd: r.usdtUsd,
    cdfPerUsd: r.cdfPerUsd,
    piPerUsd: r.piUsd,
  });
}
