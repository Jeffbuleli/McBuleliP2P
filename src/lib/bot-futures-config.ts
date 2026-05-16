import { z } from "zod";
import { BOT_DCA_SYMBOLS } from "@/lib/bot-dca-config";
import { botSmartFields } from "@/lib/bot-smart-config";

export const BOT_FUTURES_LEVERAGE = [2, 3, 5, 10, 20] as const;
export const BOT_FUTURES_INTERVAL_HOURS = [1, 4, 12, 24] as const;

export const botFuturesConfigSchema = z.object({
  symbol: z.enum(BOT_DCA_SYMBOLS),
  side: z.enum(["LONG", "SHORT"]),
  leverage: z.union([
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(10),
    z.literal(20),
  ]),
  marginUsdt: z.string().regex(/^\d+(\.\d+)?$/),
  intervalHours: z.union([
    z.literal(1),
    z.literal(4),
    z.literal(12),
    z.literal(24),
  ]),
  stopLossPct: z.number().min(1).max(50),
  takeProfitPct: z.number().min(1).max(100),
  ...botSmartFields,
});

export type BotFuturesConfig = z.infer<typeof botFuturesConfigSchema>;

export function parseBotFuturesConfig(raw: unknown): BotFuturesConfig | null {
  const parsed = botFuturesConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
