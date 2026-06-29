/**
 * Decision Orchestrator - priority: Technical → Risk → AI → Execution plan.
 * AI cannot veto strong technical setups except blocking_event (macro/crash).
 */

import type { BotEnvironment } from "@/lib/bot-config";
import type { BotSmartConfig } from "@/lib/bot-smart-config";
import type { StoredAiSignal } from "@/lib/bot-ai-signal";
import { runAiSentimentEngine } from "@/lib/bot-decision/ai-sentiment-engine";
import {
  applyRiskToMargin,
  runRiskEngine,
} from "@/lib/bot-decision/risk-engine";
import { runTechnicalEngine, technicalAlignsWithBot } from "@/lib/bot-decision/technical-engine";
import { REASON_CATEGORY } from "@/lib/bot-decision/reason-codes";
import type { DecisionReasonCode } from "@/lib/bot-decision/reason-codes";
import { buildIgnoredTrace, newSignalId } from "@/lib/bot-decision/trace";
import type {
  DecisionPipelineResult,
  SpotPipelineResult,
} from "@/lib/bot-decision/types";
import { validateMinNotional } from "@/lib/bot-decision/execution-engine";
import {
  applyRiskToQuote,
  runSpotRiskEngine,
} from "@/lib/bot-decision/risk-engine";

export type FuturesOrchestratorInput = {
  instanceId: string;
  environment: BotEnvironment;
  symbol: string;
  botSide: "LONG" | "SHORT";
  smart: BotSmartConfig;
  confirmTimeframe?: string | null;
  aiSignal: StoredAiSignal | null;
  aiAssistMode: boolean;
  leverage: number;
  marginUsdt: number;
  fundingRate?: number | null;
  markPrice: number;
  previousSmoothedScore?: number | null;
};

export async function runFuturesDecisionOrchestrator(
  input: FuturesOrchestratorInput,
): Promise<DecisionPipelineResult> {
  const traceId = newSignalId();
  const intent = input.botSide === "LONG" ? "long" : "short";

  const technicalResult = await runTechnicalEngine({
    environment: input.environment,
    symbol: input.symbol,
    market: "futures",
    smart: input.smart,
    intent,
    confirmTimeframe: input.confirmTimeframe,
    previousSmoothedScore: input.previousSmoothedScore,
  });

  if (!technicalResult.ok) {
    const out = technicalResult.output;
    return {
      status: "IGNORED",
      trace: buildIgnoredTrace({
        signal_id: traceId,
        signal: out?.signal ?? "NEUTRAL",
        score: out?.score ?? 0,
        category: REASON_CATEGORY[technicalResult.reason_code],
        reason_code: technicalResult.reason_code,
        reason_message: technicalResult.reason_message,
        debug: {
          layer: "TECHNICAL",
          rawScore: out?.rawScore,
          regime: out?.market_regime,
          timeframe_analysis: out?.timeframe_analysis,
        },
      }),
      technical: out,
    };
  }

  const technical = technicalResult.output;

  if (!technicalAlignsWithBot(technical, input.botSide)) {
    return {
      status: "IGNORED",
      trace: buildIgnoredTrace({
        signal_id: traceId,
        signal: technical.signal,
        score: technical.score,
        category: "TECHNICAL",
        reason_code: "TREND_CONFLICT",
        reason_message: `Technical ${technical.signal} conflicts with bot side ${input.botSide}`,
        debug: { layer: "TECHNICAL", confidence: technical.confidence },
      }),
      technical,
    };
  }

  const ai = runAiSentimentEngine({
    botSide: input.botSide,
    technical,
    signal: input.aiSignal,
    aiAssistMode: input.aiAssistMode,
    minTechnicalForOverride: input.smart.minSignalScore,
  });

  if (ai.blocking_event) {
    const code: DecisionReasonCode = ai.ai_notes.some((n) =>
      n.includes("major_event"),
    )
      ? "MACRO_EVENT_WARNING"
      : "HIGH_NEWS_RISK";
    return {
      status: "IGNORED",
      trace: buildIgnoredTrace({
        signal_id: traceId,
        signal: technical.signal,
        score: technical.score,
        category: "AI",
        reason_code: code,
        reason_message: "AI flagged major market event - trade paused",
        debug: { layer: "AI", ai_notes: ai.ai_notes, blocking_event: true },
      }),
      technical,
      ai,
    };
  }

  const fundingRate =
    input.fundingRate ?? technical.tradeSignal.context.fundingRate ?? null;

  const risk = runRiskEngine({
    technical,
    ai,
    baseLeverage: input.leverage,
    baseMarginUsdt: input.marginUsdt,
    fundingRate,
    maxLeverage: input.leverage,
  });

  if (!risk.approved) {
    return {
      status: "IGNORED",
      trace: buildIgnoredTrace({
        signal_id: traceId,
        signal: technical.signal,
        score: technical.score,
        category: "RISK",
        reason_code: risk.reason_code ?? "BAD_RISK_REWARD",
        reason_message: risk.rejection_reason ?? "Risk engine rejected",
        debug: {
          layer: "RISK",
          ai_warning: ai.warning_level,
          leverage_modifier: ai.leverage_modifier,
        },
      }),
      technical,
      ai,
      risk,
    };
  }

  const margin = applyRiskToMargin(input.marginUsdt, risk);
  const notionalCheck = validateMinNotional(
    margin,
    risk.leverage,
    input.markPrice,
  );
  if (!notionalCheck.ok) {
    return {
      status: "IGNORED",
      trace: buildIgnoredTrace({
        signal_id: traceId,
        signal: technical.signal,
        score: technical.score,
        category: "EXECUTION",
        reason_code: "MIN_NOTIONAL_ERROR",
        reason_message: `Notional ${notionalCheck.notional.toFixed(2)} below minimum`,
        debug: { margin, leverage: risk.leverage },
      }),
      technical,
      ai,
      risk,
    };
  }

  return {
    status: "EXECUTE",
    technical,
    ai,
    risk,
    trace_id: traceId,
    execution: {
      symbol: input.symbol,
      side: input.botSide,
      leverage: risk.leverage,
      marginUsdt: margin,
    },
  };
}

