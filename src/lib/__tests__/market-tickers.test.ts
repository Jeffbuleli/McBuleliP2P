import { describe, expect, it } from "vitest";
import { mergeMarketTickers, type MarketTicker } from "@/lib/market-tickers";

const btc: MarketTicker = {
  symbol: "BTCUSDT",
  lastPrice: "59316.88",
  changePct: -1.5,
  source: "binance",
};
const eth: MarketTicker = {
  symbol: "ETHUSDT",
  lastPrice: "3400",
  changePct: 0.2,
  source: "binance",
};
const pi: MarketTicker = {
  symbol: "PIUSDT",
  lastPrice: "0.1228",
  changePct: -5.4,
  source: "okx",
};

describe("mergeMarketTickers", () => {
  it("orders BTC, ETH, Pi then remaining Binance symbols", () => {
    const merged = mergeMarketTickers([eth, btc, pi], pi);
    expect(merged.map((t) => t.symbol)).toEqual(["BTCUSDT", "ETHUSDT", "PIUSDT"]);
  });

  it("returns Pi only when Binance is unavailable", () => {
    const merged = mergeMarketTickers(null, pi);
    expect(merged).toEqual([pi]);
  });

  it("returns empty when both feeds fail", () => {
    expect(mergeMarketTickers(null, null)).toEqual([]);
  });
});
