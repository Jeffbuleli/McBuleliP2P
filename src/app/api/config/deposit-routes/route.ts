import { NextResponse } from "next/server";
import { getWalletRailsSnapshot } from "@/lib/wallet-rails";

/** Which on-ramp flows are configured server-side. */
export async function GET() {
  try {
    const rails = await getWalletRailsSnapshot();
    return NextResponse.json({
      ...rails,
      /** @deprecated use usdtBinance */
      enabled: rails.usdtBinance || rails.piManual,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "wallet_rails_error";
    return NextResponse.json(
      { ok: false, error: "wallet_rails_error", detail },
      { status: 503 },
    );
  }
}
