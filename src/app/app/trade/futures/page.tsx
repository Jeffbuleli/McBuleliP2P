import Link from "next/link";
import { FuturesScreenMock } from "@/components/mobile/futures-screen-mock";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function TradeFuturesPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  const deepSections = [
    {
      title: d.trade_futures_deep_margin_title,
      body: d.trade_futures_deep_margin_body,
    },
    {
      title: d.trade_futures_deep_leverage_title,
      body: d.trade_futures_deep_leverage_body,
    },
    {
      title: d.trade_futures_deep_ticket_title,
      body: d.trade_futures_deep_ticket_body,
    },
    {
      title: d.trade_futures_deep_book_title,
      body: d.trade_futures_deep_book_body,
    },
    {
      title: d.trade_futures_deep_funding_title,
      body: d.trade_futures_deep_funding_body,
    },
    {
      title: d.trade_futures_deep_bottom_title,
      body: d.trade_futures_deep_bottom_body,
    },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-12 pt-1">
      <Link
        href="/app/trade"
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
      >
        ← Trade
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Futures
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">{d.trade_futures_subtitle}</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <p>{d.trade_futures_p1}</p>
        <p>{d.trade_futures_p2}</p>
        <p>{d.trade_futures_p3}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-50">
          {d.trade_futures_screen_title}
        </h2>
        <FuturesScreenMock d={d} />
        <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {d.trade_futures_screen_caption}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-50">
          {d.trade_futures_deeper_title}
        </h2>
        <div className="space-y-5">
          {deepSections.map((block) => (
            <div
              key={block.title}
              className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80"
            >
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">{block.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                {block.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/25">
        <h2 className="text-base font-bold text-amber-950 dark:text-amber-100">
          {d.trade_futures_vs_options_title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/95 dark:text-amber-100/95">
          {d.trade_futures_vs_options_intro}
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-amber-950/95 dark:text-amber-100/90">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
            <span>{d.trade_futures_vs_options_futures}</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" aria-hidden />
            <span>{d.trade_futures_vs_options_options}</span>
          </li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-amber-900/85 dark:text-amber-200/80">
          {d.trade_futures_vs_options_note}
        </p>
      </section>

      <section className="space-y-3">
        <p className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          {d.trade_futures_risk}
        </p>
        <p className="text-xs text-stone-600 dark:text-stone-400">{d.trade_execution_note}</p>
      </section>

      <p className="text-center">
        <Link
          href="/app/trade/options"
          className="text-sm font-semibold text-violet-700 underline dark:text-violet-400"
        >
          {d.trade_futures_link_options} →
        </Link>
        <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
          {d.trade_futures_link_options_caption}
        </span>
      </p>
    </div>
  );
}
