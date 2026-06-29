import type { P2pMarketView } from "@/lib/p2p-market-view";
import type { P2pSide } from "@/lib/p2p-config";

export type P2pMarketSort =
  | "default"
  | "price"
  | "reputation"
  | "release"
  | "boosted";

export function isP2pMarketSort(s: string): s is P2pMarketSort {
  return ["default", "price", "reputation", "release", "boosted"].includes(s);
}

type MarketAdRow = {
  side: string;
  price: string;
  createdAt: string;
  boostedUntil: string | null;
  boostAmountPi: string;
  makerRating: { avg: number; count: number } | null;
  makerReleaseMedianMinutes?: number | null;
};

function defaultScore(a: MarketAdRow, minP: number, maxP: number, nowMs: number): number {
  const denom = maxP > minP ? maxP - minP : 0;
  const boostedActive =
    a.boostedUntil != null && new Date(a.boostedUntil).getTime() > nowMs;
  const boostAmt = Math.max(0, Number(a.boostAmountPi) || 0);
  const boostScore = boostedActive ? 1000 + 100 * Math.log(1 + boostAmt) : 0;

  const r = a.makerRating;
  const avg = r?.avg ?? 0;
  const cnt = r?.count ?? 0;
  const repScore = Math.max(0, Math.min(5, avg)) * 20 + Math.min(50, Math.max(0, cnt)) * 0.6;

  const p = Number(a.price);
  let priceNorm = 0.5;
  if (Number.isFinite(p) && p > 0 && denom > 0) {
    const raw = (p - minP) / denom;
    priceNorm = a.side === "sell" ? 1 - raw : raw;
  }
  const priceScore = 100 * Math.max(0, Math.min(1, priceNorm));

  const createdMs = new Date(a.createdAt).getTime();
  const ageHours = Math.max(0, (nowMs - createdMs) / (1000 * 60 * 60));
  const freshScore = 20 * Math.exp(-ageHours / 24);

  return boostScore + repScore + priceScore + freshScore;
}

/** Sort market ads - price favors taker (low on BUY/sell ads, high on SELL/buy ads). */
export function sortP2pMarketAds<T extends MarketAdRow>(
  ads: T[],
  sort: P2pMarketSort,
  marketView: P2pMarketView,
): T[] {
  if (ads.length <= 1) return ads;

  const nowMs = Date.now();
  const prices = ads.map((a) => Number(a.price)).filter((n) => Number.isFinite(n) && n > 0);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;

  const makerSide: P2pSide = marketView === "buy" ? "sell" : "buy";

  if (sort === "default") {
    return [...ads].sort(
      (a, b) => defaultScore(b, minP, maxP, nowMs) - defaultScore(a, minP, maxP, nowMs),
    );
  }

  if (sort === "boosted") {
    return [...ads].sort((a, b) => {
      const ab = a.boostedUntil && new Date(a.boostedUntil).getTime() > nowMs ? 1 : 0;
      const bb = b.boostedUntil && new Date(b.boostedUntil).getTime() > nowMs ? 1 : 0;
      if (bb !== ab) return bb - ab;
      return defaultScore(b, minP, maxP, nowMs) - defaultScore(a, minP, maxP, nowMs);
    });
  }

  if (sort === "price") {
    return [...ads].sort((a, b) => {
      const pa = Number(a.price);
      const pb = Number(b.price);
      if (!Number.isFinite(pa) || !Number.isFinite(pb)) return 0;
      // Taker buys from sell ads → lower price first; taker sells to buy ads → higher first
      return makerSide === "sell" ? pa - pb : pb - pa;
    });
  }

  if (sort === "reputation") {
    return [...ads].sort((a, b) => {
      const ra = a.makerRating;
      const rb = b.makerRating;
      const sa = (ra?.avg ?? 0) * Math.log1p(ra?.count ?? 0);
      const sb = (rb?.avg ?? 0) * Math.log1p(rb?.count ?? 0);
      return sb - sa;
    });
  }

  if (sort === "release") {
    return [...ads].sort((a, b) => {
      const ma = a.makerReleaseMedianMinutes;
      const mb = b.makerReleaseMedianMinutes;
      if (ma == null && mb == null) return 0;
      if (ma == null) return 1;
      if (mb == null) return -1;
      return ma - mb;
    });
  }

  return ads;
}
