import { randomUUID } from "crypto";
import type {
  DecisionCategory,
  DecisionReasonCode,
} from "@/lib/bot-decision/reason-codes";
import { REASON_CATEGORY } from "@/lib/bot-decision/reason-codes";
import type { IgnoredSignalTrace } from "@/lib/bot-decision/types";
import type { TechnicalSignal } from "@/lib/bot-decision/types";

export function newSignalId(): string {
  return randomUUID();
}

export function buildIgnoredTrace(args: {
  signal: TechnicalSignal;
  score: number;
  category: DecisionCategory;
  reason_code: DecisionReasonCode;
  reason_message: string;
  debug?: Record<string, unknown>;
  signal_id?: string;
}): IgnoredSignalTrace {
  return {
    signal_id: args.signal_id ?? newSignalId(),
    signal: args.signal,
    score: args.score,
    status: "IGNORED",
    category: args.category,
    reason_code: args.reason_code,
    reason_message: args.reason_message,
    timestamp: new Date().toISOString(),
    debug: args.debug ?? {},
  };
}

export function traceFromReasonCode(
  reason_code: DecisionReasonCode,
  reason_message: string,
  signal: TechnicalSignal,
  score: number,
  debug?: Record<string, unknown>,
): IgnoredSignalTrace {
  return buildIgnoredTrace({
    signal,
    score,
    category: REASON_CATEGORY[reason_code],
    reason_code,
    reason_message,
    debug,
  });
}

/** UI: "IGNORÉ → TREND_CONFLICT" */
export function formatIgnoredLabel(reason_code: string): string {
  return `→ ${reason_code}`;
}
