"use client";

import { categoryAccent } from "@/lib/bot-decision/reason-codes";

const CATEGORY_ICON: Record<string, string> = {
  TECHNICAL: "◫",
  AI: "◈",
  RISK: "⚠",
  EXECUTION: "⚡",
  SYSTEM: "⏱",
};

const REASON_ICON: Record<string, string> = {
  TREND_CONFLICT: "↔",
  LOW_SCORE: "▽",
  HIGH_VOLATILITY: "〰",
  RANGE_MARKET: "▭",
  MACRO_EVENT_WARNING: "◉",
  COOLDOWN_ACTIVE: "⏳",
  FUNDING_TOO_HIGH: "₿",
  MIN_NOTIONAL_ERROR: "⊘",
  BAD_RISK_REWARD: "⚖",
};

export function DecisionCategoryDot({ category }: { category?: string }) {
  const accent = categoryAccent(
    (category?.toUpperCase() as "TECHNICAL" | "AI" | "RISK" | "EXECUTION" | "SYSTEM") ??
      "SYSTEM",
  );
  const colors: Record<string, string> = {
    sky: "bg-sky-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    stone: "bg-stone-400",
  };
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors[accent] ?? colors.stone}`}
      title={category}
      aria-hidden
    />
  );
}

export function TechnicalScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.abs(score));
  const positive = score >= 0;
  return (
    <div className="flex items-center gap-2" title={`Score ${score}`}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-stone-200/90">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
            positive ? "bg-emerald-500" : "bg-rose-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`min-w-[2.25rem] text-right text-xs font-bold tabular-nums ${
          positive ? "text-emerald-700" : "text-rose-700"
        }`}
      >
        {score > 0 ? "+" : ""}
        {score}
      </span>
    </div>
  );
}

export function DecisionSkipCard({
  reasonCode,
  category,
  score,
  confidence,
  warningLevel,
}: {
  reasonCode: string;
  category?: string;
  score?: number;
  confidence?: number;
  warningLevel?: string;
}) {
  const cat = category?.toUpperCase() ?? "SYSTEM";
  const icon = REASON_ICON[reasonCode] ?? CATEGORY_ICON[cat] ?? "⊘";

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-base"
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <DecisionCategoryDot category={cat} />
            <span className="truncate font-mono text-sm font-bold tracking-tight text-[color:var(--fd-text)]">
              {reasonCode.replace(/_/g, " ")}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {typeof score === "number" ? (
              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-stone-700">
                TA {score > 0 ? "+" : ""}
                {score}
              </span>
            ) : null}
            {typeof confidence === "number" ? (
              <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">
                IA {confidence}%
              </span>
            ) : null}
            {warningLevel ? (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                {warningLevel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {typeof score === "number" ? <TechnicalScoreBar score={score} /> : null}
    </div>
  );
}

export function CronPulseIcon() {
  return (
    <span
      className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100"
      aria-hidden
    >
      <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-amber-400 opacity-60" />
      <span className="relative text-[11px] font-bold text-amber-900">◎</span>
    </span>
  );
}
