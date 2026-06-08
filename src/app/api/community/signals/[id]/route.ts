import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import { closeTradingSignal } from "@/lib/community/signals-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const closeZ = z.object({
  outcome: z.enum(["win", "loss", "neutral"]),
});

export async function PATCH(
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
  const parsed = closeZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await closeTradingSignal({
    signalId: id,
    authorId: userId,
    outcome: parsed.data.outcome,
  });

  if (!result.ok) {
    const status =
      result.error === "forbidden"
        ? 403
        : result.error === "not_found"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    signal: result.signal,
    bpGranted: result.bpGranted,
  });
}
