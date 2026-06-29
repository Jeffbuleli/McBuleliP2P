"use client";

import type { TopTraderProgramWeek } from "@/lib/community/top-trader-types";
import {
  CommunityListLimitControl,
  type ListLimit,
} from "@/components/community/community-list-limit-control";
import { COMMUNITY_CHIP, COMMUNITY_CHIP_ACTIVE } from "@/lib/community/community-ui";

export type TopTraderRankingSort = "rank" | "pnl_desc" | "pnl_asc" | "trades_desc";

const SORT_OPTIONS: { id: TopTraderRankingSort; labelFr: string; labelEn: string }[] = [
  { id: "rank", labelFr: "Rang", labelEn: "Rank" },
  { id: "pnl_desc", labelFr: "PnL ↓", labelEn: "PnL ↓" },
  { id: "pnl_asc", labelFr: "PnL ↑", labelEn: "PnL ↑" },
  { id: "trades_desc", labelFr: "Trades", labelEn: "Trades" },
];

export function CommunityTopTraderRankingToolbar({
  fr,
  weeks,
  selectedWeekStartAt,
  onWeekChange,
  sort,
  onSortChange,
  listLimit,
  onListLimitChange,
}: {
  fr: boolean;
  weeks: TopTraderProgramWeek[];
  selectedWeekStartAt: string;
  onWeekChange: (weekStartAt: string) => void;
  sort: TopTraderRankingSort;
  onSortChange: (sort: TopTraderRankingSort) => void;
  listLimit: ListLimit;
  onListLimitChange: (limit: ListLimit) => void;
}) {
  return (
    <div className="mb-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            {fr ? "Semaine" : "Week"}
          </span>
          <select
            value={selectedWeekStartAt}
            onChange={(e) => onWeekChange(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[rgba(8,12,20,0.9)] px-2.5 py-1.5 text-xs font-bold text-stone-100 outline-none focus:border-cyan-400/40"
          >
            {weeks.map((w) => (
              <option key={w.weekStartAt} value={w.weekStartAt}>
                {w.weekLabel}
                {w.isCurrent ? (fr ? " · en cours" : " · current") : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSortChange(opt.id)}
              className={sort === opt.id ? COMMUNITY_CHIP_ACTIVE : COMMUNITY_CHIP}
            >
              {fr ? opt.labelFr : opt.labelEn}
            </button>
          ))}
        </div>
        <CommunityListLimitControl
          value={listLimit}
          onChange={onListLimitChange}
          fr={fr}
        />
      </div>
    </div>
  );
}

export function sortTopTraderEntries<T extends {
  rank: number;
  weeklyPnlUsdt: number;
  tradeCount: number;
}>(entries: T[], sort: TopTraderRankingSort): T[] {
  const list = [...entries];
  switch (sort) {
    case "pnl_desc":
      return list.sort((a, b) => b.weeklyPnlUsdt - a.weeklyPnlUsdt);
    case "pnl_asc":
      return list.sort((a, b) => a.weeklyPnlUsdt - b.weeklyPnlUsdt);
    case "trades_desc":
      return list.sort((a, b) => b.tradeCount - a.tradeCount);
    default:
      return list.sort((a, b) => a.rank - b.rank);
  }
}
