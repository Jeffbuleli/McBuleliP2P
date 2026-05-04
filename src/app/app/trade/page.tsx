import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function TradeHubPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10 pt-1">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
        Trade
      </h1>

      <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-900/50">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {d.trade_how_title}
        </h2>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <p>{d.trade_hub_p1}</p>
          <p>{d.trade_hub_p2}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400">{d.trade_hub_risk}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/app/trade/futures"
          className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-emerald-800/25 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm ring-1 ring-emerald-900/10 transition active:scale-[0.99] dark:border-emerald-700/35 dark:from-emerald-950/60 dark:to-stone-900 dark:ring-emerald-500/10"
        >
          <span className="text-lg font-bold text-emerald-950 dark:text-emerald-100">Futures</span>
          <span className="text-xs leading-snug text-emerald-900/85 dark:text-emerald-200/90">
            {d.trade_card_futures_hint}
          </span>
          <span className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {d.trade_open_detail} →
          </span>
        </Link>
        <Link
          href="/app/trade/options"
          className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-amber-800/25 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm ring-1 ring-amber-900/10 transition active:scale-[0.99] dark:border-amber-700/35 dark:from-amber-950/50 dark:to-stone-900 dark:ring-amber-500/10"
        >
          <span className="text-lg font-bold text-amber-950 dark:text-amber-100">Options</span>
          <span className="text-xs leading-snug text-amber-950/90 dark:text-amber-100/90">
            {d.trade_card_options_hint}
          </span>
          <span className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
            {d.trade_open_detail} →
          </span>
        </Link>
      </div>

      <p className="text-center text-[11px] text-stone-500 dark:text-stone-400">{d.trade_execution_note}</p>
    </div>
  );
}
