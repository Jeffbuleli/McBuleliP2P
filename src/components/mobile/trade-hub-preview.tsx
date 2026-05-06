import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

/** Compact dashboard card — links to Trade hub; live tickers are shown below in MarketPreview. */
export function TradeHubPreview({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);

  return (
    <section className="rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-stone-50">Trade</h2>
          <p className="mt-1 text-xs leading-snug text-stone-400">
            {d.trade_preview_intro}
          </p>
        </div>
        <Link
          href="/app/trade"
          className="shrink-0 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
        >
          {d.trade_view_hub} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/app/trade/futures"
          className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-emerald-700/30 bg-emerald-950/40 px-3 py-3 text-center shadow-sm transition active:scale-[0.98] hover:bg-emerald-950/55"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-emerald-100">
            Futures
          </span>
          <span className="mt-0.5 text-[10px] leading-tight text-emerald-200/90">
            {d.trade_card_futures_hint}
          </span>
        </Link>
        <Link
          href="/app/trade/options"
          className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-amber-700/30 bg-amber-950/35 px-3 py-3 text-center shadow-sm transition active:scale-[0.98] hover:bg-amber-950/45"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-amber-100">
            Options
          </span>
          <span className="mt-0.5 text-[10px] leading-tight text-amber-200/90">
            {d.trade_card_options_hint}
          </span>
        </Link>
      </div>
    </section>
  );
}
