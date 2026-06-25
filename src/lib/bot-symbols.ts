/** Liquid USDT pairs supported by McBuleli bots (spot + futures). */
export const BOT_TRADE_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "DOGEUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "LINKUSDT",
  "DOTUSDT",
  "LTCUSDT",
  "MATICUSDT",
] as const;

export type BotTradeSymbol = (typeof BOT_TRADE_SYMBOLS)[number];

export function isBotTradeSymbol(v: string): v is BotTradeSymbol {
  return (BOT_TRADE_SYMBOLS as readonly string[]).includes(v);
}
