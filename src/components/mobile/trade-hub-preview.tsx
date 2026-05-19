import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

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
          href="/app/trade/bots"
          className="shrink-0 text-xs font-semibold text-[color:var(--fd-primary)]"
        >
          {d.trade_view_hub} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/app/trade/bots"
          className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-[color:var(--fd-primary)]/20 bg-[color:var(--fd-mint)] px-3 py-3 text-center transition active:scale-[0.98] hover:bg-[color:var(--fd-mint-deep)]"
        >
          <span className="text-lg" aria-hidden>
            🤖
          </span>
          <span className="text-xs font-bold text-[color:var(--fd-primary)]">
            {d.trade_ui_tab_bots}
          </span>
        </Link>
        <Link
          href="/app/trade/futures"
          className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-3 text-center transition active:scale-[0.98] hover:bg-[color:var(--fd-mint)]"
        >
          <span className="text-lg" aria-hidden>
            📈
          </span>
          <span className="text-xs font-bold text-[color:var(--fd-text)]">
            {d.trade_ui_tab_futures}
          </span>
        </Link>
      </div>
    </section>
  );
}
