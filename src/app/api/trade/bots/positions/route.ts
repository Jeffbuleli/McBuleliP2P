import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isBotPlanId, type BotBillingMode } from "@/lib/bot-config";
import { botAccessAllows, resolveBotSubscription } from "@/lib/bot-privilege";
import { listUserBotInstances } from "@/lib/bot-instance-service";
import { fetchBotOpenPositions } from "@/lib/bot-positions-service";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const planParam = searchParams.get("planId");
  if (!planParam || !isBotPlanId(planParam)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const sub = await resolveBotSubscription(userId, planParam);
  if (!sub) {
    return NextResponse.json({ open: [], error: "bots_subscription_required" });
  }

  const instances = await listUserBotInstances(userId);
  const inst = instances.find((i) => i.planId === planParam);
  if (!inst) {
    return NextResponse.json({ open: [] });
  }

  const billingParam = searchParams.get("billing");
  let billing = inst.billing as BotBillingMode;
  if (billingParam === "demo" || billingParam === "live") {
    const allowed = await botAccessAllows(
      userId,
      planParam,
      billingParam,
    );
    if (!allowed) {
      return NextResponse.json(
        { open: [], error: "bots_subscription_required" },
        { status: 409 },
      );
    }
    billing = billingParam;
  }

  const result = await fetchBotOpenPositions({
    userId,
    planId: planParam,
    billing,
    config: inst.config,
  });

  return NextResponse.json({
    ...result,
    billing,
    instanceBilling: inst.billing,
  });
}
