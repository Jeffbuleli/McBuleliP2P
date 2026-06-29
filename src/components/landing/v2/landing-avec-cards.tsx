"use client";

import { SessionAppLink } from "@/components/landing/session-app-link";
import { HudFrame } from "@/components/about/about-ui";
import { LANDING_CTA_COMPACT } from "@/components/landing/landing-hud-ui";

function AvecCard({
  title,
  yieldLabel,
  tag,
  desc,
  appPath,
  accent,
  icon,
}: {
  title: string;
  yieldLabel: string;
  tag: string;
  desc: string;
  appPath: string;
  accent: "amber" | "green";
  icon: string;
}) {
  return (
    <HudFrame accent={accent === "amber" ? "magenta" : "green"}>
      <article className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0a1018]/90 p-5 sm:p-6">
        <div className="relative z-10">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wide text-stone-400">
            {tag}
          </span>
          <h3 className="mt-3 text-lg font-black text-white sm:text-xl">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">{desc}</p>
          <p
            className={`mt-4 inline-flex rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] sm:text-[11px] ${
              accent === "amber"
                ? "border-fuchsia-500/25 bg-fuchsia-500/8 text-fuchsia-300"
                : "border-cyan-500/25 bg-cyan-500/8 text-cyan-300"
            }`}
          >
            {yieldLabel}
          </p>
          <SessionAppLink href={appPath} className={`mt-5 ${LANDING_CTA_COMPACT}`}>
            {icon} →
          </SessionAppLink>
        </div>
      </article>
    </HudFrame>
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
      <AvecCard {...groups} appPath="/app/wallet/groups" accent="amber" />
      <AvecCard {...staking} appPath="/app/wallet/staking" accent="green" />
    </div>
  );
}
