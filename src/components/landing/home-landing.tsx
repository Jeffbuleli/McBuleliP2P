import Link from "next/link";
import type { ComponentType } from "react";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";
import { MarketPreview } from "@/components/mobile/market-preview";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { LandingPromoStrip } from "@/components/landing/landing-promo-strip";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import { poolNewDepositsEnabled } from "@/lib/pool-features";
import {
  IconBot,
  IconChartLine,
  IconCheck,
  IconCoins,
  IconHeadset,
  IconKyc,
  IconLock,
  IconOptions,
  IconP2P,
  IconShield,
  IconStaking,
  IconUsers,
  IconWallet,
} from "@/components/landing/landing-icons";

function ServiceTile({
  icon: Icon,
  title,
  tag,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  tag: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-3 text-center shadow-sm transition hover:border-[color:var(--fd-primary)]/25 hover:shadow-md">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${
          accent
            ? "bg-[color:var(--fd-primary)] text-white ring-[color:var(--fd-primary)]/40 shadow-md shadow-[color:var(--fd-primary)]/20"
            : "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-[color:var(--fd-primary)]/15"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-[13px] font-extrabold leading-tight text-[color:var(--fd-text)]">{title}</h3>
      <p className="text-[10px] font-medium leading-snug text-[color:var(--fd-muted)]">{tag}</p>
    </div>
  );
}

function TrustChip({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-semibold leading-snug text-[color:var(--fd-text)]">{label}</p>
    </div>
  );
}

function StepChip({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-2 py-3 text-center shadow-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--fd-primary)] text-xs font-black text-white">
        {n}
      </span>
      <p className="text-[10px] font-bold leading-snug text-[color:var(--fd-text)]">{label}</p>
    </div>
  );
}

export async function HomeLanding() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const tickers = await fetchMarketTickers();

  const services: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    tag: string;
    accent?: boolean;
  }[] = [
    { icon: IconWallet, title: d.landing_svc_wallet_t, tag: d.landing_svc_wallet_tag },
    { icon: IconP2P, title: d.landing_svc_p2p_t, tag: d.landing_svc_p2p_tag },
    { icon: IconBot, title: d.landing_svc_bots_t, tag: d.landing_svc_bots_tag },
    { icon: IconChartLine, title: d.landing_svc_futures_t, tag: d.landing_svc_futures_tag },
    { icon: IconOptions, title: d.landing_svc_options_t, tag: d.landing_svc_options_tag },
    { icon: IconStaking, title: d.landing_svc_staking_t, tag: d.landing_svc_staking_tag },
    ...(poolNewDepositsEnabled()
      ? [{ icon: IconCoins, title: d.landing_svc_pool_t, tag: d.landing_svc_pool_tag }]
      : []),
    { icon: IconUsers, title: d.landing_svc_groups_t, tag: d.landing_svc_groups_tag },
    { icon: IconKyc, title: d.landing_svc_kyc_t, tag: d.landing_svc_kyc_tag },
    { icon: IconHeadset, title: d.landing_svc_support_t, tag: d.landing_svc_support_tag, accent: true },
  ];

  const steps = [d.landing_step_1, d.landing_step_2, d.landing_step_3, d.landing_step_4];

  const trust = [
    { icon: IconShield, label: d.landing_trust_1 },
    { icon: IconLock, label: d.landing_trust_3 },
    { icon: IconCheck, label: d.landing_trust_4 },
  ];

  return (
    <div className="home-theme fd-public-light min-h-dvh">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(48,95,51,0.12),transparent)]"
        aria-hidden
      />

      <LandingTopBar />

      <div className="relative mx-auto max-w-lg px-3 pb-4 pt-1 sm:max-w-2xl lg:max-w-5xl">
        <section className="fd-card overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[color:var(--fd-mint)] via-[color:var(--fd-card)] to-[color:var(--fd-card)] p-5 sm:p-7">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--fd-primary)]">
            {d.landing_presentation_eyebrow}
          </p>
          <h1 className="mt-2 text-balance text-2xl font-black leading-[1.12] tracking-tight text-[color:var(--fd-text)] sm:text-3xl">
            {d.landing_presentation_title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
            {d.landing_presentation_sub}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] px-5 text-sm font-extrabold text-white shadow-lg shadow-[color:var(--fd-primary)]/25 active:scale-[0.99]"
            >
              {d.landing_cta_primary}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border-2 border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-5 text-sm font-bold text-[color:var(--fd-text)] active:scale-[0.99]"
            >
              {d.landing_cta_login}
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[d.landing_stat_1_t, d.landing_stat_2_t, d.landing_stat_3_t].map((label) => (
              <span
                key={label}
                className="rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--fd-primary)]"
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <LandingPromoStrip />

        <div className="mt-5 space-y-5">
          <PriceChartLazy appearance="light" />
          <section id="market" className="scroll-mt-24">
            <MarketPreview locale={locale} initialTickers={tickers} appearance="light" />
          </section>
        </div>
      </div>

      <main className="relative mx-auto max-w-5xl space-y-10 px-4 pb-14 pt-8">
        <section id="services" className="scroll-mt-24" aria-labelledby="services-h">
          <div className="text-center">
            <h2
              id="services-h"
              className="text-lg font-black text-[color:var(--fd-text)] sm:text-xl"
            >
              {d.landing_services_heading}
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[color:var(--fd-muted)]">
              {d.landing_services_sub}
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {services.map((s) => (
              <ServiceTile
                key={s.title}
                icon={s.icon}
                title={s.title}
                tag={s.tag}
                accent={s.accent}
              />
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-24" aria-labelledby="how-h">
          <h2 id="how-h" className="text-center text-lg font-black text-[color:var(--fd-text)]">
            {d.landing_how_heading}
          </h2>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {steps.map((label, i) => (
              <StepChip key={i} n={i + 1} label={label} />
            ))}
          </div>
        </section>

        <section
          id="trust"
          className="scroll-mt-24 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-4"
          aria-labelledby="trust-h"
        >
          <h2
            id="trust-h"
            className="text-center text-xs font-extrabold uppercase tracking-wide text-[color:var(--fd-primary)]"
          >
            {d.landing_trust_heading}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {trust.map((t) => (
              <TrustChip key={t.label} icon={t.icon} label={t.label} />
            ))}
          </div>
        </section>

        <section className="fd-card flex flex-col items-center gap-3 rounded-2xl p-5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/15">
            <IconHeadset className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[color:var(--fd-text)]">{d.landing_support_cta}</p>
            <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{d.landing_support_sub}</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] w-full max-w-xs items-center justify-center rounded-xl bg-[color:var(--fd-mint)] px-4 text-xs font-bold text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/20 active:scale-[0.99]"
          >
            {d.landing_footer_contact}
          </Link>
        </section>
      </main>

      <footer className="border-t border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-6">
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{d.landing_footer_tagline}</p>
          <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-[color:var(--fd-primary)]">
            <Link href="/about" className="hover:opacity-80">
              {d.landing_footer_about}
            </Link>
            <Link href="/contact" className="hover:opacity-80">
              {d.landing_footer_contact}
            </Link>
            <Link href="/terms" className="hover:opacity-80">
              {d.landing_footer_terms}
            </Link>
            <Link href="/privacy" className="hover:opacity-80">
              {d.landing_footer_privacy}
            </Link>
          </nav>
          <p className="mt-4 text-[10px] text-[color:var(--fd-muted)]">
            © {new Date().getFullYear()} {d.brand}
          </p>
        </div>
      </footer>
    </div>
  );
}
