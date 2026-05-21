/**
 * Layer 2 — AI / Sentiment modulator (never sole veto on normal setups).
 * GPT/X/news adjust size & leverage; block only on major events.
 */

import type { StoredAiSignal } from "@/lib/bot-ai-signal";
import { AI_WORKER_MIN_EDGE } from "@/lib/bot-ai-signal";
import type { TechnicalEngineOutput } from "@/lib/bot-decision/types";
import type {
  AiModulatorOutput,
  AiSentiment,
} from "@/lib/bot-decision/types";

const MACRO_KEYWORDS =
  /\b(cpi|fomc|fed\s+rate|rate\s+hike|crash|hack|exploit|sec\s+sue|ban\s+crypto|war\s+escalat|liquidation\s+cascade|bankruptcy|chapter\s+11)\b/i;

const MANIP_KEYWORDS =
  /\b(whale\s+dump|spoofing|manipulation|fake\s+breakout|pump\s+and\s+dump)\b/i;

function mapSentiment(sig: StoredAiSignal | null): AiSentiment {
  if (!sig) return "NEUTRAL";
  const s = (sig.x_sentiment ?? sig.action ?? "").toLowerCase();
  if (s.includes("bull") || sig.action === "LONG") return "BULLISH";
  if (s.includes("bear") || sig.action === "SHORT") return "BEARISH";
  if (sig.action === "HOLD") return "NEUTRAL";
  return "NEUTRAL";
}

function detectBlockingEvent(sig: StoredAiSignal | null): boolean {
  if (!sig) return false;
  const text = [
    sig.x_reason ?? "",
    ...(sig.reasons ?? []),
  ].join(" ");
  const conf = sig.confidence;
  if (conf < 80) return false;
  if (MACRO_KEYWORDS.test(text)) return true;
  if (MANIP_KEYWORDS.test(text) && conf >= 85) return true;
  if (
    sig.x_position_action === "close_now" &&
    conf >= 88 &&
    MACRO_KEYWORDS.test(text)
  ) {
    return true;
  }
  const shock = sig.reasons?.some((r) =>
    /shock|emergency|halt|suspend/i.test(r),
  );
  return Boolean(shock && conf >= 82);
}

function effConf(sig: StoredAiSignal): number {
  return Math.max(sig.confidence, Math.abs(sig.combined_score));
}

export function runAiSentimentEngine(args: {
  botSide: "LONG" | "SHORT";
  technical: TechnicalEngineOutput;
  signal: StoredAiSignal | null;
  aiAssistMode: boolean;
  minTechnicalForOverride: number;
}): AiModulatorOutput {
  const notes: string[] = [];
  const techStrong =
    Math.abs(args.technical.score) >= args.minTechnicalForOverride;

  if (!args.aiAssistMode) {
    return {
      sentiment: "NEUTRAL",
      confidence: 0,
      risk_modifier: 0,
      leverage_modifier: 1,
      warning_level: "LOW",
      ai_notes: ["ai_assist_off"],
      blocking_event: false,
      caution_only: false,
    };
  }

  const sig = args.signal;
  if (!sig) {
    return {
      sentiment: "NEUTRAL",
      confidence: 0,
      risk_modifier: techStrong ? -0.05 : -0.1,
      leverage_modifier: techStrong ? 0.92 : 0.85,
      warning_level: "MEDIUM",
      ai_notes: ["no_recent_ai_signal — technical leads"],
      blocking_event: false,
      caution_only: true,
    };
  }

  const sentiment = mapSentiment(sig);
  const confidence = effConf(sig);
  const blocking = detectBlockingEvent(sig);

  if (blocking) {
    notes.push("major_event_detected");
    return {
      sentiment,
      confidence,
      risk_modifier: -0.5,
      leverage_modifier: 0.4,
      warning_level: "HIGH",
      ai_notes: notes,
      blocking_event: true,
      caution_only: false,
    };
  }

  const combined = sig.combined_score;
  const aligns =
    args.botSide === "LONG"
      ? combined >= AI_WORKER_MIN_EDGE || sig.action === "LONG"
      : combined <= -AI_WORKER_MIN_EDGE || sig.action === "SHORT";

  const opposes =
    args.botSide === "LONG"
      ? sentiment === "BEARISH" && confidence >= 55
      : sentiment === "BULLISH" && confidence >= 55;

  let risk_modifier = 0;
  let leverage_modifier = 1;
  let warning: AiModulatorOutput["warning_level"] = "LOW";

  if (aligns && !opposes) {
    risk_modifier = 0.08;
    leverage_modifier = 1.05;
    notes.push("ai_aligns_with_technical");
  } else if (opposes) {
    if (techStrong) {
      risk_modifier = -0.15;
      leverage_modifier = 0.72;
      warning = "MEDIUM";
      notes.push("ai_mild_opposition — reduced size (technical strong)");
    } else {
      risk_modifier = -0.25;
      leverage_modifier = 0.6;
      warning = "MEDIUM";
      notes.push("ai_opposes — reduced leverage");
    }
  } else if (sig.action === "HOLD") {
    if (techStrong) {
      leverage_modifier = 0.78;
      risk_modifier = -0.1;
      warning = "MEDIUM";
      notes.push("worker_hold — technical override with sizing");
    } else {
      leverage_modifier = 0.65;
      risk_modifier = -0.2;
      warning = "MEDIUM";
      notes.push("worker_hold — caution sizing");
    }
  }

  if (sig.risk_level === "HIGH") {
    leverage_modifier *= 0.85;
    warning = warning === "LOW" ? "MEDIUM" : warning;
    notes.push("worker_high_risk_flag");
  }

  return {
    sentiment,
    confidence,
    risk_modifier,
    leverage_modifier: Math.max(0.35, Math.min(1.15, leverage_modifier)),
    warning_level: warning,
    ai_notes: notes,
    blocking_event: false,
    caution_only: !aligns || opposes || sig.action === "HOLD",
  };
}
