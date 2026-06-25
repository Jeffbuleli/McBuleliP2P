import type { ReactNode } from "react";
import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";
import { TradeIconBadge, TradeIconBots, TradeIconFutures } from "@/components/trade/trade-icons";

export function TradeHubPreview({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);

  const tile = (href: string, label: string, icon: ReactNode, accent: boolean) => (
    <Link
      href={href}
      className={`flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-center transition active:scale-[0.98] ${
        accent
          ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-mint)]"
          : "border-[color:var(--fd-border)] bg-white hover:bg-[color:var(--fd-mint)]/50"
      }`}
    >
      <TradeIconBadge tone={accent ? "primary" : "mint"} size="lg">
        <span className={accent ? "text-white" : "text-[color:var(--fd-primary)]"}>{icon}</span>
      </TradeIconBadge>
      <span
        className={`text-xs font-extrabold ${accent ? "text-[color:var(--fd-primary)]" : "text-[color:var(--fd-text)]"}`}
      >
        {label}
      </span>
    </Link>
  );

  return (
    <section className="fd-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <TradeIconBadge tone="primary" size="lg">
            <TradeIconFutures className="h-5 w-5 text-white" />
          </TradeIconBadge>
          <div>
            <h2 className="fd-section-title">Trade</h2>
            <p className="mt-0.5 fd-section-muted">{d.trade_preview_intro}</p>
          </div>
        </div>
        <Link
          href="/app/market?panel=futures"
          className="shrink-0 text-xs font-extrabold text-[color:var(--fd-primary)]"
        >
          {d.trade_view_hub} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tile(
          "/app/market?panel=futures",
          d.trade_ui_tab_futures,
          <TradeIconFutures className="h-5 w-5" />,
          true,
        )}
        {tile(
          "/app/market?panel=bots",
          d.trade_ui_tab_bots,
          <TradeIconBots className="h-5 w-5" />,
          false,
        )}
      </div>
    </section>
  );
}
