import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isBotPlanId } from "@/lib/bot-config";
import { listBotExecutionLogs } from "@/lib/bot-instance-service";

export const dynamic = "force-dynamic";

/** @deprecated Use per-strategy logs + positions on the bots page. */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planParam = new URL(req.url).searchParams.get("planId");
  if (!planParam || !isBotPlanId(planParam)) {
    return NextResponse.json({ error: "planId required" }, { status: 400 });
  }

  const logs = await listBotExecutionLogs(userId, planParam, 20);
  return NextResponse.json({
    planId: planParam,
    logs,
    simulated: false,
    polledAt: new Date().toISOString(),
  });
}
