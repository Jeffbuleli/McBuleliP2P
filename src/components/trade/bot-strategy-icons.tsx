"use client";

import type { BotPlanId } from "@/lib/bot-config";

export type BotTabRunState = "running" | "paused" | "idle";

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

const TAB_ORDER: BotPlanId[] = ["futures_um", "grid_spot", "dca_spot"];

const TILE_CLASS: Record<BotPlanId, string> = {
  futures_um: "bot-strategy-tile--futures",
  grid_spot: "bot-strategy-tile--grid",
  dca_spot: "bot-strategy-tile--dca",
};

export function BotStrategyTabBar({
  active,
  onSelect,
  labels,
  runState,
  categoryTitle = "Bots",
}: {
  active: BotPlanId;
  onSelect: (id: BotPlanId) => void;
  labels: Record<BotPlanId, string>;
  runState?: Partial<Record<BotPlanId, BotTabRunState>>;
  categoryTitle?: string;
}) {
  return (
    <section className="bot-category">
      <div className="bot-category__head">
        <span className="bot-category__icon" aria-hidden>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L4 14h7l-1 8 9-14h-7l1-6z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>{categoryTitle}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TAB_ORDER.map((id) => {
          const on = active === id;
          const state = runState?.[id] ?? "idle";
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={on}
              className={`bot-strategy-tile ${TILE_CLASS[id]} ${
                on ? "bot-strategy-tile--active" : ""
              }`}
            >
              <span className="bot-strategy-tile__icon">
                <BotPlanIcon planId={id} className="h-6 w-6" />
              </span>
              <span className="bot-strategy-tile__label">{labels[id]}</span>
              {state !== "idle" ? (
                <span
                  className={`bot-strategy-tile__dot ${
                    state === "paused" ? "bot-strategy-tile__dot--paused" : ""
                  } ${state === "running" ? "bot-strategy-tile__dot--running" : ""}`}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
