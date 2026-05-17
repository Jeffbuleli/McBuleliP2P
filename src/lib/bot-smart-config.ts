import { z } from "zod";

export const BOT_CANDLE_TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h"] as const;

export type BotCandleTimeframe = (typeof BOT_CANDLE_TIMEFRAMES)[number];

/** Spread into bot plan schemas (Zod 4: avoid .merge() on refined objects). */
export const botSmartFields = {
  smartMode: z.boolean().default(false),
  /** Minimum |score| (0–100) required to open / allow DCA buy. */
  minSignalScore: z.number().min(10).max(80).default(35),
  timeframe: z.enum(BOT_CANDLE_TIMEFRAMES).default("1h"),
} as const;

export const botSmartConfigSchema = z.object(botSmartFields);

export type BotSmartConfig = z.infer<typeof botSmartConfigSchema>;

const TF_SET = new Set<string>(BOT_CANDLE_TIMEFRAMES);

export function parseBotCandleTimeframe(raw: unknown): BotCandleTimeframe {
  if (typeof raw === "string" && TF_SET.has(raw)) {
    return raw as BotCandleTimeframe;
  }
  return "1h";
}

export function parseSmartConfig(
  raw: Record<string, unknown>,
): BotSmartConfig {
  const parsed = botSmartConfigSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return {
    smartMode: Boolean(raw.smartMode),
    minSignalScore: Number(raw.minSignalScore) || 35,
    timeframe: parseBotCandleTimeframe(raw.timeframe),
  };
}
