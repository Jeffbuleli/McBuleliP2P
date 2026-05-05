import { NextResponse } from "next/server";
import { runLpPoolDailyDistribution } from "@/lib/lp-pool-service";
import { getCronSecret } from "@/lib/pool-env";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const out = await runLpPoolDailyDistribution();
  return NextResponse.json(out);
}

