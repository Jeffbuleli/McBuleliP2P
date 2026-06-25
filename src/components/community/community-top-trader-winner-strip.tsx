"use client";

import Link from "next/link";
import type { TopTraderWeekWinnerView } from "@/lib/community/top-trader-payout-service";
import { TopTraderMedalSvg } from "@/components/community/community-top-trader-illustrations";

export function CommunityTopTraderWinnerStrip({
  fr,
  winner,
}: {
  fr: boolean;
  winner: TopTraderWeekWinnerView;
}) {
  const profileHref = winner.handle
    ? `/app/community/u/${winner.handle}`
    : "/app/community/traders?tab=top_trader";

  return (
    <Link
      href={profileHref}
      className="fd-card flex items-center gap-3 px-4 py-3 transition active:scale-[0.99]"
    >
      <TopTraderMedalSvg rank={1} className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a8a29e]">
          {fr ? "Dernier gagnant" : "Last winner"} · {winner.weekLabel}
        </p>
        <p className="truncate text-sm font-extrabold text-[#0c0a09]">
          {winner.displayName}
        </p>
        <p className="text-[10px] text-[#78716c]">
          <span className="font-bold text-[#305f33]">+{winner.prizeUsdt} USDT</span>
          {" · "}
          PnL{" "}
          <span className="tabular-nums font-semibold">
            {winner.weeklyPnlUsdt >= 0 ? "+" : ""}
            {winner.weeklyPnlUsdt.toFixed(2)}
          </span>
        </p>
      </div>
      {winner.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={winner.avatarUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#fef3c7]"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fef3c7] text-sm font-extrabold text-[#92400e]">
          {winner.displayName.slice(0, 1).toUpperCase()}
        </span>
      )}
    </Link>
  );
}
