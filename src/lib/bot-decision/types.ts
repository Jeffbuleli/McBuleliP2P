import type { TradeSignal } from "@/lib/bot-intelligence/types";
import type {
  DecisionCategory,
  DecisionReasonCode,
} from "@/lib/bot-decision/reason-codes";

export type TechnicalSignal = "LONG" | "SHORT" | "NEUTRAL";
export type MarketRegime = "TREND" | "RANGE" | "VOLATILE";

export type TechnicalEngineOutput = {
  signal: TechnicalSignal;
  score: number;
  rawScore: number;
  confidence: number;
  reasons: string[];
  timeframe_analysis: {
    entry: { timeframe: string; score: number; bias: string };
    confirm?: { timeframe: string; score: number; bias: string };
  };
  market_regime: MarketRegime;
  tradeSignal: TradeSignal;
  confirmSignal?: TradeSignal;
};

export type AiSentiment = "BULLISH" | "BEARISH" | "NEUTRAL";

export type AiModulatorOutput = {
  sentiment: AiSentiment;
  confidence: number;
  risk_modifier: number;
  leverage_modifier: number;
  warning_level: "LOW" | "MEDIUM" | "HIGH";
  ai_notes: string[];
  blocking_event: boolean;
  /** Soft caution only - does not veto when technical is strong */
  caution_only: boolean;
};

export type RiskEngineOutput = {
  approved: boolean;
  position_size_multiplier: number;
  leverage: number;
  sl?: number;
  tp?: number[];
  trailing_stop?: Record<string, unknown>;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  rejection_reason: string | null;
  reason_code?: DecisionReasonCode;
};

export type ExecutionPlan = {
  symbol: string;
  side?: "LONG" | "SHORT";
  leverage?: number;
  marginUsdt?: number;
  quoteUsdt?: number;
  quantityHint?: string;
};

export type SpotPipelineResult =
  | {
      status: "EXECUTE";
      technical: TechnicalEngineOutput;
      risk: RiskEngineOutput;
      trace_id: string;
      execution: ExecutionPlan;
    }
  | {
      status: "IGNORED";
      trace: IgnoredSignalTrace;
      technical?: TechnicalEngineOutput;
      risk?: RiskEngineOutput;
    };

export type IgnoredSignalTrace = {
  signal_id: string;
  signal: TechnicalSignal;
  score: number;
  status: "IGNORED";
  category: DecisionCategory;
  reason_code: DecisionReasonCode;
  reason_message: string;
  timestamp: string;
  debug: Record<string, unknown>;
};

export type DecisionPipelineResult =
  | {
      status: "EXECUTE";
      technical: TechnicalEngineOutput;
      ai: AiModulatorOutput;
      risk: RiskEngineOutput;
      execution: ExecutionPlan;
      trace_id: string;
    }
  | {
      status: "IGNORED";
      trace: IgnoredSignalTrace;
      technical?: TechnicalEngineOutput;
      ai?: AiModulatorOutput;
      risk?: RiskEngineOutput;
    };