export type SpotOrchestratorInput = {
  environment: BotEnvironment;
  symbol: string;
  smart: BotSmartConfig;
  quoteUsdt: number;
  minQuoteUsdt?: number;
  markPrice: number;
  previousSmoothedScore?: number | null;
};

/** DCA / Grid - Technical → Risk (no AI gate on spot). */
export async function runSpotDecisionOrchestrator(
  input: SpotOrchestratorInput,
): Promise<SpotPipelineResult> {
  const traceId = newSignalId();

  const technicalResult = await runTechnicalEngine({
    environment: input.environment,
    symbol: input.symbol,
    market: "spot",
    smart: input.smart,
    intent: "spot_buy",
    previousSmoothedScore: input.previousSmoothedScore,
  });

  if (!technicalResult.ok) {
    const out = technicalResult.output;
    return {
      status: "IGNORED",
      trace: buildIgnoredTrace({
        signal_id: traceId,
        signal: out?.signal ?? "NEUTRAL",
        score: out?.score ?? 0,
        category: REASON_CATEGORY[technicalResult.reason_code],
        reason_code: technicalResult.reason_code,
        reason_message: technicalResult.reason_message,
        debug: { layer: "TECHNICAL", plan: "spot" },
      }),
      technical: out,
    };
  }

  const technical = technicalResult.output;
  const risk = runSpotRiskEngine({
    technical,
    baseQuoteUsdt: input.quoteUsdt,
    minQuoteUsdt: input.minQuoteUsdt,
  });

  if (!risk.approved) {
    return {
      status: "IGNORED",
      trace: buildIgnoredTrace({
        signal_id: traceId,
        signal: technical.signal,
        score: technical.score,
        category: "RISK",
        reason_code: risk.reason_code ?? "BAD_RISK_REWARD",
        reason_message: risk.rejection_reason ?? "Risk rejected",
        debug: { layer: "RISK", plan: "spot" },
      }),
      technical,
      risk,
    };
  }

  const quote = applyRiskToQuote(
    input.quoteUsdt,
    risk,
    input.minQuoteUsdt ?? 5,
  );
  const notionalCheck = validateMinNotional(quote, 1, input.markPrice);
  if (!notionalCheck.ok) {
    return {
      status: "IGNORED",
      trace: buildIgnoredTrace({
        signal_id: traceId,
        signal: technical.signal,
        score: technical.score,
        category: "EXECUTION",
        reason_code: "MIN_NOTIONAL_ERROR",
        reason_message: "Order size below exchange minimum",
        debug: { quote, mark: input.markPrice },
      }),
      technical,
      risk,
    };
  }

  return {
    status: "EXECUTE",
    technical,
    risk,
    trace_id: traceId,
    execution: {
      symbol: input.symbol,
      quoteUsdt: quote,
    },
  };
}
