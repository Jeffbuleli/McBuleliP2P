import {
  BOT_CANDLE_TIMEFRAMES,
  type BotCandleTimeframe,
} from "@/lib/bot-smart-config";

const TF_RANK: Record<BotCandleTimeframe, number> = {
  "1m": 0,
  "5m": 1,
  "15m": 2,
  "1h": 3,
  "4h": 4,
};

export function isHigherTimeframe(
  entry: BotCandleTimeframe,
  confirm: BotCandleTimeframe,
): boolean {
  return TF_RANK[confirm] > TF_RANK[entry];
}

export function defaultConfirmTimeframe(entry: BotCandleTimeframe): BotCandleTimeframe {
  const idx = BOT_CANDLE_TIMEFRAMES.indexOf(entry);
  if (idx < 0 || idx >= BOT_CANDLE_TIMEFRAMES.length - 1) {
    return "4h";
  }
  return BOT_CANDLE_TIMEFRAMES[idx + 1];
}

export function higherTimeframesThan(
  entry: BotCandleTimeframe,
): BotCandleTimeframe[] {
  return BOT_CANDLE_TIMEFRAMES.filter((tf) => isHigherTimeframe(entry, tf));
}
