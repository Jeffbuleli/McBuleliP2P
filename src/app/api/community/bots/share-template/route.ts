import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { shareBotTemplateToFeed } from "@/lib/community/bot-template-share-service";
import { botAccessAllows } from "@/lib/bot-privilege";

const bodyZ = z.object({
  planId: z.enum(["dca_spot", "grid_spot", "futures_um"]),
  billing: z.enum(["demo", "live"]),
  templateId: z.enum([
    "dca_day_btc",
    "dca_swing_eth",
    "grid_day_btc",
    "grid_swing_sol",
    "fut_day_btc_long",
    "fut_swing_eth_long",
  ]),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { planId, billing, templateId } = parsed.data;
  const allowed = await botAccessAllows(userId, planId, billing);
  if (!allowed) {
    return NextResponse.json({ error: "bots_subscription_required" }, { status: 409 });
  }

  const result = await shareBotTemplateToFeed({
    userId,
    planId,
    billing,
    templateId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    postId: result.postId,
    post: result.post,
    feedPath: "/app/community/feed",
  });
}
