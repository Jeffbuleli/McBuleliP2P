"use client";

import Link from "next/link";

export function AcademyContinueBar({
  continueLabel,
  nextStepLabel,
  continueHref,
  showEnroll,
  enrolling,
  onEnroll,
  enrollLabel,
}: {
  continueLabel: string;
  nextStepLabel: string;
  continueHref: string;
  showEnroll: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  enrollLabel: string;
}) {
  return (
    <div className="pointer-events-none fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-2xl border border-[#305f33]/30 bg-[#305f33] p-2 pl-3 shadow-lg shadow-[#305f33]/25">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-[#c5e8d0]">
            {continueLabel}
          </p>
          <p className="truncate text-xs font-semibold text-white">{nextStepLabel}</p>
        </div>
        {showEnroll ? (
          <button
            type="button"
            disabled={enrolling}
            onClick={onEnroll}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-[#305f33] disabled:opacity-60"
          >
            {enrollLabel}
          </button>
        ) : (
          <Link
            href={continueHref}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-[#305f33]"
          >
            →
          </Link>
        )}
      </div>
    </div>
  );
}
