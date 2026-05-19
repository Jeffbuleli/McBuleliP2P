import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { createOrder, listUserOrders } from "@/lib/p2p-service";

const postZ = z.object({
  adId: z.string().uuid(),
  fiatAmount: z.string().min(1),
  paymentMethodCode: z.string().min(2).max(32).optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await listUserOrders(userId);
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "p2p_invalid_limits" }, { status: 400 });
  }
  const r = await createOrder({
    takerId: userId,
    adId: parsed.data.adId,
    fiatAmountStr: parsed.data.fiatAmount,
    paymentMethodCode: parsed.data.paymentMethodCode,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, orderId: r.orderId });
}
