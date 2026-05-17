import { z } from "zod";
import { BOT_DCA_SYMBOLS } from "@/lib/bot-dca-config";
import { BOT_TRADER_PROFILE_IDS } from "@/lib/bot-futures-trader-profiles";
import { BOT_CANDLE_TIMEFRAMES, botSmartFields } from "@/lib/bot-smart-config";

export const BOT_FUTURES_LEVERAGE = [2, 3, 5, 10, 20] as const;
export const BOT_FUTURES_INTERVAL_HOURS = [1, 4, 12, 24] as const;

export const botFuturesSmartExitFields = {
  /** Close early when TA signals a reversal and min profit % is reached. */
  smartExitMode: z.boolean().default(false),
  /** Min |score| on the opposite bias to trigger smart exit (15–80). */
  minReversalScore: z.number().min(15).max(80).default(40),
  /** Min unrealized profit % before smart exit can fire (0 = any profit). */
  minProfitPctForSmartExit: z.number().min(0).max(50).default(0.5),
  smartExitUseEntryTimeframe: z.boolean().default(true),
  smartExitTimeframe: z.enum(BOT_CANDLE_TIMEFRAMES).optional(),
} as const;

export const botFuturesBreakevenFields = {
  /** Move effective SL to entry after profit % reaches trigger (latched). */
  breakevenMode: z.boolean().default(false),
  breakevenTriggerPct: z.number().min(0.1).max(20).default(1),
} as const;

export const botFuturesTrailingFields = {
  /** Close when profit retraces trailingPct from session peak (after trigger). */
  trailingMode: z.boolean().default(false),
  trailingPct: z.number().min(0.1).max(20).default(0.8),
  trailingTriggerPct: z.number().min(0.1).max(50).default(2),
} as const;

export const botFuturesMultiTfFields = {
  /** Require entry TF + higher confirm TF to agree before opening. */
  multiTfGateMode: z.boolean().default(false),
  confirmTimeframe: z.enum(BOT_CANDLE_TIMEFRAMES).optional(),
} as const;

export const botFuturesProfileField = {
  traderProfile: z.enum(BOT_TRADER_PROFILE_IDS).default("custom"),
} as const;

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
  ...botFuturesSmartExitFields,
  ...botFuturesBreakevenFields,
  ...botFuturesTrailingFields,
  ...botFuturesMultiTfFields,
  ...botFuturesProfileField,
});

export type BotFuturesConfig = z.infer<typeof botFuturesConfigSchema>;

export function parseBotFuturesConfig(raw: unknown): BotFuturesConfig | null {
  const parsed = botFuturesConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function resolveSmartExitTimeframe(
  cfg: BotFuturesConfig,
): (typeof BOT_CANDLE_TIMEFRAMES)[number] {
  if (cfg.smartExitUseEntryTimeframe !== false && !cfg.smartExitTimeframe) {
    return cfg.timeframe;
  }
  return cfg.smartExitTimeframe ?? cfg.timeframe;
}
