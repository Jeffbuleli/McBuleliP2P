import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import type { P2pAdStatus } from "@/lib/p2p-config";
import { updateAdDetails, updateAdStatus } from "@/lib/p2p-service";

const patchZ = z
  .object({
    status: z.enum(["active", "paused", "closed"]).optional(),
    price: z.string().optional(),
    minFiat: z.string().optional(),
    maxFiat: z.string().optional(),
    terms: z.string().nullable().optional(),
  })
  .refine(
    (v) =>
      v.status != null ||
      v.price != null ||
      v.minFiat != null ||
      v.maxFiat != null ||
      v.terms !== undefined,
    { message: "empty_patch" },
  );

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "p2p_invalid_status" }, { status: 400 });
  }

  if (parsed.data.status) {
    const r = await updateAdStatus({
      userId,
      adId: id,
      status: parsed.data.status as P2pAdStatus,
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.message }, { status: 400 });
    }
  }

  const { price, minFiat, maxFiat, terms } = parsed.data;
  if (price != null || minFiat != null || maxFiat != null || terms !== undefined) {
    const r = await updateAdDetails({
      userId,
      adId: id,
      priceStr: price,
      minFiatStr: minFiat,
      maxFiatStr: maxFiat,
      terms,
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
