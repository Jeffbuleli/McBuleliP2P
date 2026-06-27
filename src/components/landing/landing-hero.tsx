import Link from "next/link";
import type { ComponentType } from "react";
import { LandingEcosystemIllustration } from "@/components/landing/landing-ecosystem-illustration";
import {
  IconHeadset,
  IconShield,
  IconZap,
} from "@/components/landing/landing-icons";
import type { Messages } from "@/i18n/messages";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";

type HeroDict = Pick<
  Messages,
  | "landing_presentation_eyebrow"
  | "landing_presentation_title"
  | "landing_presentation_sub"
  | "landing_cta_primary"
  | "landing_cta_login"
  | "landing_cta_market"
  | "landing_stat_1_t"
  | "landing_stat_1_d"
  | "landing_stat_2_t"
  | "landing_stat_2_d"
  | "landing_stat_3_t"
  | "landing_stat_3_d"
>;

function StatPill({
  icon: Icon,
  title,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/60 px-3 py-1.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--fd-primary)] shadow-sm">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[11px] font-extrabold leading-none text-[color:var(--fd-primary)]">{title}</p>
        {detail ? (
          <p className="mt-0.5 text-[9px] font-medium leading-none text-[color:var(--fd-muted)]">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

export function LandingHero({ d }: { d: HeroDict }) {
  const stats = [
    { icon: IconZap, title: d.landing_stat_1_t, detail: d.landing_stat_1_d },
    { icon: IconShield, title: d.landing_stat_2_t, detail: d.landing_stat_2_d },
    { icon: IconHeadset, title: d.landing_stat_3_t, detail: d.landing_stat_3_d },
  ];

  return (
    <section className="fd-card overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[color:var(--fd-mint)] via-[color:var(--fd-card)] to-[color:var(--fd-card)] p-5 sm:p-7">
      <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--fd-primary)]">
            {d.landing_presentation_eyebrow}
          </p>
          <h1 className="mt-2 text-balance text-2xl font-black leading-[1.12] tracking-tight text-[color:var(--fd-text)] sm:text-3xl lg:text-[2rem]">
            {d.landing_presentation_title}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[color:var(--fd-muted)]">
            {d.landing_presentation_sub}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href={registerHrefFor("/app/wallet")}
              prefetch={false}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] px-5 text-sm font-extrabold text-white shadow-lg shadow-[color:var(--fd-primary)]/25 active:scale-[0.99]"
            >
              {d.landing_cta_primary}
            </Link>
            <Link
              href={loginHrefFor("/app/wallet")}
              prefetch={false}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border-2 border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-5 text-sm font-bold text-[color:var(--fd-text)] active:scale-[0.99] sm:flex-none sm:px-6"
            >
              {d.landing_cta_login}
            </Link>
            <Link
              href="/#market"
              prefetch={false}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] px-5 text-sm font-bold text-[color:var(--fd-primary)] active:scale-[0.99] sm:flex-none sm:px-6"
            >
              {d.landing_cta_market}
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.map((s) => (
              <StatPill key={s.title} icon={s.icon} title={s.title} detail={s.detail} />
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <LandingEcosystemIllustration className="h-auto w-full drop-shadow-sm" />
        </div>
      </div>
    </section>
  );
}
