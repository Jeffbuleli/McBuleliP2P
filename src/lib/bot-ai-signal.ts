import { eq } from "drizzle-orm";
import { getDb, botInstances, platformSettings } from "@/db";

export type AiSignalAction = "LONG" | "SHORT" | "HOLD";

export type XPositionAction =
  | "close_now"
  | "close_and_reverse"
  | "monitor"
  | "no_action";

export type StoredAiSignal = {
  version: number;
  symbol: string;
  action: AiSignalAction;
  confidence: number;
  strategy: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  timeframe: string;
  technical_score: number;
  combined_score: number;
  sentiment_score: number;
  reasons: string[];
  ts: string;
  receivedAt: string;
  x_position_action?: XPositionAction;
  x_new_direction?: "LONG" | "SHORT";
  x_sentiment?: string;
  x_reason?: string;
};

const AI_CLOSE_MIN_CONF = 75;
const AI_REVERSE_MIN_CONF = 85;

/** Align with Python worker `SIGNAL_MIN_EDGE` (default 15 on Render). */
export const AI_WORKER_MIN_EDGE = 15;

function effectiveAiConfidence(sig: StoredAiSignal): number {
  return Math.max(sig.confidence, Math.abs(sig.combined_score));
}

function combinedAlignsWithSide(
  botSide: "LONG" | "SHORT",
  combinedScore: number,
  minEdge: number = AI_WORKER_MIN_EDGE,
): boolean {
  if (botSide === "LONG") return combinedScore >= minEdge;
  return combinedScore <= -minEdge;
}

const KEY_PREFIX = "bots_ai:";
const DEFAULT_MAX_AGE_MS = 120_000;

const X_ANALYST_REASON_PREFIX = "X analyst:";

/** Parses worker reason line from X LLM analyst (e.g. "bearish close_now 85%"). */
export function extractXAnalystInsight(reasons: string[] | undefined): string | null {
  if (!reasons?.length) return null;
  const line = reasons.find((r) => r.trimStart().startsWith("X:"));
  if (!line) {
    const legacy = reasons.find((r) =>
      r.trimStart().startsWith(X_ANALYST_REASON_PREFIX),
    );
    if (!legacy) return null;
    const insight = legacy
      .replace(new RegExp(`^\\s*${X_ANALYST_REASON_PREFIX}\\s*`, "i"), "")
      .trim();
    return insight.length > 0 ? insight : null;
  }
  return line.replace(/^X:\s*/i, "").trim() || null;
}

function sentimentOpposesSide(
  sentiment: string | undefined,
  side: "LONG" | "SHORT",
  confidence: number,
): boolean {
  const s = (sentiment ?? "").toLowerCase();
  if (confidence < AI_CLOSE_MIN_CONF) return false;
  if (side === "LONG" && (s === "bearish" || s === "volatile")) return true;
  if (side === "SHORT" && s === "bullish") return true;
  return false;
}

export type AiPositionExitResult =
  | {
      exit: true;
      kind: "close_now" | "close_and_reverse";
      reverseTo?: "LONG" | "SHORT";
      reason: string;
    }
  | { exit: false };

/** X-driven early exit when open position conflicts with strong sentiment. */
export function evaluateAiPositionExit(args: {
  positionSide: "LONG" | "SHORT";
  signal: StoredAiSignal | null;
  aiAssistMode: boolean;
}): AiPositionExitResult {
  if (!args.aiAssistMode || !args.signal) {
    return { exit: false };
  }

  const sig = args.signal;
  const xAction = sig.x_position_action;
  const conf = sig.confidence;
  const opposes = sentimentOpposesSide(
    sig.x_sentiment,
    args.positionSide,
    conf,
  );

  if (!xAction || xAction === "no_action" || xAction === "monitor") {
    return { exit: false };
  }

  if (xAction === "close_now") {
    if (conf < AI_CLOSE_MIN_CONF || !opposes) {
      return { exit: false };
    }
    return {
      exit: true,
      kind: "close_now",
      reason: sig.x_reason ?? "ai_x_close_now",
    };
  }

  if (xAction === "close_and_reverse") {
    if (conf < AI_REVERSE_MIN_CONF || !opposes) {
      return { exit: false };
    }
    const reverseTo =
      sig.x_new_direction === "LONG" || sig.x_new_direction === "SHORT"
        ? sig.x_new_direction
        : args.positionSide === "LONG"
          ? "SHORT"
          : "LONG";
    return {
      exit: true,
      kind: "close_and_reverse",
      reverseTo,
      reason: sig.x_reason ?? "ai_x_close_and_reverse",
    };
  }

  return { exit: false };
}

function settingKey(instanceId: string): string {
  return `${KEY_PREFIX}${instanceId}`;
}

