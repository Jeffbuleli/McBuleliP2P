import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { eavecMarketOrderAction } from "@/lib/eavec-market/orders";

const bodyZ = z.object({
  action: z.enum(["mark_ready", "confirm", "cancel", "dispute"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = enforceApiRateLimit("eavec_market_order", userId, req);
  if (limited) return limited;

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "eavec_market_invalid" }, { status: 400 });
  }

  const r = await eavecMarketOrderAction({
    orderId: id,
    userId,
    action: parsed.data.action,
    reason: parsed.data.reason,
  });
  if (!r.ok) {
    const status = r.error === "forbidden" ? 403 : 400;
    return NextResponse.json({ error: r.error }, { status });
  }
  return NextResponse.json({ ok: true });
}
