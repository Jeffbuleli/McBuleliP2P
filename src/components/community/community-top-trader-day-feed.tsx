"use client";

import type { TopTraderDayGroup } from "@/lib/community/top-trader-ui-helpers";
import { CommunityTopTraderFeedTradeCard } from "@/components/community/community-top-trader-trade-card";
import { pnlToneClass } from "@/lib/community/top-trader-ui-helpers";

function DayDivider({
  heading,
  tradeCount,
  dayPnl,
  fr,
}: {
  heading: string;
  tradeCount: number;
  dayPnl: number;
  fr: boolean;
}) {
  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 h-px bg-[#e7e5e4]" aria-hidden />
      <div className="relative flex items-center gap-2 rounded-full border border-[#dce8e0] bg-white px-3 py-1 shadow-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#57534e]">
          {heading}
        </span>
        <span className="text-[10px] text-[#a8a29e]">
          {tradeCount} {fr ? "trades" : "trades"}
        </span>
        <span className={`text-[10px] font-bold tabular-nums ${pnlToneClass(dayPnl)}`}>
          {dayPnl >= 0 ? "+" : ""}
          {dayPnl.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function CommunityTopTraderDayFeed({
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
        <section key={g.dayKey}>
          <DayDivider
            heading={g.heading}
            tradeCount={g.trades.length}
            dayPnl={g.dayPnlTotal}
            fr={fr}
          />
          <ul className="space-y-2.5">
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
}
