import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import {
  getActiveBotCopyFollow,
  startBotCopyFollow,
  stopBotCopyFollow,
} from "@/lib/community/bot-copy-follow-service";

const postZ = z.object({
  leadUserId: z.string().uuid(),
  planId: z.enum(["dca_spot", "grid_spot", "futures_um"]),
  billing: z.enum(["demo", "live"]),
  sizingRatio: z.number().min(0.1).max(1).optional(),
});

const deleteZ = z.object({
  planId: z.enum(["dca_spot", "grid_spot", "futures_um"]),
  billing: z.enum(["demo", "live"]),
});

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const planId = (searchParams.get("planId") ?? "futures_um") as BotPlanId;
  const billing = (searchParams.get("billing") === "live" ? "live" : "demo") as BotBillingMode;

  try {
    const follow = await getActiveBotCopyFollow({ followerId: userId, planId, billing });
    return NextResponse.json({ follow });
  } catch (e) {
    console.error("[community/bots/copy-follow GET]", e);
    return NextResponse.json({ follow: null });
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await startBotCopyFollow({
      followerId: userId,
      leadUserId: parsed.data.leadUserId,
      planId: parsed.data.planId,
      billing: parsed.data.billing,
      sizingRatio: parsed.data.sizingRatio,
    });

    if (!result.ok) {
      const status =
        result.error === "kyc_required" || result.error === "bots_copy_lead_kyc"
          ? 403
          : result.error === "bots_subscription_required"
            ? 409
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, follow: result.follow });
  } catch (e) {
    console.error("[community/bots/copy-follow POST]", e);
    return NextResponse.json({ error: "bots_copy_failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = deleteZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await stopBotCopyFollow({
      followerId: userId,
      planId: parsed.data.planId,
      billing: parsed.data.billing,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[community/bots/copy-follow DELETE]", e);
    return NextResponse.json({ error: "bots_copy_failed" }, { status: 500 });
  }
}
