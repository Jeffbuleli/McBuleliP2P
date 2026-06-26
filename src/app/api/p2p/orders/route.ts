import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { checkKycGate } from "@/lib/kyc-guard";
import { createOrder, listUserOrders } from "@/lib/p2p-service";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { recordFinancialAudit } from "@/lib/financial-audit";

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
  const limited = enforceApiRateLimit("p2p_order", userId, req);
  if (limited) return limited;
  const kyc = await checkKycGate(userId, "p2p_trade");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
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
  recordFinancialAudit({
    userId,
    action: "p2p_order_create",
    req,
    resourceType: "p2p_order",
    resourceId: r.orderId,
    meta: { adId: parsed.data.adId, fiatAmount: parsed.data.fiatAmount },
  });
  return NextResponse.json({ ok: true, orderId: r.orderId });
}
