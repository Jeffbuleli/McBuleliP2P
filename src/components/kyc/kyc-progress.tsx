"use client";

import type { ReactNode } from "react";
import {
  KycIconFace,
  KycIconId,
  KycIconLaunch,
  KycIconReview,
  KycIconShield,
} from "@/components/kyc/kyc-illustrations";

export type KycStepState = "done" | "active" | "upcoming";

export type KycProgressStep = {
  id: string;
  label: string;
  icon: ReactNode;
  state: KycStepState;
};

export {
  KycIconFace as KycIllustrationFace,
  KycIconId as KycIllustrationId,
  KycIconReview as KycIllustrationReview,
  KycIconShield as KycIllustrationShield,
  KycIconLaunch as KycIllustrationLaunch,
};

export function KycIllustrationError({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.75" opacity="0.35" />
      <path d="M24 16v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="32" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function KycProgressBar({
  steps,
  labelActiveOnly,
}: {
  steps: KycProgressStep[];
  /** Hide step captions except the active one (minimal copy). */
  labelActiveOnly?: boolean;
  hideLabels?: boolean;
}) {
  const activeIdx = steps.findIndex((s) => s.state === "active");
  const doneCount = steps.filter((s) => s.state === "done").length;
  const progressIdx = activeIdx >= 0 ? activeIdx : doneCount;
  const pct =
    steps.length <= 1 ? 0 : Math.min(100, (progressIdx / (steps.length - 1)) * 100);

  return (
    <div className="mt-5">
      <div className="relative mb-5 h-1 overflow-hidden rounded-full bg-stone-200/70">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#305f33] to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${Math.max(pct, steps[0]?.state === "done" ? 10 : 6)}%` }}
        />
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-2 text-center">
            <span
              className={`flex items-center justify-center rounded-2xl transition-all ${
                step.state === "active"
                  ? "h-14 w-14 bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] shadow-md ring-2 ring-[color:var(--fd-primary)]/15"
                  : step.state === "done"
                    ? "h-12 w-12 bg-emerald-100/90 text-emerald-800"
                    : "h-12 w-12 bg-stone-100/80 text-stone-400"
              }`}
              title={step.label}
              aria-label={step.label}
            >
              <span className={step.state === "active" ? "scale-110" : ""}>{step.icon}</span>
            </span>
            {labelActiveOnly ? (
              step.state === "active" ? (
                <span className="max-w-[4.75rem] text-[10px] font-bold leading-tight text-[color:var(--fd-primary)]">
                  {step.label}
                </span>
              ) : (
                <span className="h-3" aria-hidden />
              )
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
