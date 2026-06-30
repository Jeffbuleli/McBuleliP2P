"use client";

import type { TopTraderDailyLeader } from "@/lib/community/top-trader-types";
import { pnlToneClass } from "@/lib/community/top-trader-ui-helpers";

export function CommunityTopTraderDailyLeaders({
  fr,
  leaders,
  weekLeaderUserId,
}: {
  fr: boolean;
  leaders: TopTraderDailyLeader[];
  weekLeaderUserId?: string | null;
}) {
  return (
    <section className="fd-card overflow-hidden p-3">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#57534e]">
        {fr ? "Meilleur du jour (GMT)" : "Daily best (GMT)"}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {leaders.map((d) => {
          const hasWinner = Boolean(d.userId && d.tradeCount > 0);
          const isWeekBest = weekLeaderUserId && d.userId === weekLeaderUserId;
          return (
            <div
              key={d.dayKey}
              className={`min-w-[4.5rem] shrink-0 rounded-xl border px-2 py-2 text-center ${
                hasWinner
                  ? "border-[#bce4c9] bg-gradient-to-b from-[#f0faf4] to-white shadow-sm"
                  : "border-[#e7e5e4] bg-[#fafaf9]"
              } ${isWeekBest ? "ring-2 ring-[#305f33]/25" : ""}`}
            >
              <p className="text-[10px] font-extrabold uppercase text-[#57534e]">
                {d.weekdayLabel}
              </p>
              {hasWinner ? (
                <>
                  {d.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.avatarUrl}
                      alt=""
                      className="mx-auto mt-1 h-7 w-7 rounded-full object-cover ring-1 ring-white"
                    />
                  ) : (
                    <span className="mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f3ee] text-[10px] font-bold text-[#305f33]">
                      {d.displayName?.slice(0, 1).toUpperCase() ?? "?"}
                    </span>
                  )}
                  <p className="mt-1 truncate text-[9px] font-bold text-[#0c0a09]">
                    {d.displayName}
                  </p>
                  <p className={`text-[10px] font-extrabold tabular-nums ${pnlToneClass(d.dailyPnlUsdt)}`}>
                    {d.dailyPnlUsdt >= 0 ? "+" : ""}
                    {d.dailyPnlUsdt.toFixed(1)}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-[9px] text-[#a8a29e]">—</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
