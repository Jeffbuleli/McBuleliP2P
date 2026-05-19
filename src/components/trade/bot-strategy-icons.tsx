"use client";

import type { BotPlanId } from "@/lib/bot-config";

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
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
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

const TAB_ACTIVE: Record<BotPlanId, string> = {
  dca_spot: "bg-[color:var(--fd-primary)] text-white",
  grid_spot: "bg-violet-600 text-white",
  futures_um: "bg-amber-700 text-white",
};

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
    <div className="fd-card flex gap-1 p-1">
      {ids.map((id) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition ${
              on
                ? TAB_ACTIVE[id]
                : "text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]/50"
            }`}
          >
            <BotPlanIcon planId={id} className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">{labels[id]}</span>
          </button>
        );
      })}
    </div>
  );
}
