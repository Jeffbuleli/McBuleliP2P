import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isBotPlanId } from "@/lib/bot-config";
import { getActiveBotSubscription } from "@/lib/bot-subscription-service";
import { listUserBotInstances } from "@/lib/bot-instance-service";
import { fetchBotOpenPositions } from "@/lib/bot-positions-service";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planParam = new URL(req.url).searchParams.get("planId");
  if (!planParam || !isBotPlanId(planParam)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const sub = await getActiveBotSubscription(userId, planParam);
  if (!sub) {
    return NextResponse.json({ open: [], error: "bots_subscription_required" });
  }

  const instances = await listUserBotInstances(userId);
  const inst = instances.find((i) => i.planId === planParam);
  if (!inst) {
    return NextResponse.json({ open: [] });
  }

  const result = await fetchBotOpenPositions({
    userId,
    planId: planParam,
    billing: sub.billing,
    config: inst.config,
  });

  return NextResponse.json(result);
}
