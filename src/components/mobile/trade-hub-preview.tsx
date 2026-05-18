import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

/** Compact dashboard card — links to Trade hub; live tickers are shown below in MarketPreview. */
export function TradeHubPreview({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);

  return (
    <section className="fd-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--fd-mint-deep)] to-[color:var(--fd-mint)] text-lg"
            aria-hidden
          >
            📈
          </span>
          <div>
            <h2 className="fd-section-title">Trade</h2>
            <p className="mt-0.5 fd-section-muted">{d.trade_preview_intro}</p>
          </div>
        </div>
        <Link
          href="/app/trade"
          className="shrink-0 text-xs font-semibold text-[color:var(--fd-primary)]"
        >
          {d.trade_view_hub} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/app/trade/futures"
          className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-[color:var(--fd-primary)]/20 bg-[color:var(--fd-mint)] px-3 py-3 text-center transition active:scale-[0.98] hover:bg-[color:var(--fd-mint-deep)]"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
            Futures
          </span>
          <span className="mt-0.5 text-[10px] leading-tight text-[color:var(--fd-muted)]">
            {d.trade_card_futures_hint}
          </span>
        </Link>
        <Link
          href="/app/trade/options"
          className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-center transition active:scale-[0.98] hover:bg-amber-100/80"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Options
          </span>
          <span className="mt-0.5 text-[10px] leading-tight text-amber-700/90">
            {d.trade_card_options_hint}
          </span>
        </Link>
      </div>
    </section>
  );
}
