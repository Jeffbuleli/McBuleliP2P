"use client";

export type FiatStep = { id: string; label: string };

export function FiatStepper({
  steps,
  current,
}: {
  steps: FiatStep[];
  current: number;
}) {
  return (
    <ol className="mb-5 flex items-center gap-1">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-[color:var(--fd-primary)] text-white"
                    : active
                      ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-2 ring-[color:var(--fd-primary)]"
                      : "bg-[color:var(--fd-card)] text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`max-w-[4.5rem] truncate text-center text-[10px] font-semibold ${
                  active ? "text-[color:var(--fd-primary)]" : "text-[color:var(--fd-muted)]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={`mb-4 h-0.5 flex-1 rounded ${done ? "bg-[color:var(--fd-primary)]" : "bg-[color:var(--fd-border)]"}`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
