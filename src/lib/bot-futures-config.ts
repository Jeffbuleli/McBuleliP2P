import { z } from "zod";
import { BOT_DCA_SYMBOLS } from "@/lib/bot-dca-config";
import {
  BOT_TRADER_PROFILE_IDS,
  parseTraderProfileId,
} from "@/lib/bot-futures-trader-profiles";
import {
  BOT_CANDLE_TIMEFRAMES,
  botSmartFields,
  parseBotCandleTimeframe,
} from "@/lib/bot-smart-config";

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

export const botFuturesLifecycleFields = {
  /** Force close when position age exceeds this (0 = off). */
  maxHoldMinutes: z.number().min(0).max(10_080).default(0),
  /** Block new entries for N minutes after any bot close (0 = off). */
  reentryCooldownMinutes: z.number().min(0).max(1440).default(0),
} as const;

export const botFuturesAiAssistFields = {
  /** Require fresh Python AI signal before opening (POST /api/internal/bots/ai-signal). */
  aiAssistMode: z.boolean().default(false),
  /** Min AI confidence 0–100 when aiAssistMode is on. */
  minAiConfidence: z.number().min(0).max(100).default(40),
  /** Max age of stored AI signal in ms (default 2 min). */
  aiSignalMaxAgeMs: z.number().min(30_000).max(600_000).default(120_000),
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
  ...botFuturesLifecycleFields,
  ...botFuturesAiAssistFields,
});

export type BotFuturesConfig = z.infer<typeof botFuturesConfigSchema>;

function snapLeverage(n: number): (typeof BOT_FUTURES_LEVERAGE)[number] {
  let best: (typeof BOT_FUTURES_LEVERAGE)[number] = 5;
  for (const lv of BOT_FUTURES_LEVERAGE) {
    if (Math.abs(lv - n) < Math.abs(best - n)) best = lv;
  }
  return best;
}

function snapIntervalHours(n: number): (typeof BOT_FUTURES_INTERVAL_HOURS)[number] {
  const allowed = BOT_FUTURES_INTERVAL_HOURS as readonly number[];
  if (allowed.includes(n)) return n as (typeof BOT_FUTURES_INTERVAL_HOURS)[number];
  return 24;
}

/** Coerce legacy / partial DB rows before Zod (cron + save). */
export function normalizeBotFuturesConfigInput(
  raw: unknown,
): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  let marginUsdt: unknown = r.marginUsdt;
  if (typeof marginUsdt === "number" && Number.isFinite(marginUsdt)) {
    marginUsdt = String(marginUsdt);
  }
  if (typeof marginUsdt === "string") {
    marginUsdt = marginUsdt.trim().replace(",", ".");
  }

  let leverage: unknown = r.leverage;
  if (typeof leverage === "string") leverage = Number(leverage);
  if (typeof leverage === "number" && Number.isFinite(leverage)) {
    leverage = snapLeverage(leverage);
  }

  const symbolSet = new Set<string>(BOT_DCA_SYMBOLS);
  const symbol =
    typeof r.symbol === "string" && symbolSet.has(r.symbol) ? r.symbol : "BTCUSDT";

  const multiTfGateMode = Boolean(r.multiTfGateMode);
  const entryTf = parseBotCandleTimeframe(r.timeframe);
  let confirmTimeframe: unknown = r.confirmTimeframe;
  if (multiTfGateMode) {
    confirmTimeframe = parseBotCandleTimeframe(confirmTimeframe ?? entryTf);
  } else {
    confirmTimeframe = undefined;
  }

  const smartExitUseEntryTimeframe = r.smartExitUseEntryTimeframe !== false;
  let smartExitTimeframe: unknown = r.smartExitTimeframe;
  if (!smartExitUseEntryTimeframe && smartExitTimeframe != null) {
    smartExitTimeframe = parseBotCandleTimeframe(smartExitTimeframe);
  } else {
    smartExitTimeframe = undefined;
  }

  return {
    symbol,
    side: r.side === "SHORT" ? "SHORT" : "LONG",
    leverage,
    marginUsdt,
    intervalHours: snapIntervalHours(Number(r.intervalHours) || 24),
    stopLossPct: Math.min(50, Math.max(1, Number(r.stopLossPct) || 5)),
    takeProfitPct: Math.min(100, Math.max(1, Number(r.takeProfitPct) || 10)),
    traderProfile: parseTraderProfileId(r.traderProfile),
    smartMode: Boolean(r.smartMode),
    minSignalScore: Math.min(80, Math.max(10, Number(r.minSignalScore) || 35)),
    timeframe: entryTf,
    smartExitMode: Boolean(r.smartExitMode),
    minReversalScore: Math.min(
      80,
      Math.max(15, Number(r.minReversalScore) || 40),
    ),
    minProfitPctForSmartExit: Math.min(
      50,
      Math.max(0, Number(r.minProfitPctForSmartExit) ?? 0.5),
    ),
    smartExitUseEntryTimeframe,
    smartExitTimeframe,
    breakevenMode: Boolean(r.breakevenMode),
    breakevenTriggerPct: Math.min(
      20,
      Math.max(0.1, Number(r.breakevenTriggerPct) || 1),
    ),
    trailingMode: Boolean(r.trailingMode),
    trailingPct: Math.min(20, Math.max(0.1, Number(r.trailingPct) || 0.8)),
    trailingTriggerPct: Math.min(
      50,
      Math.max(0.1, Number(r.trailingTriggerPct) || 2),
    ),
    multiTfGateMode,
    confirmTimeframe,
    maxHoldMinutes: Math.min(
      10_080,
      Math.max(0, Number(r.maxHoldMinutes) || 0),
    ),
    reentryCooldownMinutes: Math.min(
      1440,
      Math.max(0, Number(r.reentryCooldownMinutes) || 0),
    ),
    aiAssistMode: Boolean(r.aiAssistMode),
    minAiConfidence: Math.min(100, Math.max(0, Number(r.minAiConfidence) || 40)),
    aiSignalMaxAgeMs: Math.min(
      600_000,
      Math.max(30_000, Number(r.aiSignalMaxAgeMs) || 120_000),
    ),
  };
}

export function parseBotFuturesConfig(raw: unknown): BotFuturesConfig | null {
  const normalized = normalizeBotFuturesConfigInput(raw);
  if (!normalized) return null;
  const parsed = botFuturesConfigSchema.safeParse(normalized);
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
