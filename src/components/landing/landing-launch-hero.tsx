import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import {
  FORMATION_PATH,
  launchCopy,
  PORTRAIT_PATH,
} from "@/lib/launch-campaign";
import { HudFrame } from "@/components/about/about-ui";
import {
  LaunchIconAi,
  LaunchIconCrypto,
  LaunchIconP2p,
  LaunchIconTrading,
} from "@/components/landing/launch-poster-illustrations";

const TOPIC_ICONS = [
  LaunchIconCrypto,
  LaunchIconTrading,
  LaunchIconAi,
  LaunchIconP2p,
] as const;

function LaunchHeroContent({ c }: { c: ReturnType<typeof launchCopy> }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Image
          src={BRAND_LOGO_256}
          alt="McBuleli"
          width={44}
          height={44}
          unoptimized
          className="h-11 w-11 shrink-0 rounded-full object-contain p-0.5 ring-2 ring-cyan-400/30"
        />
        <p className="min-w-0 font-mono text-[10px] font-bold uppercase leading-tight tracking-[0.18em] text-cyan-400/90 sm:text-[11px]">
          {c.eyebrow}
        </p>
      </div>

      <h2
        id="launch-hero-title"
        className="mt-3 text-balance bg-linear-to-r from-white via-cyan-100 to-emerald-300/90 bg-clip-text text-xl font-black leading-[1.12] text-transparent sm:mt-2 sm:text-2xl lg:text-3xl"
      >
        {c.title}
      </h2>
      <p className="mt-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-emerald-400/90 sm:text-sm">
        {c.subtitle}
      </p>

      <p className="mt-3 inline-flex max-w-full items-center border border-fuchsia-500/25 bg-fuchsia-500/8 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-fuchsia-300 sm:text-[11px]">
        {c.dateLine}
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
        {c.topics.map((label, i) => {
          const Icon = TOPIC_ICONS[i] ?? LaunchIconCrypto;
          return (
            <li
              key={label}
              className="flex items-center gap-2 border border-white/10 bg-white/[0.03] px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wide text-stone-300 sm:px-2 sm:py-1.5"
            >
              <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="truncate">{label}</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-stone-500 sm:text-[11px]">
        {c.trainingLine}
      </p>

      <span className="mt-4 inline-flex w-full min-h-[46px] items-center justify-center rounded-2xl bg-emerald-500/10 px-6 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/30 transition group-hover:bg-emerald-500/15 sm:w-auto">
        {c.cta} →
      </span>
      <p className="mt-2 pb-1 text-center font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-stone-600 sm:pb-0 sm:text-left">
        {c.freeBadge}
      </p>
    </>
  );
}

export async function LandingLaunchHero({ linkHref = FORMATION_PATH }: { linkHref?: string | null }) {
  const locale = await getLocale();
  const c = launchCopy(locale);

  const article = (
    <article className="relative w-full overflow-hidden border border-fuchsia-500/20 bg-[#0a1018]/90 shadow-[0_0_48px_-16px_rgba(217,70,239,0.25)] transition group-hover:border-fuchsia-500/35">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(217,70,239,0.06)_0%,transparent_40%,rgba(34,211,238,0.05)_100%)]"
        aria-hidden
      />

      <div className="relative flex flex-col sm:flex-row sm:min-h-[280px]">
        <div className="relative z-10 flex flex-col px-4 pt-5 pb-4 sm:min-w-0 sm:flex-1 sm:justify-center sm:px-6 sm:py-6 lg:px-8">
          <LaunchHeroContent c={c} />
        </div>

        <div className="relative z-0 h-[min(58vw,260px)] w-full shrink-0 sm:h-auto sm:w-[38%] lg:w-[36%]">
          <div
            className="absolute inset-0 bg-linear-to-t from-[#050810] via-transparent to-transparent sm:bg-linear-to-l sm:from-[#050810] sm:via-transparent sm:to-transparent"
            aria-hidden
          />
          <Image
            src={PORTRAIT_PATH}
            alt="Jeff Buleli - McBuleli"
            fill
            priority
            unoptimized
            className="object-cover object-[center_15%] opacity-95 saturate-[0.92]"
            sizes="(max-width: 639px) 100vw, 38vw"
          />
          <p className="absolute bottom-2.5 left-0 right-0 z-10 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-300/90 drop-shadow-sm">
            Jeff Buleli · CEO
          </p>
        </div>
      </div>
    </article>
  );

  return (
    <section className="mt-5 w-full" aria-labelledby="launch-hero-title">
      <HudFrame accent="magenta" label={locale === "fr" ? "Formation · juillet" : "Training · july"}>
        {linkHref ? (
          <Link
            href={linkHref}
            prefetch={false}
            className="group block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050810]"
          >
            {article}
          </Link>
        ) : (
          <div className="w-full">{article}</div>
        )}
      </HudFrame>
    </section>
  );
}
