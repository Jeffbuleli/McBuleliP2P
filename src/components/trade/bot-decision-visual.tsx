"use client";

import {
  DecisionCategoryIcon,
  DecisionReasonIcon,
} from "@/components/trade/bot-feed-icons";
import { categoryAccent } from "@/lib/bot-decision/reason-codes";
import { IconCron } from "@/components/trade/bot-visual-icons";

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
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${colors[accent] ?? colors.stone}`}
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
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-stone-200/80">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
            positive ? "bg-emerald-500/90" : "bg-rose-500/90"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`min-w-[2rem] text-right text-[10px] font-semibold tabular-nums ${
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
  const label = reasonCode.replace(/_/g, " ");

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--fd-border)] bg-stone-50 text-[color:var(--fd-primary)]">
          <DecisionReasonIcon code={reasonCode} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-mono text-xs font-semibold tracking-tight text-[color:var(--fd-text)]">
            {label}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <DecisionCategoryIcon category={category} size={14} />
            {typeof score === "number" ? (
              <span className="rounded border border-[color:var(--fd-border)] bg-white px-1.5 py-px text-[10px] font-medium tabular-nums text-[color:var(--fd-muted)]">
                TA {score > 0 ? "+" : ""}
                {score}
              </span>
            ) : null}
            {typeof confidence === "number" ? (
              <span className="rounded border border-violet-200/80 bg-violet-50/80 px-1.5 py-px text-[10px] font-medium text-violet-800">
                IA {confidence}%
              </span>
            ) : null}
            {warningLevel ? (
              <span className="rounded border border-amber-200/80 bg-amber-50/80 px-1.5 py-px text-[10px] font-medium text-amber-900">
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
      className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50/90 text-amber-800"
      aria-hidden
    >
      <IconCron size={14} className="relative" />
    </span>
  );
}
