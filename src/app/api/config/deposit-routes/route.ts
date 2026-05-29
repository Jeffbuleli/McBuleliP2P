import { NextResponse } from "next/server";
import { isSuperAdminUserId } from "@/lib/bot-super-admin";
import { getWalletRailsSnapshot } from "@/lib/wallet-rails";
import { getSessionUserId } from "@/lib/session";

/** Which on-ramp flows are configured server-side. */
export async function GET() {
  const userId = await getSessionUserId();
  const isAdmin = userId ? await isSuperAdminUserId(userId) : false;
  try {
    const rails = await getWalletRailsSnapshot();
    return NextResponse.json({
      ...rails,
      isAdmin,
      /** @deprecated use usdtBinance */
      enabled: rails.usdtBinance || rails.piManual,
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "wallet_rails_error";
    return NextResponse.json(
      {
        ok: false,
        error: "wallet_rails_error",
        ...(isAdmin ? { adminDetail: raw.slice(0, 800) } : {}),
      },
      { status: 503 },
    );
  }
}
