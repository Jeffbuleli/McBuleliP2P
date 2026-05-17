import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isBotPlanId, type BotBillingMode } from "@/lib/bot-config";
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
  const billingParam = searchParams.get("billing");
  const billing: BotBillingMode | undefined =
    billingParam === "demo" || billingParam === "live"
      ? billingParam
      : undefined;
  const logs = await listBotExecutionLogs(userId, planId, 40, billing);
  return NextResponse.json({ logs, billing: billing ?? null });
}
