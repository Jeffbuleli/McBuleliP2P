/**
 * Layer 4 — Execution helpers (Binance error mapping, validation).
 */

import type { ExecutionReasonCode } from "@/lib/bot-decision/reason-codes";

export type ExecutionErrorDetail = {
  execution_status: "FAILED" | "SUCCESS";
  binance_error_code?: number;
  binance_message: string;
  reason_code: ExecutionReasonCode;
};

export function classifyExecutionError(
  raw: string,
): ExecutionErrorDetail {
  const s = raw.trim();
  const codeMatch = s.match(/"code":\s*(-?\d+)/);
  const code = codeMatch ? Number(codeMatch[1]) : undefined;

  let reason_code: ExecutionReasonCode = "BINANCE_REJECTED_ORDER";
  if (code === -1013) reason_code = "MIN_NOTIONAL_ERROR";
  else if (code === -1111) reason_code = "PRECISION_ERROR";
  else if (code === -1102 || s.toLowerCase().includes("quantity")) {
    reason_code = "INVALID_QUANTITY";
  } else if (
    s.toLowerCase().includes("timeout") ||
    s.toLowerCase().includes("etimedout")
  ) {
    reason_code = "API_TIMEOUT";
  }

  return {
    execution_status: "FAILED",
    binance_error_code: code,
    binance_message: s.slice(0, 500),
    reason_code,
  };
}

export function validateMinNotional(
  marginUsdt: number,
  leverage: number,
  markPrice: number,
  minNotional = 5,
): { ok: boolean; notional: number } {
  const notional = marginUsdt * leverage;
  return { ok: notional >= minNotional && markPrice > 0, notional };
}
