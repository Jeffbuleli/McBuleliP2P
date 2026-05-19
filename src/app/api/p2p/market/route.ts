import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listMarketAds } from "@/lib/p2p-service";
import type { P2pCryptoAsset, P2pSide } from "@/lib/p2p-config";
import { effectiveP2pCountryCode } from "@/lib/p2p-country-code";
import {
  makerSideForMarketView,
  type P2pMarketView,
  type P2pPaymentKindFilter,
} from "@/lib/p2p-market-view";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset") as P2pCryptoAsset | null;
  const fiat = searchParams.get("fiat") ?? undefined;
  const sideLegacy = searchParams.get("side") as P2pSide | null;
  const viewParam = searchParams.get("view");
  const view: P2pMarketView | undefined =
    viewParam === "buy" || viewParam === "sell" ? viewParam : undefined;
  const paymentKindParam = searchParams.get("paymentKind");
  const paymentKind: P2pPaymentKindFilter | undefined =
    paymentKindParam === "mobile" ||
    paymentKindParam === "bank" ||
    paymentKindParam === "all"
      ? paymentKindParam
      : undefined;
  const countryRaw = searchParams.get("country");
  const country =
    countryRaw && countryRaw.trim()
      ? effectiveP2pCountryCode(countryRaw)
      : undefined;
  const paymentContains = searchParams.get("payment") ?? undefined;
  const boostedOnly = searchParams.get("boosted") === "1";
  const trustedOnly = searchParams.get("trusted") === "1";

  const makerSide: P2pSide | undefined = view
    ? makerSideForMarketView(view)
    : sideLegacy === "sell" || sideLegacy === "buy"
      ? sideLegacy
      : undefined;

  const ads = await listMarketAds({
    asset: asset === "USDT" || asset === "PI" ? asset : undefined,
    fiat: fiat || undefined,
    side: makerSide,
    country: country || undefined,
    paymentContains,
    paymentKind,
    fiatQuotesOnly: view === "sell",
    boostedOnly,
    trustedOnly,
  });
  return NextResponse.json({ ads, view: view ?? null });
}
