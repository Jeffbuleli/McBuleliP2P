"use client";

import type { ReactNode } from "react";

export type KycStepState = "done" | "active" | "upcoming";

export type KycProgressStep = {
  id: string;
  label: string;
  icon: ReactNode;
  state: KycStepState;
};

export function KycIllustrationId({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="10" y="8" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="24" cy="20" r="6" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 34c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function KycIllustrationFace({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="12" y="10" width="24" height="28" rx="12" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="20" cy="22" r="2" fill="currentColor" />
      <circle cx="28" cy="22" r="2" fill="currentColor" />
      <path d="M20 30c2 2 6 2 8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8 24h4M36 24h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function KycIllustrationShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 6L8 12v10c0 10 6.5 16.5 16 20 9.5-3.5 16-10 16-20V12L24 6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KycIllustrationReview({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.75" opacity="0.35" />
      <path d="M24 14v10l6 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KycProgressBar({ steps }: { steps: KycProgressStep[] }) {
  const activeIdx = steps.findIndex((s) => s.state === "active");
  const doneCount = steps.filter((s) => s.state === "done").length;
  const progressIdx = activeIdx >= 0 ? activeIdx : doneCount;
  const pct =
    steps.length <= 1 ? 0 : Math.min(100, (progressIdx / (steps.length - 1)) * 100);

  return (
    <div>
      <div className="relative mb-6 h-2 overflow-hidden rounded-full bg-stone-200/80">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#305f33] to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${Math.max(pct, steps[0]?.state === "done" ? 8 : 4)}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                step.state === "done"
                  ? "bg-emerald-100 text-emerald-800"
                  : step.state === "active"
                    ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-2 ring-[color:var(--fd-primary)]/30"
                    : "bg-stone-100 text-stone-400"
              }`}
            >
              {step.icon}
            </span>
            <span
              className={`max-w-[4.5rem] text-[9px] font-bold leading-tight ${
                step.state === "active" ? "text-[color:var(--fd-primary)]" : "text-[color:var(--fd-muted)]"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
