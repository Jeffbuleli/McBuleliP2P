import type { BotPlanId } from "@/lib/bot-config";

const TAB_STYLES: Record<
  BotPlanId,
  { active: string; idle: string; accent: string }
> = {
  dca_spot: {
    active: "border-emerald-600 bg-emerald-600 text-white shadow-md",
    idle:
      "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-stone-900 dark:text-emerald-100 dark:hover:bg-emerald-950/40",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  grid_spot: {
    active: "border-violet-600 bg-violet-600 text-white shadow-md",
    idle:
      "border-violet-200 bg-white text-violet-900 hover:bg-violet-50 dark:border-violet-800 dark:bg-stone-900 dark:text-violet-100 dark:hover:bg-violet-950/40",
    accent: "text-violet-600 dark:text-violet-400",
  },
  futures_um: {
    active: "border-amber-600 bg-amber-600 text-white shadow-md",
    idle:
      "border-amber-200 bg-white text-amber-950 hover:bg-amber-50 dark:border-amber-800 dark:bg-stone-900 dark:text-amber-100 dark:hover:bg-amber-950/40",
    accent: "text-amber-600 dark:text-amber-400",
  },
};

export function BotPlanIcon({
  planId,
  className = "h-7 w-7",
}: {
  planId: BotPlanId;
  className?: string;
}) {
  if (planId === "dca_spot") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 18V6l8 4 8-4v12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 10v8" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (planId === "grid_spot") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L4 14h7l-1 8 9-14h-7l1-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BotStrategyTabBar({
  active,
  onSelect,
  labels,
}: {
  active: BotPlanId;
  onSelect: (id: BotPlanId) => void;
  labels: Record<BotPlanId, string>;
}) {
  const ids: BotPlanId[] = ["dca_spot", "grid_spot", "futures_um"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {ids.map((id) => {
        const on = active === id;
        const s = TAB_STYLES[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center transition ${
              on ? s.active : s.idle
            }`}
          >
            <BotPlanIcon planId={id} className="h-8 w-8" />
            <span className="text-xs font-bold leading-tight">{labels[id]}</span>
          </button>
        );
      })}
    </div>
  );
}

export { TAB_STYLES };
