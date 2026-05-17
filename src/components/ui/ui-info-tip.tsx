"use client";

type Props = {
  /** Tooltip body (shown on hover / focus). */
  tip: string;
  variant?: "help" | "warn";
  className?: string;
};

export function UiInfoTip({ tip, variant = "help", className = "" }: Props) {
  const icon = variant === "warn" ? "!" : "?";
  const color =
    variant === "warn"
      ? "border-amber-500/60 text-amber-700 dark:text-amber-300"
      : "border-stone-400 text-stone-500 dark:border-stone-500 dark:text-stone-400";

  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        aria-label={tip.slice(0, 120)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold leading-none ${color}`}
      >
        {icon}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-1/2 top-full z-50 mt-1.5 w-64 -translate-x-1/2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs font-normal leading-snug text-stone-700 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200"
      >
        {tip}
      </span>
    </span>
  );
}

export function UiSectionTitle({
  title,
  tip,
  warnTip,
}: {
  title: string;
  tip?: string;
  warnTip?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{title}</span>
      {tip ? <UiInfoTip tip={tip} variant="help" /> : null}
      {warnTip ? <UiInfoTip tip={warnTip} variant="warn" /> : null}
    </span>
  );
}
