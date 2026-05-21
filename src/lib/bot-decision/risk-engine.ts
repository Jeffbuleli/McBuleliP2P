/**
 * Layer 3 — Risk management (sizing, leverage, hard limits).
 */

import type { AiModulatorOutput } from "@/lib/bot-decision/types";
import type { TechnicalEngineOutput } from "@/lib/bot-decision/types";
import type { RiskEngineOutput } from "@/lib/bot-decision/types";
import type { DecisionReasonCode } from "@/lib/bot-decision/reason-codes";

export type FuturesRiskInput = {
  technical: TechnicalEngineOutput;
  ai: AiModulatorOutput;
  baseLeverage: number;
  baseMarginUsdt: number;
  fundingRate?: number | null;
  maxLeverage?: number;
  /** 0–1 fraction of max daily loss already used */
  dailyLossUsedPct?: number;
  openPositionsCount?: number;
  maxPositions?: number;
};

const FUNDING_WARN = 0.0008;
const FUNDING_BLOCK = 0.0015;

export function runRiskEngine(input: FuturesRiskInput): RiskEngineOutput {
  const {
    technical,
    ai,
    baseLeverage,
    baseMarginUsdt,
    fundingRate,
    maxLeverage = 20,
    dailyLossUsedPct = 0,
    openPositionsCount = 0,
    maxPositions = 3,
  } = input;

  if (dailyLossUsedPct >= 1) {
    return {
      approved: false,
      position_size_multiplier: 0,
      leverage: 0,
      risk_level: "HIGH",
      rejection_reason: "Max daily loss reached",
      reason_code: "MAX_DAILY_LOSS_REACHED",
    };
  }

  if (openPositionsCount >= maxPositions) {
    return {
      approved: false,
      position_size_multiplier: 0,
      leverage: 0,
      risk_level: "HIGH",
      rejection_reason: "Max open positions reached",
      reason_code: "POSITION_LIMIT_REACHED",
    };
  }

  if (fundingRate != null && Math.abs(fundingRate) >= FUNDING_BLOCK) {
    const againstLong = fundingRate > FUNDING_BLOCK;
    const againstShort = fundingRate < -FUNDING_BLOCK;
    if (
      (technical.signal === "LONG" && againstLong) ||
      (technical.signal === "SHORT" && againstShort)
    ) {
      return {
        approved: false,
        position_size_multiplier: 0,
        leverage: 0,
        risk_level: "HIGH",
        rejection_reason: `Funding rate extreme (${fundingRate})`,
        reason_code: "FUNDING_TOO_HIGH",
      };
    }
  }

  let riskLevel: RiskEngineOutput["risk_level"] = "MEDIUM";
  if (technical.market_regime === "VOLATILE" || ai.warning_level === "HIGH") {
    riskLevel = "HIGH";
  } else if (
    technical.confidence >= 65 &&
    ai.warning_level === "LOW"
  ) {
    riskLevel = "LOW";
  }

  let sizeMult = 1 + ai.risk_modifier;
  if (technical.market_regime === "VOLATILE") sizeMult *= 0.75;
  if (dailyLossUsedPct > 0.5) sizeMult *= 0.7;

  let leverage = Math.round(
    baseLeverage * ai.leverage_modifier * (riskLevel === "HIGH" ? 0.85 : 1),
  );
  leverage = Math.max(1, Math.min(maxLeverage, leverage));

  if (fundingRate != null && Math.abs(fundingRate) >= FUNDING_WARN) {
    leverage = Math.max(1, Math.floor(leverage * 0.9));
  }

  const minRr = 1.2;
  const impliedRr =
    technical.confidence >= 50 ? 1.5 + technical.confidence / 200 : 0.8;
  if (impliedRr < minRr && technical.confidence < 40) {
    return {
      approved: false,
      position_size_multiplier: 0,
      leverage: 0,
      risk_level: "HIGH",
      rejection_reason: "Risk/reward too weak for current confidence",
      reason_code: "BAD_RISK_REWARD",
    };
  }

  sizeMult = Math.max(0.25, Math.min(1.2, sizeMult));

  return {
    approved: true,
    position_size_multiplier: sizeMult,
    leverage,
    risk_level: riskLevel,
    rejection_reason: null,
    trailing_stop: { enabled: true, regime: technical.market_regime },
  };
}

export function applyRiskToMargin(
  marginUsdt: number,
  risk: RiskEngineOutput,
): number {
  return Math.max(10, marginUsdt * risk.position_size_multiplier);
}

/** Spot DCA/Grid — size only (no leverage). */
export function runSpotRiskEngine(input: {
  technical: TechnicalEngineOutput;
  baseQuoteUsdt: number;
  minQuoteUsdt?: number;
}): RiskEngineOutput {
  const minQ = input.minQuoteUsdt ?? 5;
  let riskLevel: RiskEngineOutput["risk_level"] = "MEDIUM";
  if (input.technical.market_regime === "VOLATILE") riskLevel = "HIGH";
  else if (input.technical.confidence >= 60) riskLevel = "LOW";

  let sizeMult = 1;
  if (input.technical.market_regime === "VOLATILE") sizeMult = 0.75;
  else if (input.technical.market_regime === "RANGE") sizeMult = 0.88;

  if (input.technical.confidence < 35) {
    return {
      approved: false,
      position_size_multiplier: 0,
      leverage: 1,
      risk_level: "HIGH",
      rejection_reason: "Signal too weak for spot entry",
      reason_code: "BAD_RISK_REWARD",
    };
  }

  sizeMult = Math.max(0.35, Math.min(1.1, sizeMult));
  const quote = Math.max(minQ, input.baseQuoteUsdt * sizeMult);
  if (quote < minQ) {
    return {
      approved: false,
      position_size_multiplier: 0,
      leverage: 1,
      risk_level: "HIGH",
      rejection_reason: "Quote below minimum",
      reason_code: "MIN_NOTIONAL_ERROR",
    };
  }

  return {
    approved: true,
    position_size_multiplier: sizeMult,
    leverage: 1,
    risk_level: riskLevel,
    rejection_reason: null,
  };
}

export function applyRiskToQuote(
  quoteUsdt: number,
  risk: RiskEngineOutput,
  minQuote = 5,
): number {
  return Math.max(minQuote, quoteUsdt * risk.position_size_multiplier);
}
