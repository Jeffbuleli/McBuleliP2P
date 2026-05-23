"use client";

import type { ReactNode } from "react";
import {
  KycIconFace,
  KycIconId,
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
  hideLabels,
}: {
  steps: KycProgressStep[];
  hideLabels?: boolean;
}) {
  const activeIdx = steps.findIndex((s) => s.state === "active");
  const doneCount = steps.filter((s) => s.state === "done").length;
  const progressIdx = activeIdx >= 0 ? activeIdx : doneCount;
  const pct =
    steps.length <= 1 ? 0 : Math.min(100, (progressIdx / (steps.length - 1)) * 100);

  return (
    <div className="mt-6">
      <div className="relative mb-4 h-1 overflow-hidden rounded-full bg-stone-200/70">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#305f33] to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${Math.max(pct, steps[0]?.state === "done" ? 10 : 6)}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-1 text-center">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                step.state === "done"
                  ? "bg-emerald-100/90 text-emerald-800"
                  : step.state === "active"
                    ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] shadow-sm ring-1 ring-[color:var(--fd-primary)]/20"
                    : "bg-stone-100/80 text-stone-400"
              }`}
              title={step.label}
              aria-label={step.label}
            >
              {step.icon}
            </span>
            {hideLabels ? null : (
              <span
                className={`max-w-[4.5rem] text-[9px] font-semibold leading-tight ${
                  step.state === "active"
                    ? "text-[color:var(--fd-primary)]"
                    : "text-[color:var(--fd-muted)]"
                }`}
              >
                {step.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
