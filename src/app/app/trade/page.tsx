import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function TradeHubPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-12 pt-1">
      <h1 className="text-center text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
        Trade
      </h1>

      <div className="grid grid-cols-1 gap-4">
        <Link
          href="/app/trade/futures"
          prefetch
          className="flex min-h-[140px] flex-col justify-center rounded-2xl border-2 border-emerald-700/30 bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-md ring-1 ring-emerald-900/10 transition active:scale-[0.99] dark:border-emerald-600/40 dark:from-emerald-950/70 dark:to-stone-900 dark:ring-emerald-500/10"
        >
          <span className="text-xl font-bold text-emerald-950 dark:text-emerald-100">
            {d.trade_ui_tab_futures}
          </span>
          <span className="mt-2 text-sm text-emerald-900/90 dark:text-emerald-200/90">
            {d.trade_card_futures_hint}
          </span>
        </Link>
        <Link
          href="/app/trade/options"
          prefetch
          className="flex min-h-[140px] flex-col justify-center rounded-2xl border-2 border-amber-700/30 bg-gradient-to-br from-amber-50 to-white p-6 text-center shadow-md ring-1 ring-amber-900/10 transition active:scale-[0.99] dark:border-amber-600/40 dark:from-amber-950/60 dark:to-stone-900 dark:ring-amber-500/10"
        >
          <span className="text-xl font-bold text-amber-950 dark:text-amber-100">
            {d.trade_ui_tab_options}
          </span>
          <span className="mt-2 text-sm text-amber-950/90 dark:text-amber-100/90">
            {d.trade_card_options_hint}
          </span>
        </Link>
      </div>

      <p className="text-center text-xs leading-relaxed text-stone-500 dark:text-stone-400">
        {d.trade_hub_disclaimer}
      </p>
    </div>
  );
}
