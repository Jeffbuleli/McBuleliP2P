import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { BOT_PLANS, type BotPlanId } from "@/lib/bot-config";
import { botDcaConfigSchema } from "@/lib/bot-dca-config";
import { getActiveBotSubscription } from "@/lib/bot-subscription-service";
import {
  listUserBotInstances,
  upsertBotInstance,
  validateInstanceConfig,
} from "@/lib/bot-instance-service";

const bodyZ = z.object({
  planId: z.enum(["dca_spot", "grid_spot", "futures_um"]),
  billing: z.enum(["demo", "live"]),
  status: z.enum(["active", "paused"]),
  config: z.record(z.string(), z.unknown()),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const instances = await listUserBotInstances(userId);
  return NextResponse.json({ instances });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bots_invalid_body" }, { status: 400 });
  }

  const { planId, billing, status, config } = parsed.data;
  const sub = await getActiveBotSubscription(userId, planId as BotPlanId);
  if (!sub || sub.billing !== billing) {
    return NextResponse.json(
      { error: "bots_subscription_required" },
      { status: 409 },
    );
  }

  if (planId === "dca_spot") {
    const dcaParsed = botDcaConfigSchema.safeParse(config);
    if (!dcaParsed.success) {
      return NextResponse.json(
        { error: "bots_invalid_dca_config" },
        { status: 400 },
      );
    }
  } else if (status === "active") {
    return NextResponse.json(
      { error: "bots_strategy_not_implemented" },
      { status: 400 },
    );
  }

  const valid = validateInstanceConfig(planId as BotPlanId, config);
  if (!valid.ok) {
    return NextResponse.json({ error: valid.message }, { status: 400 });
  }

  const plan = BOT_PLANS[planId as BotPlanId];
  if (status === "active" && plan.requiresSpot) {
    /* keys checked at tick */
  }

  const instance = await upsertBotInstance({
    userId,
    planId: planId as BotPlanId,
    billing,
    status,
    config,
  });

  return NextResponse.json({ ok: true, instance });
}
