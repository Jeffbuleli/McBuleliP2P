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
        {/* Mobile PWA : affiche PNG entière (aucune coupe) */}
        <div className="relative w-full overflow-hidden rounded-[1.25rem] border border-[color:var(--fd-primary)]/25 shadow-lg shadow-[color:var(--fd-primary)]/15 sm:hidden">
          <Image
            src="/launch/hero-mobile.png"
            alt={`${c.title} — ${c.subtitle}`}
            width={1080}
            height={1350}
            priority
            unoptimized
            className="h-auto w-full"
            sizes="100vw"
          />
        </div>

        {/* Tablette / desktop */}
        <article className="relative hidden w-full overflow-hidden rounded-[1.25rem] border border-[color:var(--fd-primary)]/25 bg-[#1a2e1c] shadow-lg shadow-[color:var(--fd-primary)]/15 transition group-hover:border-[color:var(--fd-primary)]/45 group-hover:shadow-xl sm:block">
          <div className="flex min-h-0 flex-row aspect-[16/9]">
            <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center px-6 py-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Image
                  src={BRAND_LOGO_256}
                  alt="McBuleli"
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm ring-2 ring-white/30"
                />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#e8f3ee]">
                  {c.eyebrow}
                </p>
              </div>

              <h2
                id="launch-hero-title"
                className="mt-2 text-balance text-2xl font-black leading-tight text-white lg:text-3xl"
              >
                {c.title}
              </h2>
              <p className="mt-1 text-base font-bold text-[#c5e8d0]">{c.subtitle}</p>

              <p className="mt-3 inline-flex w-fit items-center rounded-full bg-[#e8f3ee]/20 px-3 py-1 text-xs font-extrabold text-white ring-1 ring-white/20">
                {c.dateLine}
              </p>

              <ul className="mt-3 flex flex-wrap gap-2">
                {c.topics.map((label, i) => {
                  const Icon = TOPIC_ICONS[i] ?? LaunchIconCrypto;
                  return (
                    <li
                      key={label}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white ring-1 ring-white/15"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#c5e8d0]" />
                      {label}
                    </li>
                  );
                })}
              </ul>

              <p className="mt-2 text-xs text-[#e8f3ee]/85">{c.trainingLine}</p>

              <span className="mt-3 inline-flex w-fit items-center rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#305f33] shadow-md transition group-hover:bg-[#e8f3ee]">
                {c.cta}
                <span className="ml-2 opacity-70" aria-hidden>
                  →
                </span>
              </span>
              <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-[#e8f3ee]/70">
                {c.freeBadge}
              </span>
            </div>

            <div className="relative w-[36%] shrink-0 lg:w-[34%]">
              <div
                className="absolute inset-0 bg-gradient-to-l from-[#1a2e1c] via-transparent to-transparent"
                aria-hidden
              />
              <Image
                src={PORTRAIT_PATH}
                alt="Jeff Buleli — McBuleli"
                fill
                priority
                unoptimized
                className="object-cover object-[center_12%]"
                sizes="36vw"
              />
              <p className="absolute bottom-2 left-0 right-0 z-10 text-center text-[10px] font-bold text-white/95">
                Jeff Buleli · CEO
              </p>
            </div>
          </div>
        </article>
      </Link>
    </section>
  );
}
