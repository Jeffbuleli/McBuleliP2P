import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import {
  FORMATION_PATH,
  launchCopy,
  PORTRAIT_PATH,
} from "@/lib/launch-campaign";
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
          className="h-11 w-11 shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm ring-2 ring-white/25"
        />
        <p className="min-w-0 text-[10px] font-extrabold uppercase leading-tight tracking-[0.16em] text-[#e8f3ee] sm:text-[11px]">
          {c.eyebrow}
        </p>
      </div>

      <h2
        id="launch-hero-title"
        className="mt-3 text-balance text-xl font-black leading-[1.12] text-white sm:mt-2 sm:text-2xl lg:text-3xl"
      >
        {c.title}
      </h2>
      <p className="mt-1 text-sm font-bold leading-snug text-[#c5e8d0] sm:text-base">
        {c.subtitle}
      </p>

      <p className="mt-3 inline-flex max-w-full items-center rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-extrabold leading-tight text-white ring-1 ring-white/20 sm:text-xs">
        {c.dateLine}
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
        {c.topics.map((label, i) => {
          const Icon = TOPIC_ICONS[i] ?? LaunchIconCrypto;
          return (
            <li
              key={label}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] font-bold text-white ring-1 ring-white/15 sm:rounded-lg sm:px-2 sm:py-1"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#c5e8d0]" />
              <span className="truncate">{label}</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 text-[11px] font-medium leading-relaxed text-[#e8f3ee]/90 sm:text-xs">
        {c.trainingLine}
      </p>

      <span className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#305f33] shadow-md transition group-hover:bg-[#e8f3ee] sm:mt-3 sm:w-fit sm:justify-start sm:py-2.5">
        {c.cta}
        <span className="ml-2 opacity-70" aria-hidden>
          →
        </span>
      </span>
      <p className="mt-2 pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#e8f3ee]/75 sm:pb-0 sm:text-left sm:text-[9px]">
        {c.freeBadge}
      </p>
    </>
  );
}

export async function LandingLaunchHero() {
  const locale = await getLocale();
  const c = launchCopy(locale);

  return (
    <section className="mt-5 w-full" aria-labelledby="launch-hero-title">
      <Link
        href={FORMATION_PATH}
        prefetch={false}
        className="group block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fd-primary)] focus-visible:ring-offset-2 rounded-[1.25rem]"
      >
        <article
          className="relative w-full overflow-hidden rounded-[1.25rem] border border-[color:var(--fd-primary)]/25 bg-[#1a2e1c] shadow-lg shadow-[color:var(--fd-primary)]/15 transition group-hover:border-[color:var(--fd-primary)]/45 group-hover:shadow-xl"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(61,122,66,0.35)_0%,transparent_45%,rgba(26,46,28,0.5)_100%)]"
            aria-hidden
          />

          {/* Mobile-first : texte puis portrait · Desktop : côte à côte */}
          <div className="relative flex flex-col sm:flex-row sm:aspect-[16/9]">
            <div className="relative z-10 flex flex-col px-4 pt-5 pb-4 sm:min-w-0 sm:flex-1 sm:justify-center sm:px-6 sm:py-6 lg:px-8">
              <LaunchHeroContent c={c} />
            </div>

            <div className="relative z-0 h-[min(58vw,260px)] w-full shrink-0 sm:h-auto sm:w-[38%] lg:w-[36%]">
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#1a2e1c] via-[#305f33]/25 to-transparent sm:bg-gradient-to-l sm:from-[#1a2e1c] sm:via-transparent sm:to-transparent"
                aria-hidden
              />
              <Image
                src={PORTRAIT_PATH}
                alt="Jeff Buleli — McBuleli"
                fill
                priority
                unoptimized
                className="object-cover object-[center_10%]"
                sizes="(max-width: 639px) 100vw, 38vw"
              />
              <p className="absolute bottom-2.5 left-0 right-0 z-10 text-center text-[10px] font-bold text-white drop-shadow-sm">
                Jeff Buleli · CEO
              </p>
            </div>
          </div>
        </article>
      </Link>
    </section>
  );
}
