/**
 * McBuleli coordinated trading: TA (in-app) + AI (Python worker) + BOT (cron engines)
 * share one preset. Users only set capital/risk basics; intelligence layers activate together on Start.
 */
import {
  getFuturesTraderProfilePreset,
  type BotTraderProfileId,
} from "@/lib/bot-futures-trader-profiles";

/** Styles exposed in the minimalist bots UI (maps to trader profile presets). */
export const BOT_COORDINATED_STYLES = ["day", "swing"] as const;

export type BotCoordinatedStyleId = (typeof BOT_COORDINATED_STYLES)[number];

export function parseCoordinatedStyle(raw: unknown): BotCoordinatedStyleId {
  if (raw === "swing") return "swing";
  return "day";
}

export function coordinatedStyleFromProfile(
  profile: BotTraderProfileId | undefined,
): BotCoordinatedStyleId {
  if (profile === "swing") return "swing";
  return "day";
}

/** In-app technical analysis gate (always on for coordinated bots). */
export function coordinatedSmartFields(style: BotCoordinatedStyleId = "day") {
  const preset = getFuturesTraderProfilePreset(style);
  return {
    smartMode: true as const,
    minSignalScore: preset.minSignalScore,
    timeframe: preset.timeframe,
  };
}

/** Futures-only: profile preset + exits + AI assist (always enabled together). */
export function coordinatedFuturesIntelligence(style: BotCoordinatedStyleId) {
  const preset = getFuturesTraderProfilePreset(style);
  return {
    traderProfile: style,
    ...coordinatedSmartFields(style),
    smartExitMode: preset.smartExitMode,
    minReversalScore: preset.minReversalScore,
    minProfitPctForSmartExit: preset.minProfitPctForSmartExit,
    smartExitUseEntryTimeframe: preset.smartExitUseEntryTimeframe,
    ...(preset.smartExitUseEntryTimeframe
      ? {}
      : preset.smartExitTimeframe
        ? { smartExitTimeframe: preset.smartExitTimeframe }
        : {}),
    breakevenMode: preset.breakevenMode,
    breakevenTriggerPct: preset.breakevenTriggerPct,
    trailingMode: preset.trailingMode,
    trailingPct: preset.trailingPct,
    trailingTriggerPct: preset.trailingTriggerPct,
    multiTfGateMode: preset.multiTfGateMode,
    ...(preset.multiTfGateMode && preset.confirmTimeframe
      ? { confirmTimeframe: preset.confirmTimeframe }
      : {}),
    maxHoldMinutes: preset.maxHoldMinutes,
    reentryCooldownMinutes: preset.reentryCooldownMinutes,
    aiAssistMode: true as const,
    minAiConfidence: preset.minAiConfidence,
    aiSignalMaxAgeMs: preset.aiSignalMaxAgeMs,
  };
}

export type CoordinatedDcaBasics = {
  symbol: string;
  quoteAmountUsdt: string;
  intervalHours: number;
};

export function buildCoordinatedDcaConfig(
  basics: CoordinatedDcaBasics,
  style: BotCoordinatedStyleId = "day",
) {
  return {
    ...basics,
    ...coordinatedSmartFields(style),
  };
}

export type CoordinatedGridBasics = {
  symbol: string;
  priceLow: string;
  priceHigh: string;
  gridCount: number;
  quotePerGrid: string;
  refreshHours: number;
};

export function buildCoordinatedGridConfig(
  basics: CoordinatedGridBasics,
  style: BotCoordinatedStyleId = "day",
) {
  return {
    ...basics,
    ...coordinatedSmartFields(style),
  };
}

export type CoordinatedFuturesBasics = {
  symbol: string;
  side: "LONG" | "SHORT";
  leverage: number;
  marginUsdt: string;
  intervalHours: number;
  stopLossPct: number;
  takeProfitPct: number;
};

export function buildCoordinatedFuturesConfig(
  basics: CoordinatedFuturesBasics,
  style: BotCoordinatedStyleId,
) {
  return {
    ...basics,
    ...coordinatedFuturesIntelligence(style),
  };
}
