import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  cancelOrder,
  markOrderPaid,
  openOrderDispute,
  releaseOrder,
} from "@/lib/p2p-service";

const bodyZ = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("mark_paid"),
    paymentReference: z.string().max(512).optional(),
    paymentProofNote: z.string().max(4000).optional(),
  }),
  z.object({
    action: z.literal("open_dispute"),
    reason: z.string().min(3).max(4000),
  }),
  z.object({ action: z.literal("release") }),
  z.object({ action: z.literal("cancel") }),
]);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "p2p_action_not_allowed" }, { status: 400 });
  }

  let r: { ok: true } | { ok: false; message: string };
  switch (parsed.data.action) {
    case "mark_paid":
      r = await markOrderPaid({
        orderId: id,
        userId,
        paymentReference: parsed.data.paymentReference,
        paymentProofNote: parsed.data.paymentProofNote,
      });
      break;
    case "open_dispute":
      r = await openOrderDispute({
        orderId: id,
        userId,
        reason: parsed.data.reason,
      });
      break;
    case "release":
      r = await releaseOrder({ orderId: id, userId });
      break;
    case "cancel":
      r = await cancelOrder({ orderId: id, userId });
      break;
    default:
      r = { ok: false, message: "p2p_action_not_allowed" };
  }

  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
