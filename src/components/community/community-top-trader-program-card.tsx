"use client";

import Link from "next/link";
import type { TopTraderProgramInfo } from "@/lib/community/top-trader-competition";
import type { TopTraderParticipantStatus } from "@/lib/community/top-trader-participant-service";
import { CommunityPoweredByStrip } from "@/components/community/community-powered-by-strip";
import { TopTraderHeroIllustration } from "@/components/community/community-top-trader-illustrations";
import { TOP_TRADER_DAILY_TRADES } from "@/lib/community/top-trader-competition";

function formatCountdown(ms: number, fr: boolean): string {
  if (ms <= 0) return fr ? "Terminé" : "Ended";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatEndDate(iso: string, fr: boolean): string {
  const d = new Date(iso);
  return d.toLocaleDateString(fr ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function TradeQuotaDots({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < remaining ? "bg-[#305f33]" : "bg-[#dce8e0]"
          }`}
        />
      ))}
    </div>
  );
}

export function CommunityTopTraderProgramCard({
  fr,
  program,
  participant,
  optInBusy,
  onOptIn,
}: {
  fr: boolean;
  program: TopTraderProgramInfo;
  participant: TopTraderParticipantStatus | null;
  optInBusy?: boolean;
  onOptIn?: () => void;
}) {
  const weekPct =
    program.msUntilWeekEnd > 0
      ? Math.min(
          100,
          Math.max(
            4,
            100 -
              (program.msUntilWeekEnd /
                (new Date(program.weekEndAt).getTime() -
                  new Date(program.weekStartAt).getTime())) *
                100,
          ),
        )
      : 100;

  const rules = [
    { val: "10K", lbl: fr ? "USDT démo" : "Demo USDT" },
    { val: "5", lbl: fr ? "/ jour" : "/ day" },
    { val: "24h", lbl: fr ? "max pos." : "max pos." },
    { val: `${program.prizeUsdt}`, lbl: "USDT" },
  ];

  const optedIn = participant?.optedIn ?? false;
  const canOptIn = program.status === "active" && !optedIn;

  return (
    <article className="fd-card overflow-hidden">
      <div className="relative bg-gradient-to-br from-[#eaf5ee] via-white to-[#f5f5f4] px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <TopTraderHeroIllustration className="h-[4.5rem] w-[4.5rem] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#0c0a09]">Top Trader</h2>
              {program.status === "active" ? (
                <span className="rounded-full bg-[#305f33] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  Live
                </span>
              ) : program.status === "ended" ? (
                <span className="rounded-full bg-[#e7e5e4] px-2 py-0.5 text-[9px] font-bold uppercase text-[#57534e]">
                  {fr ? "Fin" : "End"}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-[#305f33]">
              {program.weekLabel} · {fr ? "DEMO Futures" : "Futures DEMO"}
            </p>
            <p className="mt-1 text-[10px] text-[#78716c]">
              {fr ? "Fin programme" : "Program ends"}{" "}
              <span className="font-bold text-[#57534e]">
                {formatEndDate(program.programEndAt, fr)} GMT
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {rules.map((r) => (
            <div
              key={r.lbl}
              className="rounded-xl border border-[#dce8e0] bg-white/80 px-1.5 py-2 text-center"
            >
              <p className="text-sm font-extrabold tabular-nums text-[#305f33]">{r.val}</p>
              <p className="text-[9px] font-medium text-[#78716c]">{r.lbl}</p>
            </div>
          ))}
        </div>

        {optedIn && participant ? (
          <div className="mt-3 rounded-xl border border-[#dce8e0] bg-white/90 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#57534e]">
                {fr ? "Trades restants" : "Trades left"}
              </p>
              <TradeQuotaDots
                remaining={participant.tradesRemainingToday}
                total={TOP_TRADER_DAILY_TRADES}
              />
            </div>
            <p className="mt-1 text-[10px] tabular-nums text-[#78716c]">
              {participant.tradesRemainingToday}/{TOP_TRADER_DAILY_TRADES}{" "}
              {fr ? "aujourd'hui GMT" : "today GMT"}
              {participant.refillUsed
                ? ` · ${fr ? "recharge utilisée" : "refill used"}`
                : ` · ${fr ? "1 recharge dispo" : "1 refill left"}`}
            </p>
          </div>
        ) : null}

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-[#57534e]">
              {fr ? "Semaine" : "Week"}
            </span>
            <span className="tabular-nums text-[#78716c]">
              {formatCountdown(program.msUntilWeekEnd, fr)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e8f3ee]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#305f33] to-[#3d8f5a] transition-all"
              style={{ width: `${weekPct}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {canOptIn ? (
            <button
              type="button"
              disabled={optInBusy}
              onClick={onOptIn}
              className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-[#305f33] to-[#3d8f5a] py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 active:scale-[0.98]"
            >
              {optInBusy ? "…" : fr ? "Rejoindre" : "Join"}
            </button>
          ) : optedIn ? (
            <Link
              href="/app/trade/futures?mode=demo"
              className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-[#305f33] to-[#3d8f5a] py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98]"
            >
              {fr ? "Trader" : "Trade"}
            </Link>
          ) : null}
        </div>
      </div>
      <CommunityPoweredByStrip compact />
    </article>
  );
}
