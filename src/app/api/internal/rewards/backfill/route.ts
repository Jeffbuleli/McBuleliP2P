import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/pool-env";
import { backfillAllUserRewardPoints } from "@/lib/reward-points-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** One-shot / periodic reconcile — credits missing BP for all eligible users. */
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const out = await backfillAllUserRewardPoints();
  return NextResponse.json({ ok: true, ...out });
}
