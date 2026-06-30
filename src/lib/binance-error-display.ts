/** Client-safe — detect raw Binance API text that must not be shown to end users. */
export function isTechnicalBinanceMessage(msg: string): boolean {
  const m = msg.trim();
  if (!m) return false;
  if (m.startsWith("Binance HTTP")) return true;
  if (m.startsWith("{") && m.includes('"code"')) return true;
  if (m.includes("-2015") && m.includes("{")) return true;
  return false;
}
