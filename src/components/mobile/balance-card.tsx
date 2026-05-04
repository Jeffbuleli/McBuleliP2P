"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";

function formatHidden() {
  return "••••";
}

export function BalanceCard({
  locale,
  totalEquivDisplay,
  usdtDisplay,
  piDisplay,
  fiatUsdDisplay,
  fiatCdfDisplay,
}: {
  locale: Locale;
  /** Estimated portfolio in USDT (USDT + Pi valued via OKX PI-USDT when available). */
  totalEquivDisplay: string;
  usdtDisplay: string;
  piDisplay: string;
  fiatUsdDisplay: string;
  fiatCdfDisplay: string;
}) {
  const d = getDictionary(locale);
  const [hidden, setHidden] = useState(false);

  return (
    <section
      className="rounded-2xl border border-emerald-800/10 bg-gradient-to-b from-white to-emerald-50/80 p-3.5 shadow-md shadow-emerald-900/5 dark:border-white/10 dark:from-stone-900 dark:to-stone-900/90"
      aria-label={d.balance_estimated_total}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {d.balance_estimated_total}
        </p>
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          className="min-h-[40px] min-w-[40px] rounded-lg px-2 text-stone-500 transition active:scale-95 dark:text-stone-400"
          aria-pressed={hidden}
          aria-label={hidden ? d.show_balance : d.hide_balance}
        >
          {hidden ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
      <p className="mt-1 text-center text-2xl font-bold tabular-nums leading-tight tracking-tight text-emerald-950 dark:text-emerald-100">
        {hidden ? formatHidden() : totalEquivDisplay}
      </p>
      <p className="mt-0.5 text-center text-[10px] text-stone-500 dark:text-stone-400">
        {d.balance_equiv_usdt_note}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-900/10 pt-3 dark:border-white/10">
        <div className="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-stone-800/80">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            USDT
          </p>
          <p className="truncate text-xs font-semibold tabular-nums text-stone-900 dark:text-stone-100">
            {hidden ? formatHidden() : usdtDisplay}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-stone-800/80">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Pi
          </p>
          <p className="truncate text-xs font-semibold tabular-nums text-stone-900 dark:text-stone-100">
            {hidden ? formatHidden() : piDisplay}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-stone-800/80">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            USD
          </p>
          <p className="truncate text-xs font-semibold tabular-nums text-stone-900 dark:text-stone-100">
            {hidden ? formatHidden() : fiatUsdDisplay}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-stone-800/80">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            CDF
          </p>
          <p className="truncate text-xs font-semibold tabular-nums text-stone-900 dark:text-stone-100">
            {hidden ? formatHidden() : fiatCdfDisplay}
          </p>
        </div>
      </div>
    </section>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.5a2 2 0 102.5 2.5M6.4 6.4C4.6 7.8 3.3 9.6 2.5 12c1.5 4.5 5.7 8 9.5 8 1.2 0 2.3-.3 3.4-.8M9.9 5.1A9.2 9.2 0 0112.5 5c3.8 0 8 3.5 9.5 8a9.3 9.3 0 01-1.1 2.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12c1.5 4.5 5.7 8 9.5 8s8-3.5 9.5-8c-1.5-4.5-5.7-8-9.5-8s-8 3.5-9.5 8z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
