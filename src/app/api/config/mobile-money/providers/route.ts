import { NextResponse } from "next/server";
import { hasFreshpayKeys } from "@/lib/env";
import { COD_MOBILE_FALLBACK } from "@/lib/cod-mobile-providers";

export async function GET() {
  if (!hasFreshpayKeys()) {
    return NextResponse.json({ ok: false, error: "wallet_fiat_unconfigured" }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    providers: COD_MOBILE_FALLBACK.map((p) => ({
      provider: p.provider,
      label: p.label,
      method: p.method,
    })),
  });
}
