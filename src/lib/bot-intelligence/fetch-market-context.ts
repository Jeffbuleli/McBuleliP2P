import type { BotEnvironment } from "@/lib/bot-config";
import { binanceEndpointsFor } from "@/lib/binance-endpoints";
import {
  binancePairToCcxt,
  createCcxtMarketExchange,
  timeframeToCcxt,
} from "@/lib/bot-intelligence/ccxt-exchange";
import { computeIndicators } from "@/lib/bot-intelligence/compute-indicators";
import type {
  CandleTimeframe,
  MarketContext,
  MarketKind,
  OhlcvCandle,
  OrderBookSummary,
} from "@/lib/bot-intelligence/types";

function mapOhlcv(raw: Array<Array<number | undefined>>): OhlcvCandle[] {
  return raw.map((c) => ({
    time: Number(c[0]) || 0,
    open: Number(c[1]) || 0,
    high: Number(c[2]) || 0,
    low: Number(c[3]) || 0,
    close: Number(c[4]) || 0,
    volume: Number(c[5]) || 0,
  }));
}

async function fetchFuturesOpenInterest(
  environment: BotEnvironment,
  symbol: string,
): Promise<number | null> {
  const base = binanceEndpointsFor(environment).futuresRest;
  const res = await fetch(
    `${base}/fapi/v1/openInterest?symbol=${symbol.toUpperCase()}`,
    { cache: "no-store" },
  );
  const json = (await res.json()) as { openInterest?: string };
  if (!res.ok) return null;
  const n = Number(json.openInterest);
  return Number.isFinite(n) ? n : null;
}

async function fetchOrderBookSummary(
  exchange: ReturnType<typeof createCcxtMarketExchange>,
  ccxtSymbol: string,
): Promise<OrderBookSummary | null> {
  try {
    const book = await exchange.fetchOrderBook(ccxtSymbol, 20);
    let bidVolume = 0;
    let askVolume = 0;
    for (const [p, a] of book.bids ?? []) {
      bidVolume += (p ?? 0) * (a ?? 0);
    }
    for (const [p, a] of book.asks ?? []) {
      askVolume += (p ?? 0) * (a ?? 0);
    }
    const total = bidVolume + askVolume;
    const imbalance = total > 0 ? (bidVolume - askVolume) / total : 0;
    return { bidVolume, askVolume, imbalance };
  } catch {
    return null;
  }
}

export async function fetchMarketContext(args: {
  environment: BotEnvironment;
  symbol: string;
  market: MarketKind;
  timeframe: CandleTimeframe;
}): Promise<MarketContext | null> {
  const exchange = createCcxtMarketExchange(args.environment, args.market);
  const ccxtSymbol = binancePairToCcxt(args.symbol, args.market);
  const tf = timeframeToCcxt(args.timeframe);

  try {
    const [ohlcv, ticker, book] = await Promise.all([
      exchange.fetchOHLCV(ccxtSymbol, tf, undefined, 120),
      exchange.fetchTicker(ccxtSymbol),
      fetchOrderBookSummary(exchange, ccxtSymbol),
    ]);

    const candles = mapOhlcv(ohlcv as Array<Array<number | undefined>>);
    if (candles.length < 30) return null;

    const price =
      ticker.last ??
      ticker.close ??
      candles[candles.length - 1]?.close ??
      0;

    let fundingRate: number | null = null;
    if (args.market === "futures") {
      try {
        const fr = await exchange.fetchFundingRate(ccxtSymbol);
        fundingRate =
          typeof fr.fundingRate === "number" ? fr.fundingRate : null;
      } catch {
        fundingRate = null;
      }
    }

    const openInterest =
      args.market === "futures"
        ? await fetchFuturesOpenInterest(args.environment, args.symbol)
        : null;

    const indicators = computeIndicators(candles);

    return {
      symbol: args.symbol,
      market: args.market,
      timeframe: args.timeframe,
      price,
      volume24h: ticker.quoteVolume ?? ticker.baseVolume ?? null,
      candles,
      indicators,
      orderBook: book,
      fundingRate,
      openInterest,
    };
  } catch {
    return null;
  }
}
