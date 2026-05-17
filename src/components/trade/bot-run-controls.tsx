"use client";

type Variant = "emerald" | "violet" | "amber";

const START: Record<Variant, string> = {
  emerald: "bg-emerald-700 hover:bg-emerald-800",
  violet: "bg-violet-700 hover:bg-violet-800",
  amber: "bg-amber-700 hover:bg-amber-800",
};

export function BotRunControls({
  status,
  busy,
  monitoringOpen,
  monitoringLabel,
  startLabel,
  pauseLabel,
  onStart,
  onPause,
  variant = "emerald",
}: {
  status: "active" | "paused" | "none";
  busy: boolean;
  monitoringOpen?: boolean;
  monitoringLabel?: string;
  startLabel: string;
  pauseLabel: string;
  onStart: () => void;
  onPause: () => void;
  variant?: Variant;
}) {
  const active = status === "active";

  return (
    <div className="mt-4 space-y-3">
      {active && monitoringOpen && monitoringLabel ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-amber-400/50 bg-amber-100/90 px-3 py-2.5 dark:border-amber-600/40 dark:bg-amber-950/50"
          role="status"
        >
          <span
            className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500"
            aria-hidden
          />
          <p className="text-sm font-medium leading-snug text-amber-950 dark:text-amber-100">
            {monitoringLabel}
          </p>
        </div>
      ) : null}

      <div className="flex gap-2">
        {!active ? (
          <button
            type="button"
            disabled={busy}
            onClick={onStart}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40 ${START[variant]}`}
          >
            {startLabel}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onPause}
            className="flex-1 rounded-xl border-2 border-stone-400 bg-white py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-40 dark:border-stone-500 dark:bg-stone-900 dark:text-stone-100"
          >
            {pauseLabel}
          </button>
        )}
      </div>
    </div>
  );
}
