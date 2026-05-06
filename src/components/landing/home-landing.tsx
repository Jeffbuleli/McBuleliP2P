import Link from "next/link";
import type { ComponentType } from "react";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";
import { MarketPreview } from "@/components/mobile/market-preview";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import {
  IconArrow,
  IconChartLine,
  IconCheck,
  IconCoins,
  IconLock,
  IconP2P,
  IconShield,
  IconSmartphone,
  IconUsers,
  IconWallet,
  IconZap,
} from "@/components/landing/landing-icons";

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4 shadow-md shadow-black/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-stone-50">{title}</h3>
      <p className="text-sm leading-relaxed text-stone-400">{body}</p>
    </div>
  );
}

function StatTile({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-stone-700/45 bg-stone-900/50 px-3 py-3 backdrop-blur-sm">
      <p className="text-lg font-bold leading-none text-emerald-400">{title}</p>
      <p className="text-[11px] leading-snug text-stone-500">{subtitle}</p>
    </div>
  );
}

function PreviewTile({
  icon: Icon,
  title,
  body,
  href,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-700/45 bg-stone-950/35 p-4 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-snug text-stone-50">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-400">{body}</p>
          </div>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-stone-700/70 bg-stone-950/40 px-4 text-sm font-semibold text-stone-100 transition hover:border-emerald-700/45 hover:bg-stone-900/60 active:scale-[0.99]"
      >
        {cta}
      </Link>
    </div>
  );
}

