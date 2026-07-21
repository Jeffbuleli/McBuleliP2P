"use client";

import Link from "next/link";
import { HackathonLogo } from "@/components/hackathon/hackathon-logo";
import { useI18n } from "@/components/i18n-provider";
import {
  HACKATHON_DATES_LABEL_EN,
  HACKATHON_DATES_LABEL_FR,
} from "@/lib/hackathon/event-content";

function hackathonHomeCopy(isFr: boolean) {
  if (isFr) {
    return {
      eyebrow: "McBuleli Hackathon",
      title: "Hackathon IA · Kinshasa",
      subtitle: "Bootcamp Vibe Coding · Build · Demo Day",
      dateLine: `${HACKATHON_DATES_LABEL_FR} · Silikin Village`,
      topics: ["IA", "FinTech", "GovTech", "Éducation"],
      partners: "pawaPay · Binance · partenaires",
      cta: "Rejoindre le hackathon",
      badge: "100 USD · 3 demi-journées",
      teams: "12 équipes attendues",
    };
  }
  return {
    eyebrow: "McBuleli Hackathon",
    title: "AI Hackathon · Kinshasa",
    subtitle: "Vibe Coding bootcamp · Build · Demo Day",
    dateLine: `${HACKATHON_DATES_LABEL_EN} · Silikin Village`,
    topics: ["AI", "FinTech", "GovTech", "Education"],
    partners: "pawaPay · Binance · partners",
    cta: "Join the hackathon",
    badge: "100 USD · 3 half-days",
    teams: "12 teams expected",
  };
}

export function LandingHackathonHero() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const c = hackathonHomeCopy(isFr);

  return (
    <section className="mt-5 w-full" aria-labelledby="hackathon-home-title">
      <Link
        href="/hackathon"
        prefetch
        className="group block w-full rounded-[1.25rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fd-primary)] focus-visible:ring-offset-2"
      >
        <article className="relative w-full overflow-hidden rounded-[1.25rem] border border-[color:var(--fd-primary)]/25 bg-[#132016] shadow-lg shadow-[color:var(--fd-primary)]/20 transition duration-300 group-hover:border-[color:var(--fd-primary)]/50 group-hover:shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgba(224,122,47,0.22),transparent_55%),linear-gradient(145deg,rgba(61,122,66,0.4)_0%,transparent_48%,rgba(19,32,22,0.65)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#e07a2f]/15 blur-2xl transition duration-500 group-hover:bg-[#e07a2f]/25"
            aria-hidden
          />

          <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6 lg:p-7">
            <div className="flex shrink-0 justify-center sm:justify-start">
              <span className="inline-flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-2xl bg-white/95 p-2 shadow-md ring-1 ring-white/40 transition duration-300 group-hover:scale-[1.03] sm:h-28 sm:w-28">
                <HackathonLogo className="h-full w-full" />
              </span>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c5e8d0] sm:text-[11px]">
                {c.eyebrow}
              </p>
              <h2
                id="hackathon-home-title"
                className="mt-1.5 text-balance text-xl font-black leading-[1.12] text-white sm:text-2xl lg:text-3xl"
              >
                {c.title}
              </h2>
              <p className="mt-1 text-sm font-bold leading-snug text-[#e8c48a] sm:text-base">
                {c.subtitle}
              </p>

              <p className="mt-3 inline-flex max-w-full items-center rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-extrabold leading-tight text-white ring-1 ring-white/20 sm:text-xs">
                {c.dateLine}
              </p>

              <ul className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {c.topics.map((label) => (
                  <li
                    key={label}
                    className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white ring-1 ring-white/15"
                  >
                    {label}
                  </li>
                ))}
              </ul>

              <p className="mt-2.5 text-[11px] font-medium text-[#e8f3ee]/85 sm:text-xs">
                {c.teams} · {c.partners}
              </p>

              <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#305f33] shadow-md transition duration-300 group-hover:bg-[#e8f3ee] sm:w-fit sm:py-2.5">
                  {c.cta}
                  <svg
                    className="ml-2 inline h-4 w-4 opacity-70 transition group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M5 12h14M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#e8f3ee]/75 sm:text-[11px]">
                  {c.badge}
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </section>
  );
}
