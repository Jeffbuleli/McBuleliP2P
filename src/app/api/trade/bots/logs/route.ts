import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isBotPlanId } from "@/lib/bot-config";
import { listBotExecutionLogs } from "@/lib/bot-instance-service";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const planParam = searchParams.get("planId");
  const planId =
    planParam && isBotPlanId(planParam) ? planParam : undefined;
  const logs = await listBotExecutionLogs(userId, planId, 40);
  return NextResponse.json({ logs });
}
