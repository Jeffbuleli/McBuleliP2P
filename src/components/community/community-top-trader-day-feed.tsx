"use client";

import { memo } from "react";
import type { TopTraderDayGroup } from "@/lib/community/top-trader-ui-helpers";
import { CommunityTopTraderFeedTradeCard } from "@/components/community/community-top-trader-trade-card";
import { pnlToneClass } from "@/lib/community/top-trader-ui-helpers";

const DayDivider = memo(function DayDivider({
  heading,
  tradeCount,
  dayPnl,
}: {
  heading: string;
  tradeCount: number;
  dayPnl: number;
}) {
  return (
    <div className="relative my-3 flex items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 h-px bg-[#e7e5e4]" aria-hidden />
      <div className="relative flex items-center gap-2 rounded-full border border-[#dce8e0] bg-white px-3 py-1">
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="text-[#305f33]">
          <rect x="3" y="5" width="18" height="16" rx="2" fill="currentColor" opacity="0.12" />
          <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#57534e]">
          {heading}
        </span>
        <span className="text-[10px] tabular-nums text-[#a8a29e]">{tradeCount}</span>
        <span className={`text-[10px] font-bold tabular-nums ${pnlToneClass(dayPnl)}`}>
          {dayPnl >= 0 ? "+" : ""}
          {dayPnl.toFixed(1)}
        </span>
      </div>
    </div>
  );
});

export const CommunityTopTraderDayFeed = memo(function CommunityTopTraderDayFeed({
  fr,
  groups,
}: {
  fr: boolean;
  groups: TopTraderDayGroup[];
}) {
  if (!groups.length) return null;

  return (
    <div className="space-y-1">
      {groups.map((g) => (
        <section key={g.dayKey} className="[contain:layout]">
          <DayDivider
            heading={g.heading}
            tradeCount={g.trades.length}
            dayPnl={g.dayPnlTotal}
          />
          <ul className="space-y-2">
            {g.trades.map((t) => (
              <li key={t.id}>
                <CommunityTopTraderFeedTradeCard fr={fr} trade={t} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
});
