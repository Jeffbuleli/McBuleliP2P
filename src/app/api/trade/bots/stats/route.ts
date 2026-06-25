import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { getBotInstanceStats } from "@/lib/bot-instance-stats-service";
import { botAccessAllows } from "@/lib/bot-privilege";

const queryZ = z.object({
  planId: z.enum(["dca_spot", "grid_spot", "futures_um"]),
  billing: z.enum(["demo", "live"]),
});

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = queryZ.safeParse({
    planId: searchParams.get("planId"),
    billing: searchParams.get("billing"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const { planId, billing } = parsed.data;
  const allowed = await botAccessAllows(userId, planId, billing);
  if (!allowed) {
    return NextResponse.json({ error: "bots_subscription_required" }, { status: 409 });
  }

  const stats = await getBotInstanceStats({ userId, planId, billing });
  return NextResponse.json({ stats });
}
