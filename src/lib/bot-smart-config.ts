import { z } from "zod";

export const BOT_CANDLE_TIMEFRAMES = ["15m", "1h", "4h"] as const;

export const botSmartConfigSchema = z.object({
  smartMode: z.boolean().default(false),
  /** Minimum |score| (0–100) required to open / allow DCA buy. */
  minSignalScore: z.number().min(10).max(80).default(35),
  timeframe: z.enum(BOT_CANDLE_TIMEFRAMES).default("1h"),
});

export type BotSmartConfig = z.infer<typeof botSmartConfigSchema>;

export function parseSmartConfig(
  raw: Record<string, unknown>,
): BotSmartConfig {
  const parsed = botSmartConfigSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return {
    smartMode: Boolean(raw.smartMode),
    minSignalScore: Number(raw.minSignalScore) || 35,
    timeframe:
      raw.timeframe === "15m" || raw.timeframe === "4h" ? raw.timeframe : "1h",
  };
}
