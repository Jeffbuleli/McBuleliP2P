export type P2pMarketPresence = {
  /** Listings on the taker Buy tab (maker sells crypto). */
  hasMakerSellAds: boolean;
  /** Listings on the taker Sell tab (maker buys crypto). */
  hasMakerBuyAds: boolean;
};

/** Lightweight check: any active ad on buy vs sell marketplace tab. */
export async function fetchP2pMarketPresence(): Promise<P2pMarketPresence> {
  const [buyRes, sellRes] = await Promise.all([
    fetch("/api/p2p/market?view=buy&pageSize=1", { cache: "no-store" }),
    fetch("/api/p2p/market?view=sell&pageSize=1", { cache: "no-store" }),
  ]);
  const buyJson = await buyRes.json().catch(() => ({}));
  const sellJson = await sellRes.json().catch(() => ({}));
  const buyTabAds = Array.isArray(buyJson.ads) ? buyJson.ads : [];
  const sellTabAds = Array.isArray(sellJson.ads) ? sellJson.ads : [];
  return {
    hasMakerSellAds: buyTabAds.length > 0,
    hasMakerBuyAds: sellTabAds.length > 0,
  };
}
