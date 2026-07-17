import { NextResponse } from "next/server";
import { hasPawapayKeys } from "@/lib/env";
import { PawaPayProvider } from "@/lib/pawapay/provider";
import { handlePawapayCallback } from "@/lib/pawapay/handle-callback";

export const dynamic = "force-dynamic";

/**
 * PawaPay deposit + payout callbacks (configure both URLs to this path in the dashboard,
 * or point deposit/payout callback URLs here).
 * Docs: https://docs.pawapay.io/v2/docs/how_to_start
 */
export async function POST(req: Request) {
  if (!hasPawapayKeys()) {
    return NextResponse.json({ error: "pawapay_unconfigured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const payload = PawaPayProvider.parseCallback(req, body);
    const result = await handlePawapayCallback(payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ status: "Callback received successfully" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "callback_error";
    if (msg === "callback_ip_denied" || msg === "callback_secret_denied") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg === "missing_payment_id") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
