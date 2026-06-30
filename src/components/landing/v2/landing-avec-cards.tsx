"use client";

import { SessionAppLink } from "@/components/landing/session-app-link";

function AvecCard({
  title,
  yieldLabel,
  tag,
  desc,
  appPath,
  gradient,
  icon,
}: {
  title: string;
  yieldLabel: string;
  tag: string;
  desc: string;
  appPath: string;
  gradient: string;
  icon: string;
}) {
  return (
    <article className={`relative overflow-hidden rounded-3xl border border-white/70 p-5 shadow-lg ring-1 ring-black/[0.03] sm:p-6 ${gradient}`}>
      <div className="relative z-10">
        <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-stone-700">
          {tag}
        </span>
        <h3 className="mt-3 text-lg font-black text-stone-900 sm:text-xl">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">{desc}</p>
        <p className="mt-4 text-2xl font-black text-stone-900 sm:text-3xl">{yieldLabel}</p>
        <SessionAppLink
          href={appPath}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#305F33] px-5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#244a27]"
        >
          {icon} →
        </SessionAppLink>
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/30 blur-2xl" aria-hidden />
    </article>
  );
}

export function LandingAvecCards({
  groups,
  staking,
}: {
  groups: {
    title: string;
    yieldLabel: string;
    tag: string;
    desc: string;
    icon: string;
  };
  staking: {
    title: string;
    yieldLabel: string;
    tag: string;
    desc: string;
    icon: string;
  };
}) {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <AvecCard
        {...groups}
        appPath="/app/wallet/groups"
        gradient="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white"
      />
      <AvecCard
        {...staking}
        appPath="/app/wallet/staking"
        gradient="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white"
      />
    </div>
  );
}
