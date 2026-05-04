import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function TradeOptionsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10 pt-1">
      <Link
        href="/app/trade"
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
      >
        ← Trade
      </Link>

      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Options</h1>

      <section className="space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <p>{d.trade_options_p1}</p>
        <p>{d.trade_options_p2}</p>
        <p>{d.trade_options_p3}</p>
        <p className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          {d.trade_options_risk}
        </p>
        <p className="text-xs text-stone-600 dark:text-stone-400">{d.trade_execution_note}</p>
      </section>
    </div>
  );
}
