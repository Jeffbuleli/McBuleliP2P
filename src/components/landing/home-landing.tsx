import Link from "next/link";
import type { ComponentType } from "react";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";
import { MarketPreview } from "@/components/mobile/market-preview";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import {
  IconBell,
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
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-700/50 bg-gradient-to-b from-stone-900/50 to-stone-950/70 p-5 shadow-lg shadow-black/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
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

function PillarCard({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-emerald-900/25 bg-stone-950/50 p-4 ring-1 ring-emerald-500/10">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-stone-100">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">{body}</p>
      </div>
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
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-stone-700/45 bg-gradient-to-b from-stone-950/80 to-stone-950/40 p-5 shadow-xl shadow-black/30 backdrop-blur-sm">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/15">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug text-stone-50">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">{body}</p>
        </div>
      </div>
      <Link
        href={href}
        className="mt-auto inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600/90 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-950/40 transition hover:bg-emerald-500 active:scale-[0.99]"
      >
        {cta} →
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
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.14),transparent)]"
        aria-hidden
      />

      <LandingTopBar />

      <div className="relative mx-auto max-w-lg px-3 pb-6 pt-1 sm:max-w-2xl lg:max-w-5xl">
        <div className="overflow-hidden rounded-[1.75rem] border border-stone-700/50 bg-stone-950/70 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400/95">
            {d.landing_presentation_eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tight text-stone-50 sm:text-4xl">
            {d.landing_presentation_title}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-stone-400 sm:text-[1.05rem]">
            {d.landing_presentation_body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/register"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 text-base font-semibold text-white shadow-lg shadow-emerald-900/35 transition active:scale-[0.99] sm:min-w-[200px]"
            >
              {d.landing_cta_primary}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border border-stone-600 bg-stone-900/50 px-6 text-base font-semibold text-stone-100 backdrop-blur-sm transition active:scale-[0.99] hover:border-stone-500 sm:min-w-[160px]"
            >
              {d.landing_cta_login}
            </Link>
            <Link
              href="/#market"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border border-stone-600/80 bg-transparent px-6 text-base font-semibold text-stone-200 transition active:scale-[0.99] hover:border-emerald-700/50 hover:bg-stone-900/40 sm:min-w-[160px]"
            >
              {d.landing_cta_market}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile title={d.landing_stat_1_t} subtitle={d.landing_stat_1_d} />
          <StatTile title={d.landing_stat_2_t} subtitle={d.landing_stat_2_d} />
          <StatTile title={d.landing_stat_3_t} subtitle={d.landing_stat_3_d} />
        </div>

        <div className="mt-8 space-y-8">
          <PriceChartLazy />
          <section id="market" className="scroll-mt-28">
            <MarketPreview locale={locale} initialTickers={tickers} />
          </section>
        </div>
      </div>

      {/* Transition + “McBuleli today” band — after live crypto list */}
      <div className="relative mx-auto mt-6 max-w-5xl px-4">
        <div
          className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent"
          aria-hidden
        />
        <section
          id="suite"
          className="scroll-mt-28 mt-10 rounded-[1.75rem] border border-emerald-900/20 bg-gradient-to-br from-stone-900/60 via-stone-950/80 to-stone-950 p-6 shadow-inner shadow-black/40 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            {d.landing_post_market_eyebrow}
          </p>
          <h2 className="mt-3 text-xl font-bold leading-snug text-stone-50 sm:text-2xl">
            {d.landing_post_market_title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-400 sm:text-base">
            {d.landing_post_market_body}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <PillarCard icon={IconWallet} title={d.landing_pillar_assets_t} body={d.landing_pillar_assets_d} />
            <PillarCard icon={IconP2P} title={d.landing_pillar_p2p_t} body={d.landing_pillar_p2p_d} />
            <PillarCard icon={IconSmartphone} title={d.landing_pillar_rails_t} body={d.landing_pillar_rails_d} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PillarCard icon={IconBell} title={d.landing_pillar_notify_t} body={d.landing_pillar_notify_d} />
            <PillarCard icon={IconShield} title={d.landing_pillar_transparency_t} body={d.landing_pillar_transparency_d} />
          </div>
        </section>
      </div>

      <main className="relative mx-auto max-w-5xl space-y-20 px-4 pb-24 pt-16">
        <section id="preview" className="scroll-mt-28" aria-labelledby="preview-h">
          <div className="flex flex-col gap-3 border-l-4 border-emerald-500/70 pl-5 sm:pl-6">
            <h2 id="preview-h" className="text-2xl font-bold text-stone-50 sm:text-3xl">
              {d.landing_preview_heading}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-400 sm:text-base">
              {d.landing_preview_sub}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-2xl bg-emerald-600 px-8 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 sm:w-auto"
            >
              {d.landing_cta_primary}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-2xl border border-stone-600 bg-stone-900/60 px-8 text-sm font-semibold text-stone-100 transition hover:border-stone-500 sm:w-auto"
            >
              {d.landing_cta_login}
            </Link>
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-stone-500 sm:text-sm">
            {d.landing_preview_hint}
          </p>
        </section>

        <section id="features" aria-labelledby="features-h">
          <h2
            id="features-h"
            className="text-center text-2xl font-bold text-stone-50 sm:text-3xl"
          >
            {d.landing_features_heading}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
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

        <section id="how" className="scroll-mt-28" aria-labelledby="how-h">
          <h2
            id="how-h"
            className="text-center text-2xl font-bold text-stone-50 sm:text-3xl"
          >
            {d.landing_how_heading}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div
                key={s.n}
                className="flex flex-col rounded-2xl border border-stone-700/50 bg-stone-950/50 p-5"
              >
                <span className="text-4xl font-black tabular-nums text-emerald-500/25">
                  {String(s.n).padStart(2, "0")}
                </span>
                <p className="mt-3 text-sm font-semibold leading-snug text-stone-200">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="trust"
          className="scroll-mt-28 rounded-3xl border border-emerald-800/25 bg-gradient-to-br from-emerald-950/40 via-stone-900/90 to-stone-950 p-6 sm:p-10"
          aria-labelledby="trust-h"
        >
          <h2 id="trust-h" className="text-xl font-bold text-stone-50 sm:text-2xl">
            {d.landing_trust_heading}
          </h2>
          <ul className="mt-6 space-y-5">
            <li className="flex gap-4 text-sm leading-relaxed text-stone-300">
              <IconShield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400/90" />
              <span>{d.landing_trust_1}</span>
            </li>
            <li className="flex gap-4 text-sm leading-relaxed text-stone-300">
              <IconBell className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400/90" />
              <span>{d.landing_trust_2}</span>
            </li>
            <li className="flex gap-4 text-sm leading-relaxed text-stone-300">
              <IconLock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400/90" />
              <span>{d.landing_trust_3}</span>
            </li>
            <li className="flex gap-4 text-sm leading-relaxed text-stone-300">
              <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400/90" />
              <span>{d.landing_trust_4}</span>
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-stone-800 bg-stone-950/95 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-base font-semibold text-stone-200">
            {d.landing_footer_tagline}
          </p>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-stone-500">
            {d.landing_inspired_note}
          </p>
          <nav
            className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-emerald-400/95"
            aria-label="Footer"
          >
            <Link href="/about" className="transition hover:text-emerald-300 hover:underline">
              {d.landing_footer_about}
            </Link>
            <Link href="/contact" className="transition hover:text-emerald-300 hover:underline">
              {d.landing_footer_contact}
            </Link>
            <Link href="/terms" className="transition hover:text-emerald-300 hover:underline">
              {d.landing_footer_terms}
            </Link>
            <Link href="/privacy" className="transition hover:text-emerald-300 hover:underline">
              {d.landing_footer_privacy}
            </Link>
          </nav>
          <p className="mt-10 text-center text-xs text-stone-600">
            © {new Date().getFullYear()} {d.brand}
          </p>
        </div>
      </footer>
    </div>
  );
}
