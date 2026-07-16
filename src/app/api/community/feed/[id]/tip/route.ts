import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import { tipCommunityBp } from "@/lib/community/tip-service";
import { COMMUNITY_TIP_BP } from "@/lib/reward-points-config";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  amount: z.number().int().positive(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (
    !(COMMUNITY_TIP_BP.amounts as readonly number[]).includes(parsed.data.amount)
  ) {
    return NextResponse.json({ error: "tip_invalid_amount" }, { status: 400 });
  }

  const result = await tipCommunityBp({
    tipperId: userId,
    postId: id,
    amount: parsed.data.amount,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    amount: result.amount,
    balance: result.tipperBalance,
  });
}
