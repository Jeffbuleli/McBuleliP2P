import { z } from "zod";
import { botSmartFields } from "@/lib/bot-smart-config";
import { BOT_TRADE_SYMBOLS } from "@/lib/bot-symbols";

/** @deprecated use BOT_TRADE_SYMBOLS */
export const BOT_DCA_SYMBOLS = BOT_TRADE_SYMBOLS;
export const BOT_DCA_INTERVAL_HOURS = [1, 4, 12, 24] as const;

export const botDcaConfigSchema = z.object({
  symbol: z.enum(BOT_DCA_SYMBOLS),
  quoteAmountUsdt: z.string().regex(/^\d+(\.\d+)?$/),
  intervalHours: z.union([
    z.literal(1),
    z.literal(4),
    z.literal(12),
    z.literal(24),
  ]),
  ...botSmartFields,
});

export type BotDcaConfig = z.infer<typeof botDcaConfigSchema>;

export function parseBotDcaConfig(raw: unknown): BotDcaConfig | null {
  const parsed = botDcaConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