export async function storeAiSignal(
  instanceId: string,
  signal: Omit<StoredAiSignal, "receivedAt">,
): Promise<StoredAiSignal> {
  const stored: StoredAiSignal = {
    ...signal,
    receivedAt: new Date().toISOString(),
  };
  const db = getDb();
  await db
    .insert(platformSettings)
    .values({ key: settingKey(instanceId), value: JSON.stringify(stored) })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: JSON.stringify(stored), updatedAt: new Date() },
    });
  return stored;
}

async function readStoredAiSignal(
  instanceId: string,
): Promise<StoredAiSignal | null> {
  const db = getDb();
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, settingKey(instanceId)))
    .limit(1);
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as StoredAiSignal;
    if (typeof parsed.receivedAt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAiSignal(
  instanceId: string,
  maxAgeMs = DEFAULT_MAX_AGE_MS,
): Promise<StoredAiSignal | null> {
  const parsed = await readStoredAiSignal(instanceId);
  if (!parsed) return null;
  const age = Date.now() - new Date(parsed.receivedAt).getTime();
  if (!Number.isFinite(age) || age > maxAgeMs) return null;
  return parsed;
}

export type AiSignalStatus = {
  signal: StoredAiSignal | null;
  ageMs: number | null;
  fresh: boolean;
  maxAgeMs: number;
};

/** UI / diagnostics - returns last signal even when stale. */
export async function getAiSignalStatus(
  instanceId: string,
  maxAgeMs = DEFAULT_MAX_AGE_MS,
): Promise<AiSignalStatus> {
  const signal = await readStoredAiSignal(instanceId);
  if (!signal) {
    return { signal: null, ageMs: null, fresh: false, maxAgeMs };
  }
  const ageMs = Date.now() - new Date(signal.receivedAt).getTime();
  const fresh =
    Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= maxAgeMs;
  return { signal, ageMs: Number.isFinite(ageMs) ? ageMs : null, fresh, maxAgeMs };
}

export type AiAssistGateResult =
  | { ok: true; signal: StoredAiSignal; softAlign?: boolean }
  | { ok: false; reason: string };

/**
 * Legacy AI gate - modulator only (no paralysis on HOLD / mild opposition).
 * Primary entry path uses `runFuturesDecisionOrchestrator`.
 */
export function runAiAssistGate(args: {
  botSide: "LONG" | "SHORT";
  minAiConfidence: number;
  signal: StoredAiSignal | null;
  aiAssistMode: boolean;
  /** Technical score from TA gate when available */
  technicalScore?: number;
  allowXReverse?: boolean;
}): AiAssistGateResult {
  if (!args.aiAssistMode) {
    return { ok: true, signal: args.signal ?? ({} as StoredAiSignal) };
  }

  const sig = args.signal;
  if (!sig) {
    const techStrong =
      args.technicalScore != null &&
      Math.abs(args.technicalScore) >= args.minAiConfidence;
    if (techStrong) {
      return { ok: true, signal: {} as StoredAiSignal, softAlign: true };
    }
    return { ok: false, reason: "ai_signal_stale" };
  }

  if (
    args.allowXReverse &&
    sig.x_position_action === "close_and_reverse" &&
    sig.confidence >= AI_REVERSE_MIN_CONF &&
    sig.x_new_direction === args.botSide
  ) {
    return { ok: true, signal: sig };
  }

  const text = [sig.x_reason ?? "", ...(sig.reasons ?? [])].join(" ");
  const macroBlock =
    /\b(cpi|fomc|crash|hack|exploit|liquidation\s+cascade)\b/i.test(text) &&
    sig.confidence >= 80;
  if (macroBlock) {
    return { ok: false, reason: "ai_signal_hold" };
  }

  const effConf = effectiveAiConfidence(sig);
  const techStrong =
    (args.technicalScore != null &&
      Math.abs(args.technicalScore) >= args.minAiConfidence) ||
    effConf >= args.minAiConfidence;

  if (sig.action === "HOLD") {
    if (combinedAlignsWithSide(args.botSide, sig.combined_score) || techStrong) {
      return { ok: true, signal: sig, softAlign: true };
    }
    return { ok: false, reason: "ai_signal_hold" };
  }

  if (effConf < args.minAiConfidence && !techStrong) {
    return { ok: false, reason: "ai_low_confidence" };
  }

  if (sig.risk_level === "HIGH" && effConf < 45 && !techStrong) {
    return { ok: false, reason: "ai_high_risk" };
  }

  if (args.botSide === "LONG" && sig.action === "SHORT" && !techStrong) {
    return { ok: false, reason: "ai_side_mismatch" };
  }
  if (args.botSide === "SHORT" && sig.action === "LONG" && !techStrong) {
    return { ok: false, reason: "ai_side_mismatch" };
  }

  return { ok: true, signal: sig };
}

export async function getBotInstanceById(instanceId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: botInstances.id,
      userId: botInstances.userId,
      planId: botInstances.planId,
      billing: botInstances.billing,
      status: botInstances.status,
    })
    .from(botInstances)
    .where(eq(botInstances.id, instanceId))
    .limit(1);
  return row ?? null;
}
