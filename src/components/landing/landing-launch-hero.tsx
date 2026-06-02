import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
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
        <article
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] border border-[color:var(--fd-primary)]/25 shadow-lg shadow-[color:var(--fd-primary)]/15 transition group-hover:border-[color:var(--fd-primary)]/45 group-hover:shadow-xl sm:aspect-[16/9]"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(125deg, #1a2e1c 0%, #305f33 42%, #3d7a42 58%, #244a27 100%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-8 top-0 h-40 w-40 rounded-full bg-[#e8f3ee]/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 right-[28%] h-32 w-32 rounded-full bg-[#c5e8d0]/15 blur-xl"
            aria-hidden
          />

          <div className="relative flex h-full min-h-0 flex-row">
            <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#e8f3ee]/90 sm:text-[10px]">
                {c.eyebrow}
              </p>
              <h2
                id="launch-hero-title"
                className="mt-1 text-balance text-lg font-black leading-tight text-white sm:text-2xl lg:text-3xl"
              >
                {c.title}
              </h2>
              <p className="mt-0.5 text-sm font-bold text-[#c5e8d0] sm:text-base">
                {c.subtitle}
              </p>
              <p className="mt-2 inline-flex w-fit items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-extrabold text-white backdrop-blur-sm sm:text-xs">
                {c.dateLine}
              </p>

              <ul className="mt-3 flex flex-wrap gap-2 sm:gap-2.5">
                {c.topics.map((label, i) => {
                  const Icon = TOPIC_ICONS[i] ?? LaunchIconCrypto;
                  return (
                    <li
                      key={label}
                      className="flex items-center gap-1.5 rounded-lg bg-[#e8f3ee]/12 px-2 py-1 text-[10px] font-bold text-white ring-1 ring-white/15 sm:text-[11px]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#c5e8d0]" />
                      {label}
                    </li>
                  );
                })}
              </ul>

              <p className="mt-2 hidden text-[10px] font-medium text-[#e8f3ee]/80 sm:block sm:text-xs">
                {c.trainingLine}
              </p>

              <span className="mt-3 inline-flex w-fit items-center rounded-xl bg-white px-3 py-2 text-[11px] font-extrabold text-[#305f33] shadow-md transition group-hover:bg-[#e8f3ee] sm:text-sm">
                {c.cta}
                <span className="ml-1.5 opacity-70" aria-hidden>
                  →
                </span>
              </span>
              <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-[#e8f3ee]/70">
                {c.freeBadge}
              </span>
            </div>

            <div className="relative w-[38%] shrink-0 sm:w-[34%] lg:w-[32%]">
              <div
                className="absolute inset-0 bg-gradient-to-l from-transparent via-[#244a27]/40 to-[#305f33]/80"
                aria-hidden
              />
              <Image
                src={PORTRAIT_PATH}
                alt="Jeff Buleli — McBuleli"
                fill
                priority
                className="object-cover object-[center_15%] contrast-[1.04] saturate-[1.05] brightness-[1.02]"
                sizes="(max-width: 640px) 38vw, 32vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#1a2e1c]/90 via-transparent to-transparent"
                aria-hidden
              />
              <p className="absolute bottom-2 left-2 right-2 text-center text-[8px] font-bold text-white/90 sm:text-[10px]">
                Jeff Buleli · CEO
              </p>
            </div>
          </div>
        </article>
      </Link>
    </section>
  );
}