export async function HomeLanding() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const tickers = await fetchMarketTickers();

  const steps: { label: string; n: number }[] = [
    { n: 1, label: d.landing_step_1 },
    { n: 2, label: d.landing_step_2 },
    { n: 3, label: d.landing_step_3 },
    { n: 4, label: d.landing_step_4 },
  ];

  return (
    <div className="min-h-full">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />

      <LandingTopBar />

      <div className="relative mx-auto max-w-lg px-3 pb-10 pt-1 sm:max-w-2xl lg:max-w-5xl">
        <div className="overflow-hidden rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/95">
            {d.landing_presentation_eyebrow}
          </p>
          <h1 className="mt-3 text-balance text-2xl font-bold leading-[1.15] tracking-tight text-stone-50">
            {d.landing_presentation_title}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-stone-400">
            {d.landing_presentation_body}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 text-base font-semibold text-white shadow-lg shadow-emerald-900/35 transition active:scale-[0.99]"
            >
              {d.landing_cta_primary}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-stone-600 bg-stone-900/50 px-5 text-base font-semibold text-stone-100 backdrop-blur-sm transition active:scale-[0.99] hover:border-stone-500"
            >
              {d.landing_cta_login}
            </Link>
            <Link
              href="/#market"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-stone-600/80 bg-stone-900/30 px-5 text-base font-semibold text-stone-200 transition active:scale-[0.99] hover:border-stone-500 hover:bg-stone-900/50"
            >
              {d.landing_cta_market}
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile title={d.landing_stat_1_t} subtitle={d.landing_stat_1_d} />
          <StatTile title={d.landing_stat_2_t} subtitle={d.landing_stat_2_d} />
          <StatTile title={d.landing_stat_3_t} subtitle={d.landing_stat_3_d} />
        </div>

        <div className="mt-6 space-y-6">
          <PriceChartLazy />
          <section id="market" className="scroll-mt-28">
            <MarketPreview locale={locale} initialTickers={tickers} />
          </section>
        </div>
      </div>

      <main className="relative mx-auto max-w-4xl space-y-16 px-4 pb-20">
        <section id="preview" className="scroll-mt-28" aria-labelledby="preview-h">
          <h2 id="preview-h" className="text-center text-xl font-bold text-stone-50 sm:text-2xl">
            {d.landing_preview_heading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-stone-400">
            {d.landing_preview_sub}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <PreviewTile
              icon={IconWallet}
              title={d.landing_preview_wallet_t}
              body={d.landing_preview_wallet_d}
              href="/register"
              cta={d.landing_preview_cta}
            />
            <PreviewTile
              icon={IconP2P}
              title={d.landing_preview_p2p_t}
              body={d.landing_preview_p2p_d}
              href="/register"
              cta={d.landing_preview_cta}
            />
            <PreviewTile
              icon={IconChartLine}
              title={d.landing_preview_trade_t}
              body={d.landing_preview_trade_d}
              href="/register"
              cta={d.landing_preview_cta}
            />
            <PreviewTile
              icon={IconUsers}
              title={d.landing_preview_groups_t}
              body={d.landing_preview_groups_d}
              href="/register"
              cta={d.landing_preview_cta}
            />
            <PreviewTile
              icon={IconCoins}
              title={d.landing_preview_pool_t}
              body={d.landing_preview_pool_d}
              href="/register"
              cta={d.landing_preview_cta}
            />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-stone-500">
            {d.landing_preview_hint}
          </p>
        </section>

        <section id="features" aria-labelledby="features-h">
          <h2
            id="features-h"
            className="text-center text-xl font-bold text-stone-50 sm:text-2xl"
          >
            {d.landing_features_heading}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={IconP2P}
              title={d.landing_feature_p2p_t}
              body={d.landing_feature_p2p_d}
            />
            <FeatureCard
              icon={IconSmartphone}
              title={d.landing_feature_mm_t}
              body={d.landing_feature_mm_d}
            />
            <FeatureCard
              icon={IconShield}
              title={d.landing_feature_escrow_t}
              body={d.landing_feature_escrow_d}
            />
            <FeatureCard
              icon={IconZap}
              title={d.landing_feature_fast_t}
              body={d.landing_feature_fast_d}
            />
          </div>
        </section>

        <section id="how" aria-labelledby="how-h">
          <h2
            id="how-h"
            className="text-center text-xl font-bold text-stone-50 sm:text-2xl"
          >
            {d.landing_how_heading}
          </h2>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="flex items-center gap-3 sm:flex-1 sm:min-w-[140px] sm:flex-col sm:text-center"
              >
                <div className="flex items-center gap-2 sm:flex-col">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-400">
                    {s.n}
                  </span>
                  {i < steps.length - 1 ? (
                    <IconArrow className="hidden h-5 w-5 text-stone-600 sm:block" />
                  ) : null}
                </div>
                <p className="text-sm font-medium leading-snug text-stone-300">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border border-emerald-900/30 bg-gradient-to-br from-stone-900/80 to-stone-950 p-6 sm:p-8"
          aria-labelledby="trust-h"
        >
          <h2 id="trust-h" className="text-lg font-bold text-stone-50">
            {d.landing_trust_heading}
          </h2>
          <ul className="mt-5 space-y-4">
            <li className="flex gap-3 text-sm text-stone-300">
              <IconShield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500/90" />
              {d.landing_trust_1}
            </li>
            <li className="flex gap-3 text-sm text-stone-300">
              <IconLock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500/90" />
              {d.landing_trust_2}
            </li>
            <li className="flex gap-3 text-sm text-stone-300">
              <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500/90" />
              {d.landing_trust_3}
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-stone-800 bg-stone-950/90 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-semibold text-stone-300">
            {d.landing_footer_tagline}
          </p>
          <p className="mx-auto mt-4 max-w-md text-center text-xs leading-relaxed text-stone-500">
            {d.landing_inspired_note}
          </p>
          <nav
            className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-emerald-400/90"
            aria-label="Footer"
          >
            <Link href="/about" className="hover:underline">
              {d.landing_footer_about}
            </Link>
            <Link href="/contact" className="hover:underline">
              {d.landing_footer_contact}
            </Link>
            <Link href="/terms" className="hover:underline">
              {d.landing_footer_terms}
            </Link>
            <Link href="/privacy" className="hover:underline">
              {d.landing_footer_privacy}
            </Link>
          </nav>
          <p className="mt-8 text-center text-xs text-stone-600">
            © {new Date().getFullYear()} {d.brand}
          </p>
        </div>
      </footer>
    </div>
  );
}
