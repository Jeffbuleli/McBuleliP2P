"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TopTraderWeekHistoryEntry } from "@/lib/community/top-trader-types";
import { COMMUNITY_CARD, COMMUNITY_CARD_ACCENT } from "@/lib/community/community-ui";

const PREVIEW_COUNT = 3;

export function CommunityTopTraderWeekHistory({
  fr,
  entries,
  selectedWeekStartAt,
  onSelectWeek,
}: {
  fr: boolean;
  entries: TopTraderWeekHistoryEntry[];
  selectedWeekStartAt: string | null;
  onSelectWeek: (weekStartAt: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.weekStartAt.localeCompare(a.weekStartAt)),
    [entries],
  );

  if (!sorted.length) return null;

  const visible = expanded ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hiddenCount = Math.max(0, sorted.length - PREVIEW_COUNT);

  return (
    <section className={`${COMMUNITY_CARD} px-4 py-3`}>
      <span className={COMMUNITY_CARD_ACCENT} aria-hidden />
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-stone-300">
          {fr ? "Historique des semaines" : "Week history"}
        </h3>
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-bold text-cyan-400 hover:underline"
          >
            {expanded
              ? fr
                ? "Réduire"
                : "Collapse"
              : fr
                ? `+${hiddenCount} sem.`
                : `+${hiddenCount} wks`}
          </button>
        ) : null}
      </div>

      <ul className="space-y-1.5">
        {visible.map((entry) => {
          const active = selectedWeekStartAt === entry.weekStartAt;
          const profileHref = entry.handle
            ? `/app/community/u/${entry.handle}`
            : null;
          const winnerLabel =
            entry.displayName ??
            (entry.status === "paid"
              ? fr
                ? "Gagnant"
                : "Winner"
              : fr
                ? "Aucun gagnant"
                : "No winner");

          return (
            <li key={entry.weekStartAt}>
              <button
                type="button"
                onClick={() => onSelectWeek(entry.weekStartAt)}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <span className="w-8 shrink-0 text-center text-xs font-extrabold tabular-nums text-cyan-300">
                  {entry.weekLabel}
                </span>
                <div className="min-w-0 flex-1">
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      onClick={(e) => e.stopPropagation()}
                      className="truncate text-sm font-bold text-stone-100 hover:underline"
                    >
                      {winnerLabel}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-bold text-stone-300">{winnerLabel}</p>
                  )}
                  <p className="text-[10px] text-stone-500">
                    {entry.weeklyPnlUsdt != null ? (
                      <>
                        PnL{" "}
                        <span className="font-semibold tabular-nums text-emerald-400">
                          {entry.weeklyPnlUsdt >= 0 ? "+" : ""}
                          {entry.weeklyPnlUsdt.toFixed(2)}
                        </span>
                        {" · "}
                      </>
                    ) : null}
                    {entry.tradeCount} {fr ? "trades" : "trades"}
                    {entry.status === "paid" ? (
                      <>
                        {" · "}
                        <span className="font-semibold text-amber-400/90">
                          +{entry.prizeUsdt} USDT
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
