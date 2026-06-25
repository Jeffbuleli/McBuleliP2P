import type { BotTemplateId } from "@/lib/bot-templates";
import { isBotTradeSymbol } from "@/lib/bot-symbols";

function normalizeSymbol(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!s) return "BTCUSDT";
  return s.endsWith("USDT") ? s : `${s}USDT`;
}

function pickFuturesTemplate(
  symbol: string,
  side: "long" | "short",
): BotTemplateId | null {
  if (side !== "long") return null;
  if (symbol === "BTCUSDT") return "fut_day_btc_long";
  if (symbol === "ETHUSDT") return "fut_swing_eth_long";
  return null;
}

/** Deep link from community signal → Trade bots (demo by default). */
export function signalToBotHref(args: {
  symbol: string;
  side: "long" | "short";
  signalId: string;
  billing?: "demo" | "live";
}): string {
  const symbol = normalizeSymbol(args.symbol);
  const billing = args.billing ?? "demo";
  const params = new URLSearchParams({
    billing,
    signalId: args.signalId,
    panel: "bots",
  });

  const template = pickFuturesTemplate(symbol, args.side);
  if (template) {
    params.set("template", template);
  } else {
    params.set("symbol", symbol);
    params.set("side", args.side.toUpperCase());
    params.set("plan", "futures_um");
  }

  if (!isBotTradeSymbol(symbol)) {
    params.set("symbol", symbol);
  }

  return `/app/market?${params}`;
}
