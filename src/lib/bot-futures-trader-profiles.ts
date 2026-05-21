import { BOT_CANDLE_TIMEFRAMES } from "@/lib/bot-smart-config";

export const BOT_TRADER_PROFILE_IDS = [
  "scalp",
  "day",
  "swing",
  "position",
  "custom",
] as const;

export type BotTraderProfileId = (typeof BOT_TRADER_PROFILE_IDS)[number];

export type FuturesTraderProfilePreset = {
  traderProfile: Exclude<BotTraderProfileId, "custom">;
  timeframe: (typeof BOT_CANDLE_TIMEFRAMES)[number];
  intervalHours: 1 | 4 | 12 | 24;
  stopLossPct: number;
  takeProfitPct: number;
  smartMode: boolean;
  minSignalScore: number;
  smartExitMode: boolean;
  minReversalScore: number;
  minProfitPctForSmartExit: number;
  smartExitUseEntryTimeframe: boolean;
  smartExitTimeframe?: (typeof BOT_CANDLE_TIMEFRAMES)[number];
  breakevenMode: boolean;
  breakevenTriggerPct: number;
  trailingMode: boolean;
  trailingPct: number;
  trailingTriggerPct: number;
  multiTfGateMode: boolean;
  confirmTimeframe?: (typeof BOT_CANDLE_TIMEFRAMES)[number];
  maxHoldMinutes: number;
  reentryCooldownMinutes: number;
  aiAssistMode: boolean;
  minAiConfidence: number;
  aiSignalMaxAgeMs: number;
};

const PRESETS: Record<
  Exclude<BotTraderProfileId, "custom">,
  FuturesTraderProfilePreset
> = {
  scalp: {
    traderProfile: "scalp",
    timeframe: "1m",
    intervalHours: 1,
    stopLossPct: 2,
    takeProfitPct: 4,
    smartMode: true,
    minSignalScore: 40,
    smartExitMode: true,
    minReversalScore: 45,
    minProfitPctForSmartExit: 0.3,
    smartExitUseEntryTimeframe: false,
    smartExitTimeframe: "5m",
    breakevenMode: true,
    breakevenTriggerPct: 0.4,
    trailingMode: true,
    trailingPct: 0.3,
    trailingTriggerPct: 0.5,
    multiTfGateMode: true,
    confirmTimeframe: "5m",
    maxHoldMinutes: 15,
    reentryCooldownMinutes: 5,
    aiAssistMode: true,
    minAiConfidence: 22,
    aiSignalMaxAgeMs: 120_000,
  },
  day: {
    traderProfile: "day",
    timeframe: "15m",
    intervalHours: 4,
    stopLossPct: 3,
    takeProfitPct: 6,
    smartMode: true,
    minSignalScore: 40,
    smartExitMode: true,
    minReversalScore: 40,
    minProfitPctForSmartExit: 0.5,
    smartExitUseEntryTimeframe: false,
    smartExitTimeframe: "15m",
    breakevenMode: true,
    breakevenTriggerPct: 1,
    trailingMode: true,
    trailingPct: 0.8,
    trailingTriggerPct: 2,
    multiTfGateMode: true,
    confirmTimeframe: "1h",
    maxHoldMinutes: 480,
    reentryCooldownMinutes: 0,
    aiAssistMode: true,
    minAiConfidence: 25,
    aiSignalMaxAgeMs: 180_000,
  },
  swing: {
    traderProfile: "swing",
    timeframe: "1h",
    intervalHours: 24,
    stopLossPct: 5,
    takeProfitPct: 12,
    smartMode: true,
    minSignalScore: 38,
    smartExitMode: true,
    minReversalScore: 50,
    minProfitPctForSmartExit: 1,
    smartExitUseEntryTimeframe: false,
    smartExitTimeframe: "4h",
    breakevenMode: false,
    breakevenTriggerPct: 1,
    trailingMode: true,
    trailingPct: 1.5,
    trailingTriggerPct: 3,
    multiTfGateMode: true,
    confirmTimeframe: "4h",
    maxHoldMinutes: 0,
    reentryCooldownMinutes: 0,
    aiAssistMode: true,
    minAiConfidence: 22,
    aiSignalMaxAgeMs: 180_000,
  },
  position: {
    traderProfile: "position",
    timeframe: "4h",
    intervalHours: 24,
    stopLossPct: 8,
    takeProfitPct: 25,
    smartMode: true,
    minSignalScore: 50,
    smartExitMode: false,
    minReversalScore: 55,
    minProfitPctForSmartExit: 3,
    smartExitUseEntryTimeframe: true,
    breakevenMode: false,
    breakevenTriggerPct: 1,
    trailingMode: false,
    trailingPct: 0.8,
    trailingTriggerPct: 2,
    multiTfGateMode: false,
    maxHoldMinutes: 0,
    reentryCooldownMinutes: 0,
    aiAssistMode: false,
    minAiConfidence: 50,
    aiSignalMaxAgeMs: 120_000,
  },
};

export function getFuturesTraderProfilePreset(
  id: Exclude<BotTraderProfileId, "custom">,
): FuturesTraderProfilePreset {
  return { ...PRESETS[id] };
}

export function parseTraderProfileId(raw: unknown): BotTraderProfileId {
  if (
    raw === "scalp" ||
    raw === "day" ||
    raw === "swing" ||
    raw === "position" ||
    raw === "custom"
  ) {
    return raw;
  }
  return "custom";
}
