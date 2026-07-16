"use client";

import { SessionAppLink } from "@/components/landing/session-app-link";
import { IconArrow } from "@/components/landing/landing-icons";

function AvecCard({
  title,
  yieldLabel,
  tag,
  desc,
  appPath,
  cta,
}: {
  title: string;
  yieldLabel: string;
  tag: string;
  desc: string;
  appPath: string;
  cta: string;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-[#fafaf9] p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{tag}</p>
      <h3 className="mt-2 text-lg font-bold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{desc}</p>
      <p className="mt-4 text-xl font-bold text-[#305F33]">{yieldLabel}</p>
      <SessionAppLink
        href={appPath}
        className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#305F33] px-5 text-sm font-bold text-white transition hover:bg-[#244a27]"
      >
        {cta}
        <IconArrow className="h-4 w-4" />
      </SessionAppLink>
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
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <AvecCard {...groups} cta={groups.icon} appPath="/app/wallet/groups" />
      <AvecCard {...staking} cta={staking.icon} appPath="/app/wallet/staking" />
    </div>
  );
}
