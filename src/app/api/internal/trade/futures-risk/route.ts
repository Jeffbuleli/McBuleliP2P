import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, tradeFuturesPositions } from "@/db";
import { processFuturesRisk } from "@/lib/trade-futures-service";
import { getCronSecret } from "@/lib/pool-env";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const open = await db
    .select({ userId: tradeFuturesPositions.userId })
    .from(tradeFuturesPositions)
    .where(eq(tradeFuturesPositions.status, "open"))
    .limit(5000);

  const userIds = Array.from(new Set(open.map((r) => r.userId)));

  let ok = 0;
  let failed = 0;
  for (const userId of userIds) {
    try {
      await processFuturesRisk(userId);
      ok += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    usersWithOpenPositions: userIds.length,
    processedOk: ok,
    processedFailed: failed,
  });
}

