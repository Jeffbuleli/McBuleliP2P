import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listMarketAds } from "@/lib/p2p-service";
import type { P2pCryptoAsset, P2pSide } from "@/lib/p2p-config";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset") as P2pCryptoAsset | null;
  const fiat = searchParams.get("fiat") ?? undefined;
  const side = searchParams.get("side") as P2pSide | null;
  const country = searchParams.get("country") ?? undefined;

  const ads = await listMarketAds({
    asset: asset === "USDT" || asset === "PI" ? asset : undefined,
    fiat: fiat || undefined,
    side: side === "sell" || side === "buy" ? side : undefined,
    country: country || undefined,
  });
  return NextResponse.json({ ads });
}
