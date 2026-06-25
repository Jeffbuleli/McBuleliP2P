"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { FuturesScreenMock } from "@/components/mobile/futures-screen-mock";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";
import { TradeFlowCard } from "@/components/trade/trade-flow-ui";

export function FuturesGuideClient({ locale }: { locale: Locale }) {
  const { t } = useI18n();
  const d = getDictionary(locale);

  const deepSections = [
    { title: d.trade_futures_deep_margin_title, body: d.trade_futures_deep_margin_body },
    { title: d.trade_futures_deep_leverage_title, body: d.trade_futures_deep_leverage_body },
    { title: d.trade_futures_deep_ticket_title, body: d.trade_futures_deep_ticket_body },
    { title: d.trade_futures_deep_book_title, body: d.trade_futures_deep_book_body },
    { title: d.trade_futures_guide_custodial_title, body: d.trade_futures_guide_custodial_body },
    { title: d.trade_futures_guide_house_title, body: d.trade_futures_guide_house_body },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-16 pt-1">
      <Link
        href="/app/market?panel=futures"
        className="inline-flex text-sm font-bold text-[color:var(--fd-primary)]"
      >
        ← {t("trade_ui_tab_futures")}
      </Link>

      <header className="space-y-2">
        <span className="inline-flex rounded-full bg-[color:var(--fd-mint)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-primary)]">
          {t("trade_futures_guide_badge")}
        </span>
        <h1 className="text-2xl font-black tracking-tight text-[color:var(--fd-text)]">
          {t("trade_ui_learn_futures")}
        </h1>
        <p className="text-sm text-[color:var(--fd-muted)]">{d.trade_futures_guide_subtitle}</p>
      </header>

      <TradeFlowCard className="space-y-3 !p-4">
        <h2 className="text-sm font-extrabold text-[color:var(--fd-text)]">
          {d.trade_futures_guide_modes_title}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-[color:var(--fd-mint)] p-3">
            <p className="text-[10px] font-bold uppercase text-[color:var(--fd-primary)]">
              {t("trade_mode_demo")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--fd-text)]">
              {d.trade_futures_guide_demo_body}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--fd-live)]/30 bg-[color:var(--fd-sell-mint)] p-3">
            <p className="text-[10px] font-bold uppercase text-[color:var(--fd-live)]">
              {t("trade_mode_live")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--fd-text)]">
              {d.trade_futures_guide_live_body}
            </p>
          </div>
        </div>
      </TradeFlowCard>

      <section className="space-y-3 text-sm leading-relaxed text-[color:var(--fd-text)]">
        <p>{d.trade_futures_p1}</p>
        <p>{d.trade_futures_p2}</p>
        <p>{d.trade_futures_p3}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-[color:var(--fd-text)]">
          {d.trade_futures_screen_title}
        </h2>
        <FuturesScreenMock d={d} />
        <p className="text-xs leading-relaxed text-[color:var(--fd-muted)]">
          {d.trade_futures_guide_screen_caption}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-[color:var(--fd-text)]">
          {d.trade_futures_deeper_title}
        </h2>
        <div className="space-y-3">
          {deepSections.map((block) => (
            <TradeFlowCard key={block.title} className="!p-4">
              <h3 className="text-sm font-extrabold text-[color:var(--fd-text)]">
                {block.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
                {block.body}
              </p>
            </TradeFlowCard>
          ))}
        </div>
      </section>

      <TradeFlowCard className="!border-[color:var(--fd-primary)]/25 !bg-[color:var(--fd-mint)]/40 !p-4">
        <h2 className="text-sm font-extrabold text-[color:var(--fd-text)]">
          {d.trade_futures_guide_community_title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
          {d.trade_futures_guide_community_body}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/app/community/traders"
            className="rounded-xl bg-[color:var(--fd-primary)] px-3 py-2 text-xs font-extrabold text-white"
          >
            {d.trade_futures_guide_community_cta_ranking}
          </Link>
          <Link
            href="/app/community"
            className="rounded-xl border-2 border-[color:var(--fd-border)] bg-white px-3 py-2 text-xs font-extrabold text-[color:var(--fd-text)]"
          >
            {d.trade_futures_guide_community_cta_feed}
          </Link>
        </div>
      </TradeFlowCard>

      <p className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-xs font-semibold leading-relaxed text-rose-900">
        {d.trade_futures_risk}
      </p>
      <p className="text-center text-[11px] text-[color:var(--fd-muted)]">
        {d.trade_futures_guide_footer}
      </p>
    </div>
  );
}
