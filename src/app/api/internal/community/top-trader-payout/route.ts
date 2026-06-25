import { NextResponse } from "next/server";
import { runTopTraderWeeklyPayout } from "@/lib/community/top-trader-payout-service";
import { getCronSecret } from "@/lib/pool-env";

export const dynamic = "force-dynamic";

/** Sunday 01:00 GMT — credit weekly Top Trader prize. */
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const result = await runTopTraderWeeklyPayout();
  return NextResponse.json(result);
}
