/**
 * Standardized decision trace codes — McBuleli quant pipeline.
 * Maps internal gate strings to stable reason_code enums for logs & UI.
 */

export type DecisionCategory =
  | "TECHNICAL"
  | "AI"
  | "RISK"
  | "EXECUTION"
  | "SYSTEM";

/** Technical layer */
export type TechnicalReasonCode =
  | "LOW_SCORE"
  | "WEAK_MOMENTUM"
  | "TREND_CONFLICT"
  | "HIGH_VOLATILITY"
  | "RANGE_MARKET"
  | "FAKE_BREAKOUT"
  | "LOW_VOLUME"
  | "MARKET_DATA_UNAVAILABLE";

/** AI / sentiment — blocking codes are rare (major events only) */
export type AiReasonCode =
  | "EXTREME_NEGATIVE_SENTIMENT"
  | "HIGH_NEWS_RISK"
  | "WHALE_MANIPULATION_RISK"
  | "MACRO_EVENT_WARNING"
  | "AI_CONTEXT_CAUTION";

/** Risk management */
export type RiskReasonCode =
  | "MAX_DAILY_LOSS_REACHED"
  | "POSITION_LIMIT_REACHED"
  | "BAD_RISK_REWARD"
  | "HIGH_CORRELATION_RISK"
  | "LIQUIDATION_RISK"
  | "FUNDING_TOO_HIGH";

/** Binance execution */
export type ExecutionReasonCode =
  | "BINANCE_REJECTED_ORDER"
  | "INVALID_QUANTITY"
  | "API_TIMEOUT"
  | "PRECISION_ERROR"
  | "MIN_NOTIONAL_ERROR";

/** System / scheduling */
export type SystemReasonCode =
  | "COOLDOWN_ACTIVE"
  | "DUPLICATE_SIGNAL"
  | "INTERVAL_NOT_ELAPSED"
  | "NO_AI_SIGNAL";

export type DecisionReasonCode =
  | TechnicalReasonCode
  | AiReasonCode
  | RiskReasonCode
  | ExecutionReasonCode
  | SystemReasonCode;

export const REASON_CATEGORY: Record<DecisionReasonCode, DecisionCategory> = {
  LOW_SCORE: "TECHNICAL",
  WEAK_MOMENTUM: "TECHNICAL",
  TREND_CONFLICT: "TECHNICAL",
  HIGH_VOLATILITY: "TECHNICAL",
  RANGE_MARKET: "TECHNICAL",
  FAKE_BREAKOUT: "TECHNICAL",
  LOW_VOLUME: "TECHNICAL",
  MARKET_DATA_UNAVAILABLE: "TECHNICAL",
  EXTREME_NEGATIVE_SENTIMENT: "AI",
  HIGH_NEWS_RISK: "AI",
  WHALE_MANIPULATION_RISK: "AI",
  MACRO_EVENT_WARNING: "AI",
  AI_CONTEXT_CAUTION: "AI",
  MAX_DAILY_LOSS_REACHED: "RISK",
  POSITION_LIMIT_REACHED: "RISK",
  BAD_RISK_REWARD: "RISK",
  HIGH_CORRELATION_RISK: "RISK",
  LIQUIDATION_RISK: "RISK",
  FUNDING_TOO_HIGH: "RISK",
  BINANCE_REJECTED_ORDER: "EXECUTION",
  INVALID_QUANTITY: "EXECUTION",
  API_TIMEOUT: "EXECUTION",
  PRECISION_ERROR: "EXECUTION",
  MIN_NOTIONAL_ERROR: "EXECUTION",
  COOLDOWN_ACTIVE: "SYSTEM",
  DUPLICATE_SIGNAL: "SYSTEM",
  INTERVAL_NOT_ELAPSED: "SYSTEM",
  NO_AI_SIGNAL: "SYSTEM",
};

/** Legacy smart/ai skip strings → reason_code */
export function mapLegacySkipToReasonCode(
  legacy: string,
): { category: DecisionCategory; reason_code: DecisionReasonCode } {
  const m: Record<string, DecisionReasonCode> = {
    smart_market_data_unavailable: "MARKET_DATA_UNAVAILABLE",
    smart_signal_blocks_long: "LOW_SCORE",
    smart_signal_blocks_short: "LOW_SCORE",
    smart_signal_blocks_buy: "LOW_SCORE",
    smart_mtf_blocks_long: "TREND_CONFLICT",
    smart_mtf_blocks_short: "TREND_CONFLICT",
    smart_mtf_blocks_buy: "TREND_CONFLICT",
    smart_blocked: "LOW_SCORE",
    ai_signal_hold: "AI_CONTEXT_CAUTION",
    ai_signal_stale: "NO_AI_SIGNAL",
    ai_low_confidence: "AI_CONTEXT_CAUTION",
    ai_side_mismatch: "AI_CONTEXT_CAUTION",
    ai_high_risk: "HIGH_NEWS_RISK",
    reentry_cooldown: "COOLDOWN_ACTIVE",
    interval_not_elapsed: "INTERVAL_NOT_ELAPSED",
    futures_failed: "BINANCE_REJECTED_ORDER",
  };
  const code = m[legacy] ?? "LOW_SCORE";
  return { category: REASON_CATEGORY[code], reason_code: code };
}

export function categoryAccent(category: DecisionCategory): string {
  switch (category) {
    case "TECHNICAL":
      return "sky";
    case "AI":
      return "violet";
    case "RISK":
      return "amber";
    case "EXECUTION":
      return "rose";
    case "SYSTEM":
      return "stone";
    default:
      return "stone";
  }
}
