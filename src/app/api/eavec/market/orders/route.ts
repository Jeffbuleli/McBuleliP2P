import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { checkKycGate } from "@/lib/kyc-guard";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import {
  createEavecMarketOrder,
  listEavecMarketOrdersForUser,
} from "@/lib/eavec-market/orders";

const createZ = z.object({
  listingId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999).optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await listEavecMarketOrdersForUser(userId);
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = enforceApiRateLimit("eavec_market_order", userId, req);
  if (limited) return limited;

  const kyc = await checkKycGate(userId, "groups");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "eavec_market_invalid" }, { status: 400 });
  }

  const r = await createEavecMarketOrder({
    buyerUserId: userId,
    listingId: parsed.data.listingId,
    quantity: parsed.data.quantity,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: r.id });
}
