import Link from "next/link";
import type { ComponentType } from "react";
import { AfricaContinentSvg, AfricaLogoBadge } from "@/components/landing/africa-continent-svg";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { homeSeoCopy } from "@/lib/seo/site";
import {
  IconKyc,
  IconP2P,
  IconStaking,
  IconWallet,
} from "@/components/landing/landing-icons";

const AFRICA_REGION_CODES = ["CD", "CG", "CM", "CI", "SN", "KE", "NG", "ZA"] as const;

const CARD_ACCENTS = [
  "from-emerald-50 to-white border-emerald-200/80 text-emerald-800",
  "from-violet-50 to-white border-violet-200/80 text-violet-800",
  "from-amber-50 to-white border-amber-200/80 text-amber-900",
  "from-sky-50 to-white border-sky-200/80 text-sky-900",
] as const;

const ICON_ACCENTS = [
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
] as const;

function AfricaCard({
  icon: Icon,
  label,
  accent,
  iconAccent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  accent: string;
  iconAccent: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-br p-3 text-center shadow-sm ${accent}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconAccent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[11px] font-extrabold leading-snug text-[color:var(--fd-text)]">{label}</p>
    </div>
  );
}

export async function LandingAfricaVisual() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const seo = homeSeoCopy(locale);

  const cards = [
    { icon: IconWallet, label: d.landing_africa_card_1 },
    { icon: IconP2P, label: d.landing_africa_card_2 },
    { icon: IconStaking, label: d.landing_africa_card_3 },
    { icon: IconKyc, label: d.landing_africa_card_4 },
  ];

  return (
    <section
      id="africa"
      className="scroll-mt-24 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 sm:p-6"
      aria-labelledby="africa-h"
    >
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative mx-auto w-full max-w-[240px]">
          <AfricaContinentSvg className="h-auto w-full" />
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
            <AfricaLogoBadge className="h-[4.5rem] w-[4.5rem]" />
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {AFRICA_REGION_CODES.map((code, i) => (
              <span
                key={code}
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold shadow-sm ring-1 ${
                  i % 2 === 0
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                    : "bg-sky-50 text-sky-900 ring-sky-200/80"
                }`}
              >
                {code}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            {d.landing_presentation_eyebrow}
          </p>
          <h2
            id="africa-h"
            className="mt-2 text-balance text-lg font-black leading-snug text-[color:var(--fd-text)] sm:text-xl"
          >
            {seo.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
            {d.landing_africa_intro}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {cards.map((c, i) => (
              <AfricaCard
                key={c.label}
                icon={c.icon}
                label={c.label}
                accent={CARD_ACCENTS[i] ?? CARD_ACCENTS[0]}
                iconAccent={ICON_ACCENTS[i] ?? ICON_ACCENTS[0]}
              />
            ))}
          </div>
          <Link
            href="/about"
            prefetch={false}
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[color:var(--fd-primary)] hover:opacity-80"
          >
            {d.landing_africa_more}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
