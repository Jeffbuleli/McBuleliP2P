import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { rateEavecMarketOrder } from "@/lib/eavec-market/merchant";

const bodyZ = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
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

  const r = await rateEavecMarketOrder({
    orderId: id,
    fromUserId: userId,
    stars: parsed.data.stars,
    comment: parsed.data.comment,
  });
  if (!r.ok) {
    const status = r.error === "forbidden" ? 403 : 400;
    return NextResponse.json({ error: r.error }, { status });
  }
  return NextResponse.json({ ok: true });
}
