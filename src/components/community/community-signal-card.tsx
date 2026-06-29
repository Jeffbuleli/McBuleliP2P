"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { signalToBotHref } from "@/lib/community/signal-to-bot-link";
import type { TradingSignalView } from "@/lib/community/signals-service";

type Props = {
  signal: TradingSignalView;
  viewerUserId?: string | null;
  onClose?: (id: string, outcome: "win" | "loss" | "neutral") => void;
  closing?: boolean;
};

export function CommunitySignalCard({
  signal,
  viewerUserId,
  onClose,
  closing,
}: Props) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const isOwner = viewerUserId === signal.author.userId;
  const sideLabel =
    signal.side === "long"
      ? fr
        ? "Long"
        : "Long"
      : fr
        ? "Short"
        : "Short";
  const sideTone =
    signal.side === "long" ? "text-[#305f33]" : "text-[#b45309]";

  return (
    <article className="fd-card px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0c0a09]">
            {signal.symbol}{" "}
            <span className={sideTone}>{sideLabel}</span>
          </p>
          <p className="text-xs text-[#78716c]">
            @{signal.author.handle} ·{" "}
            {new Date(signal.publishedAt).toLocaleDateString(
              fr ? "fr-FR" : "en-US",
              { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
            )}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            signal.status === "open"
              ? "bg-[#e8f3ee] text-[#305f33]"
              : signal.outcome === "win"
                ? "bg-[#dcfce7] text-[#166534]"
                : signal.outcome === "loss"
                  ? "bg-[#fee2e2] text-[#991b1b]"
                  : "bg-[#f5f5f4] text-[#57534e]"
          }`}
        >
          {signal.status === "open"
            ? fr
              ? "Ouvert"
              : "Open"
            : signal.outcome === "win"
              ? fr
                ? "Gagnant"
                : "Win"
              : signal.outcome === "loss"
                ? fr
                  ? "Perdu"
                  : "Loss"
                : fr
                  ? "Neutre"
                  : "Neutral"}
        </span>
      </div>

      <p className="mt-2 text-sm text-[#44403c]">{signal.note}</p>

      {(signal.entryPrice || signal.targetPrice || signal.stopPrice) && (
        <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          {signal.entryPrice ? (
            <div className="rounded-lg bg-[#fafaf9] px-2 py-1.5">
              <dt className="text-[#78716c]">{fr ? "Entrée" : "Entry"}</dt>
              <dd className="font-semibold text-[#0c0a09]">{signal.entryPrice}</dd>
            </div>
          ) : null}
          {signal.targetPrice ? (
            <div className="rounded-lg bg-[#fafaf9] px-2 py-1.5">
              <dt className="text-[#78716c]">{fr ? "Cible" : "Target"}</dt>
              <dd className="font-semibold text-[#305f33]">{signal.targetPrice}</dd>
            </div>
          ) : null}
          {signal.stopPrice ? (
            <div className="rounded-lg bg-[#fafaf9] px-2 py-1.5">
              <dt className="text-[#78716c]">SL</dt>
              <dd className="font-semibold text-[#b45309]">{signal.stopPrice}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <p className="mt-2 text-[10px] text-[#a8a29e]">
        {fr
          ? "Signal éducatif - pas un conseil financier."
          : "Educational signal - not financial advice."}
      </p>

      <Link
        href={signalToBotHref({
          symbol: signal.symbol,
          side: signal.side,
          signalId: signal.id,
        })}
        className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#305f33] px-4 py-2.5 text-xs font-bold text-white transition active:scale-[0.98]"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
          <path
            d="M13 3L4 14h7l-1 7 9-12h-7l1-6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        {fr ? "Tester en démo bot" : "Try in demo bot"}
      </Link>

      {isOwner && signal.status === "open" && onClose ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={closing}
            className="rounded-lg bg-[#305f33] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            onClick={() => onClose(signal.id, "win")}
          >
            {fr ? "Clôturer gagnant" : "Close as win"}
          </button>
          <button
            type="button"
            disabled={closing}
            className="rounded-lg border border-[#d6d3d1] px-3 py-1.5 text-xs font-semibold text-[#57534e] disabled:opacity-50"
            onClick={() => onClose(signal.id, "loss")}
          >
            {fr ? "Clôturer perdu" : "Close as loss"}
          </button>
          <button
            type="button"
            disabled={closing}
            className="rounded-lg border border-[#d6d3d1] px-3 py-1.5 text-xs font-semibold text-[#57534e] disabled:opacity-50"
            onClick={() => onClose(signal.id, "neutral")}
          >
            {fr ? "Neutre" : "Neutral"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
