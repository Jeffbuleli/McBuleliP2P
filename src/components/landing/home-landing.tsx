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
  IconBot,
  IconChartLine,
  IconCheck,
  IconCoins,
  IconHeadset,
  IconLoan,
  IconLock,
  IconP2P,
  IconShield,
  IconSmartphone,
  IconStaking,
  IconUsers,
  IconWallet,
} from "@/components/landing/landing-icons";

function ServiceTile({
  icon: Icon,
  title,
  tag,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  tag: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-emerald-800/25 bg-gradient-to-b from-stone-900/80 to-stone-950/90 p-4 text-center shadow-lg shadow-black/25 transition hover:border-emerald-600/40">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/25">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-sm font-extrabold leading-tight text-stone-50">{title}</h3>
      <p className="text-[11px] font-medium leading-snug text-emerald-400/90">{tag}</p>
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
    <div className="flex items-center gap-3 rounded-xl border border-stone-700/40 bg-stone-950/60 px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold leading-snug text-stone-300">{label}</p>
    </div>
  );
}

function StepChip({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-950/50 px-3 py-4 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white shadow-md shadow-emerald-950/50">
        {n}
      </span>
      <p className="text-[11px] font-bold leading-snug text-stone-200">{label}</p>
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
  }[] = [
    { icon: IconWallet, title: d.landing_svc_wallet_t, tag: d.landing_svc_wallet_tag },
    { icon: IconP2P, title: d.landing_svc_p2p_t, tag: d.landing_svc_p2p_tag },
    { icon: IconBot, title: d.landing_svc_bots_t, tag: d.landing_svc_bots_tag },
    { icon: IconChartLine, title: d.landing_svc_futures_t, tag: d.landing_svc_futures_tag },
    { icon: IconUsers, title: d.landing_svc_groups_t, tag: d.landing_svc_groups_tag },
    { icon: IconCoins, title: d.landing_svc_pool_t, tag: d.landing_svc_pool_tag },
    { icon: IconStaking, title: d.landing_svc_staking_t, tag: d.landing_svc_staking_tag },
    { icon: IconLoan, title: d.landing_svc_loans_t, tag: d.landing_svc_loans_tag },
    { icon: IconHeadset, title: d.landing_svc_support_t, tag: d.landing_svc_support_tag },
    { icon: IconSmartphone, title: d.landing_svc_mm_t, tag: d.landing_svc_mm_tag },
  ];

  const steps = [
    d.landing_step_1,
    d.landing_step_2,
    d.landing_step_3,
    d.landing_step_4,
  ];

  const trust = [
    { icon: IconShield, label: d.landing_trust_1 },
    { icon: IconBell, label: d.landing_trust_2 },
    { icon: IconLock, label: d.landing_trust_3 },
    { icon: IconCheck, label: d.landing_trust_4 },
  ];

  return (
    <div className="min-h-full">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.14),transparent)]"
        aria-hidden
      />

      <LandingTopBar />

      <div className="relative mx-auto max-w-lg px-3 pb-4 pt-1 sm:max-w-2xl lg:max-w-5xl">
        <section className="overflow-hidden rounded-[1.75rem] border-2 border-emerald-800/30 bg-gradient-to-br from-stone-900/90 via-stone-950 to-stone-950 p-6 shadow-2xl shadow-black/50 sm:p-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-emerald-400">
            {d.landing_presentation_eyebrow}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl">
            {d.landing_presentation_title}
          </h1>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-[50px] flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-6 text-base font-extrabold text-white shadow-lg shadow-emerald-950/40 active:scale-[0.99]"
            >
              {d.landing_cta_primary}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[50px] flex-1 items-center justify-center rounded-2xl border-2 border-stone-600 bg-stone-900/60 px-6 text-base font-bold text-stone-100 active:scale-[0.99]"
            >
              {d.landing_cta_login}
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[d.landing_stat_1_t, d.landing_stat_2_t, d.landing_stat_3_t].map((label) => (
              <span
                key={label}
                className="rounded-full border border-emerald-700/35 bg-emerald-950/50 px-3 py-1 text-[11px] font-bold text-emerald-300"
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <PriceChartLazy />
          <section id="market" className="scroll-mt-24">
            <MarketPreview locale={locale} initialTickers={tickers} />
          </section>
        </div>
      </div>

      <main className="relative mx-auto max-w-5xl space-y-14 px-4 pb-20 pt-10">
        <section id="services" className="scroll-mt-24" aria-labelledby="services-h">
          <h2
            id="services-h"
            className="text-center text-xl font-black text-stone-50 sm:text-2xl"
          >
            {d.landing_services_heading}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {services.map((s) => (
              <ServiceTile key={s.title} icon={s.icon} title={s.title} tag={s.tag} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 px-10 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/35 active:scale-[0.99]"
            >
              {d.landing_cta_primary}
            </Link>
          </div>
        </section>

        <section id="how" className="scroll-mt-24" aria-labelledby="how-h">
          <h2 id="how-h" className="text-center text-xl font-black text-stone-50">
            {d.landing_how_heading}
          </h2>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {steps.map((label, i) => (
              <StepChip key={i} n={i + 1} label={label} />
            ))}
          </div>
        </section>

        <section
          id="trust"
          className="scroll-mt-24 rounded-2xl border border-emerald-900/25 bg-stone-950/80 p-4 sm:p-6"
          aria-labelledby="trust-h"
        >
          <h2 id="trust-h" className="text-center text-sm font-extrabold uppercase tracking-wide text-emerald-400">
            {d.landing_trust_heading}
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {trust.map((t) => (
              <TrustChip key={t.label} icon={t.icon} label={t.label} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-800 bg-stone-950 px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm font-bold text-stone-300">{d.landing_footer_tagline}</p>
          <nav className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-emerald-400">
            <Link href="/about" className="hover:text-emerald-300">
              {d.landing_footer_about}
            </Link>
            <Link href="/contact" className="hover:text-emerald-300">
              {d.landing_footer_contact}
            </Link>
            <Link href="/terms" className="hover:text-emerald-300">
              {d.landing_footer_terms}
            </Link>
            <Link href="/privacy" className="hover:text-emerald-300">
              {d.landing_footer_privacy}
            </Link>
          </nav>
          <p className="mt-6 text-xs text-stone-600">
            © {new Date().getFullYear()} {d.brand}
          </p>
        </div>
      </footer>
    </div>
  );
}
