import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function OptionsGuidePage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-12 pt-1">
      <Link
        href="/app/trade/options"
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
      >
        ← {d.trade_ui_tab_options}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
        {d.trade_ui_learn_options}
      </h1>

      <section className="space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <p>{d.trade_options_p1}</p>
        <p>{d.trade_options_p2}</p>
        <p>{d.trade_options_p3}</p>
        <p className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          {d.trade_options_risk}
        </p>
        <p className="text-xs text-stone-600 dark:text-stone-400">{d.trade_execution_note}</p>
      </section>

      <section className="rounded-2xl border border-violet-200/80 bg-violet-50/80 p-4 dark:border-violet-900/40 dark:bg-violet-950/25">
        <h2 className="text-sm font-bold text-violet-950 dark:text-violet-100">
          {d.trade_ui_options_vs_futures_title}
        </h2>
        <p className="mt-2 text-sm text-violet-950/95 dark:text-violet-100/90">
          {d.trade_ui_options_vs_futures_body}
        </p>
      </section>
    </div>
  );
}
