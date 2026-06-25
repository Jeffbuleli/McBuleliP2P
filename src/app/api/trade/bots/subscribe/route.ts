import { NextResponse } from "next/server";
import { z } from "zod";
import { checkKycGate } from "@/lib/kyc-guard";
import { getSessionUserId } from "@/lib/session";
import { purchaseBotSubscription } from "@/lib/bot-subscription-service";

const bodyZ = z.object({
  planId: z.enum(["dca_spot", "grid_spot", "futures_um"]),
  billing: z.enum(["demo", "live"]),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bots_invalid_body" }, { status: 400 });
  }

  if (parsed.data.billing === "live") {
    const kyc = await checkKycGate(userId, "trade_bots");
    if (!kyc.ok) {
      return NextResponse.json({ error: kyc.error }, { status: 403 });
    }
  }

  const r = await purchaseBotSubscription({
    userId,
    planId: parsed.data.planId,
    billing: parsed.data.billing,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, subscription: r.subscription });
}
