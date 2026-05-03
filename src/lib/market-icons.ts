/** CDN icons (spothq) — Binance spot symbols like BTCUSDT → `btc`. */
const SLUG: Record<string, string> = {
  BTC: "btc",
  ETH: "eth",
  BNB: "bnb",
  SOL: "sol",
  XRP: "xrp",
  DOGE: "doge",
  ADA: "ada",
  AVAX: "avax",
  TRX: "trx",
  DOT: "dot",
};

export function marketIconUrl(symbol: string): string | null {
  const base = symbol.replace(/USDT$/i, "").toUpperCase();
  const slug = SLUG[base];
  if (!slug) return null;
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${slug}.png`;
}
