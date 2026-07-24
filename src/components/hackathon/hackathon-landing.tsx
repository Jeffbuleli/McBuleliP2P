"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeaturedHackathonPayload } from "@/lib/hackathon/service";
import { challengeCategories, HACKATHON_LEGAL } from "@/lib/hackathon/landing-copy";
import { HACKATHON_PRICE_USD } from "@/lib/hackathon/constants";
import {
  aboutBlurb,
  crossCuttingActivities,
  defaultHeroStats,
  eventDateLabel,
  HACKATHON_EVENT_DAYS,
  HACKATHON_EVENT_YEAR,
  HACKATHON_HOURS_LABEL_EN,
  HACKATHON_HOURS_LABEL_FR,
  HACKATHON_NAV,
  HACKATHON_SCHEDULE_SUMMARY,
  HACKATHON_VENUE_SHORT,
  hackathonFaqNav,
  hackathonProgramDays,
  partnerBenefits,
  PAWAPAY_PARTNER,
  BINANCE_PARTNER,
  ILOKWE_PARTNER,
  SILIKIN_PARTNER,
  hackathonFeaturedPartners,
  hackathonFeaturedSponsors,
  hackathonFeaturedJury,
  podiumPrizes,
  sponsorTiers,
} from "@/lib/hackathon/event-content";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_WA_PATH,
  SUPPORT_X,
} from "@/lib/support-contact";
import { PORTRAIT_PATH } from "@/lib/launch-campaign";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import { BUILDERS_TIER_VISUAL } from "@/lib/builders/builders-visual";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { HackathonCountdown } from "@/components/hackathon/hackathon-countdown";
import { HackathonParticipantForm } from "@/components/hackathon/hackathon-participant-form";
import { HackathonPartnerForm } from "@/components/hackathon/hackathon-partner-form";
import { HackathonSponsorForm } from "@/components/hackathon/hackathon-sponsor-form";
import { HackathonStickyNav } from "@/components/hackathon/hackathon-sticky-nav";
import { HackathonLogo } from "@/components/hackathon/hackathon-logo";
import {
  BenefitIcon,
  BulletIcon,
  CheckIcon,
  PrizeIcon,
} from "@/components/hackathon/event-icons";
import { ProgramIcon } from "@/components/hackathon/program-icon";
import { useI18n } from "@/components/i18n-provider";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

function isPlaceholderVenue(venue: string | null | undefined) {
  if (!venue?.trim()) return true;
  const v = venue.trim().toLowerCase();
  return v.includes("confirmer") || v.includes("tbd") || v.includes("tba") || v.includes("à définir");
}

function practicalVenue(venue: string | null, city: string) {
  if (isPlaceholderVenue(venue)) {
    return `Silikin Village - ${city || "Kinshasa"}`;
  }
  return [venue, city].filter(Boolean).join(" - ");
}

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const solidBand = /\bbg-/.test(className);
  return (
    <section id={id} className={`relative z-10 scroll-mt-28 py-12 sm:py-16 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Opaque plate so dots never cut through headings */}
        <div
          className={
            solidBand
              ? "max-w-3xl"
              : "max-w-3xl rounded-2xl bg-[#FAFAF8] px-3 py-2 sm:px-3.5 sm:py-2.5"
          }
        >
          {eyebrow ? (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1F6B43]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#222222] sm:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-base leading-relaxed text-[#8A8A8A]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="relative z-10 mt-8">{children}</div>
      </div>
    </section>
  );
}

function CtaPrimary({
  href,
  children,
  onDark,
}: {
  href: string;
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        onDark
          ? "inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--fd-primary)] shadow-sm transition hover:bg-[color:var(--fd-mint)]"
          : "inline-flex min-h-11 items-center justify-center rounded-xl bg-[color:var(--fd-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--fd-primary-dark)]"
      }
    >
      {children}
    </a>
  );
}

function CtaSecondary({
  href,
  children,
  onDark,
}: {
  href: string;
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        onDark
          ? "inline-flex min-h-11 items-center justify-center rounded-xl border border-white/55 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          : "inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--fd-text)] transition hover:bg-[color:var(--fd-mint)]"
      }
    >
      {children}
    </a>
  );
}

type PersonCard = FeaturedHackathonPayload["jury"][number] & {
  href?: string;
  photoFit?: "cover" | "contain";
};

function enrichMentors(people: FeaturedHackathonPayload["mentors"]): PersonCard[] {
  return people.map((p) => {
    if (/vibe\s*coding/i.test(p.name) || /mentor vibe/i.test(p.name) || /jeff/i.test(p.name)) {
      return {
        ...p,
        name: "Jeff Buleli - CEO",
        title: "Full Stack Dev. & Entrepreneur",
        company: null,
        expertise: "Cursor · Claude · Codex",
        photoUrl: PORTRAIT_PATH,
        photoFit: "cover",
        href: "https://mcbuleli.org/@ceo",
      };
    }
    return p;
  });
}

function enrichJury(
  people: FeaturedHackathonPayload["jury"],
  isFr: boolean,
): PersonCard[] {
  const mapped: PersonCard[] = people.map((p) => {
    if (/jury\s*mcbuleli/i.test(p.name) || /^mcbuleli$/i.test(p.name)) {
      return {
        ...p,
        name: "Jury McBuleli",
        photoUrl: BRAND_LOGO_256,
        photoFit: "contain" as const,
      };
    }
    if (/expert\s*innovation/i.test(p.name)) {
      return {
        ...p,
        name: "Expert Innovation",
        company: null,
        title: isFr ? "Jury - À annoncer" : "Jury - TBA",
        expertise: "Startups · Impact",
        photoUrl: null,
        photoFit: "cover" as const,
      };
    }
    return { ...p };
  });

  for (const j of hackathonFeaturedJury()) {
    const already = mapped.some((p) => {
      if (p.id === j.id) return true;
      if (/ilokwe|ikwele/i.test(j.name) || /ilokwe/i.test(j.company ?? "")) {
        return /ilokwe|ikwele/i.test(p.name) || /ilokwe/i.test(p.company ?? "");
      }
      if (/expert\s*innovation/i.test(j.name)) {
        return /expert\s*innovation/i.test(p.name);
      }
      return false;
    });
    if (already) continue;
    mapped.push({
      id: j.id,
      name: j.name,
      company: j.company,
      title: isFr ? j.titleFr : j.titleEn,
      expertise: isFr ? j.expertiseFr : j.expertiseEn,
      photoUrl: j.photoUrl,
      photoFit: "cover",
      href: j.href ?? undefined,
    });
  }

  return mapped;
}

function PersonGrid({
  people,
  empty,
  slots = 3,
}: {
  people: PersonCard[];
  empty: string;
  slots?: number;
}) {
  const placeholders = Math.max(0, slots - people.length);
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {people.map((p) => {
        const inner = (
          <>
            <div
              className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ${
                p.photoFit === "contain" ? "ring-1 ring-[color:var(--fd-primary)]/15" : ""
              }`}
            >
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photoUrl}
                  alt=""
                  className={
                    p.photoFit === "contain"
                      ? "h-full w-full object-contain p-1"
                      : "h-full w-full object-cover object-top"
                  }
                />
              ) : (
                p.name.replace(/^Mr\.?\s+/i, "").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-sm font-semibold leading-snug text-[color:var(--fd-text)] sm:text-base">
                {p.name}
              </h3>
              {p.title ? (
                <p className="mt-0.5 break-words text-xs leading-snug text-[color:var(--fd-primary)]">
                  {p.title}
                </p>
              ) : null}
              {p.company ? (
                <p className="mt-0.5 break-words text-xs leading-snug font-medium text-[color:var(--fd-text)]">
                  {p.company}
                </p>
              ) : null}
              {p.expertise ? (
                <p className="mt-0.5 break-words text-[11px] leading-snug text-[color:var(--fd-muted)]">
                  {p.expertise}
                </p>
              ) : null}
            </div>
          </>
        );
        const cls =
          "flex items-start gap-3 rounded-2xl border border-[#E5E5E0] bg-white p-3 shadow-[0_10px_28px_-16px_rgba(34,34,34,0.22)] sm:p-3.5";
        return (
          <li key={p.id} className="min-w-0">
            {p.href?.startsWith("http") ? (
              <a href={p.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : p.href ? (
              <Link href={p.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
      {Array.from({ length: placeholders }).map((_, i) => (
        <li
          key={`ph-${i}`}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-dashed border-[color:var(--fd-border)] p-3 text-sm text-[color:var(--fd-muted)]"
        >
          + {empty}
        </li>
      ))}
    </ul>
  );
}

export function HackathonLanding({ data }: { data: FeaturedHackathonPayload }) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const e = data.edition;
  const open = e.status === "open";
  const year = HACKATHON_EVENT_YEAR;

  const challenges = challengeCategories(isFr);
  const programDays = hackathonProgramDays();
  const prizes = podiumPrizes(isFr);
  const benefits = partnerBenefits(isFr);
  const faq = hackathonFaqNav(isFr);
  const about = aboutBlurb(isFr);
  const crossCut = crossCuttingActivities(isFr);
  const tiers = sponsorTiers();
  const featuredPartners = hackathonFeaturedPartners();
  const featuredSponsors = hackathonFeaturedSponsors();
  const stats = defaultHeroStats(
    data.mentors.length,
    data.partnerLogos.length + featuredPartners.length,
  );

  const confirmedPacks = new Set([
    ...data.sponsorLogos.map((s) => s.pack.toLowerCase()).filter((p) => p !== "custom"),
    ...featuredSponsors.map((s) => s.pack),
  ]);

  const [formsOpen, setFormsOpen] = useState<string | null>("participant");
  const [ecosystemOpen, setEcosystemOpen] = useState<string | null>(null);
  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h === "register") setFormsOpen("participant");
      else if (h === "partenaires-form") setFormsOpen("partner-form");
      else if (h === "sponsor-form" || h === "sponsors") setFormsOpen("sponsor-form");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const statItems = [
    {
      label: isFr ? "Équipes attendues" : "Expected teams",
      value: String(stats.teamsExpected),
    },
    {
      label: isFr ? "Mentors" : "Mentors",
      value: isFr ? stats.mentorsLabelFr : stats.mentorsLabelEn,
    },
    {
      label: isFr ? "Partenaires" : "Partners",
      value: isFr ? stats.partnersLabelFr : stats.partnersLabelEn,
    },
    {
      label: isFr ? "Prix à gagner" : "Prizes to win",
      value: isFr ? stats.prizesCountFr : stats.prizesCountEn,
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#FAFAF8] pb-24 text-[#222222] sm:pb-10">
      <HackathonAtmosphere variant="page" />
      {/* Hero */}
      <header className="relative z-10 min-h-[min(72vh,640px)] overflow-hidden border-b border-[color:var(--fd-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hackathon/kinshasa-skyline.jpg"
          alt={isFr ? "Kinshasa" : "Kinshasa"}
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(12, 28, 18, 0.9) 0%, rgba(18, 42, 28, 0.75) 50%, rgba(12, 28, 18, 0.55) 100%)",
          }}
        />
        <div className="absolute right-3 top-1.5 z-20 sm:right-6 sm:top-2">
          <HackathonCountdown isFr={isFr} onDark bare />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-10 pt-14 sm:px-6 sm:pb-14 sm:pt-20 lg:min-h-[min(72vh,640px)] lg:justify-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-3 rounded-2xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur-sm">
              <HackathonLogo className="h-14 w-12 sm:h-16 sm:w-14" />
              <span className="pr-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/90">
                McBuleli Hackathon
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--fd-mint)]">
              McBuleli Hackathon - {HACKATHON_EVENT_DAYS} {isFr ? "Jours" : "Days"} - {HACKATHON_EVENT_YEAR}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Build the Future with AI
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
              {isFr
                ? "Bootcamp Vibe Coding avec Cursor, Claude et Codex - hackathon et Demo Day au Silikin Village, Kinshasa."
                : "Vibe Coding bootcamp with Cursor, Claude and Codex - hackathon and Demo Day at Silikin Village, Kinshasa."}
            </p>
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <div>
                <dt className="sr-only">{isFr ? "Date" : "Date"}</dt>
                <dd>
                  {eventDateLabel(e.startDate, isFr)} ·{" "}
                  {isFr ? HACKATHON_HOURS_LABEL_FR : HACKATHON_HOURS_LABEL_EN}
                </dd>
              </div>
              <div>
                <dt className="sr-only">{isFr ? "Ville" : "City"}</dt>
                <dd>{practicalVenue(e.venue, e.city) || HACKATHON_VENUE_SHORT}</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-2 sm:gap-3">
              <CtaPrimary href="#register" onDark>
                {isFr ? `Participer · ${HACKATHON_PRICE_USD} USD` : `Join · ${HACKATHON_PRICE_USD} USD`}
              </CtaPrimary>
              <CtaSecondary href="#programme" onDark>
                {isFr ? "Voir le programme" : "See the program"}
              </CtaSecondary>
              <CtaSecondary href="/hackathon/ambassadeur" onDark>
                {isFr ? "Ambassadeur" : "Ambassador"}
              </CtaSecondary>
            </div>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <div className="relative z-10 border-b border-[#E5E5E0] bg-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-[#E5E5E0] sm:grid-cols-4">
          {statItems.map((s) => (
            <div key={s.label} className="bg-white px-3 py-5 text-center sm:px-6">
              <dt className="break-words text-[10px] font-extrabold uppercase leading-snug tracking-[0.14em] text-[#8A8A8A]">
                {s.label}
              </dt>
              <dd className="mt-1 text-2xl font-black tabular-nums tracking-tight text-[#1F6B43]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <HackathonStickyNav items={HACKATHON_NAV} isFr={isFr} />

      {/* Défis */}
      <Section
        id="defis"
        eyebrow={isFr ? "Défis" : "Challenges"}
        title={isFr ? "Choisissez votre impact" : "Pick your impact"}
      >
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {challenges.map((c) => (
            <li key={c.id} className="min-w-0">
              <Card className="h-full rounded-[22px] border-[#E5E5E0] shadow-[0_14px_44px_-28px_rgba(34,34,34,0.28)] transition hover:border-[#1F6B43]/35">
                <CardTitle className="break-words">{c.label}</CardTitle>
                <CardDescription className="break-words">{c.blurb}</CardDescription>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* Prix */}
      <Section
        id="prix"
        className="bg-white"
        eyebrow={isFr ? "Prix" : "Prizes"}
        title={isFr ? "Récompenses & reconnaissance" : "Rewards & recognition"}
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prizes.map((p) => {
            const isFirst = p.id === "first";
            return (
              <li key={p.id}>
                <Card
                  className={`rounded-[22px] border-[#E5E5E0] shadow-[0_14px_44px_-28px_rgba(34,34,34,0.28)] ${
                    isFirst ? "ring-1 ring-[#d4a017]/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#1F6B43]">
                      <PrizeIcon id={p.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="mt-0 break-words">
                        {isFr ? p.titleFr : p.titleEn}
                      </CardTitle>
                      <CardDescription className="break-words">
                        {isFr ? p.bodyFr : p.bodyEn}
                      </CardDescription>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Programme */}
      <Section
        id="programme"
        eyebrow={isFr ? "Programme" : "Program"}
        title={
          isFr
            ? `2 Journées · ${HACKATHON_HOURS_LABEL_FR}`
            : `2 days · ${HACKATHON_HOURS_LABEL_EN}`
        }
        subtitle={
          isFr
            ? `Dates confirmées · ${HACKATHON_VENUE_SHORT}`
            : `Confirmed dates · ${HACKATHON_VENUE_SHORT}`
        }
      >
        <ul className="mb-6 grid gap-3 sm:grid-cols-2">
          {HACKATHON_SCHEDULE_SUMMARY.map((day, i) => (
            <li
              key={day.dateFr}
              className="relative overflow-hidden rounded-[22px] border border-[#E5E5E0] bg-white px-5 py-5 shadow-[0_14px_44px_-28px_rgba(34,34,34,0.28)]"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1F6B43]">
                {isFr ? `Jour ${i + 1}` : `Day ${i + 1}`}
              </p>
              <p className="mt-2 text-xl font-black tracking-tight text-[#222222]">
                {isFr ? day.weekdayFr : day.weekdayEn}
              </p>
              <p className="mt-1 text-sm text-[#8A8A8A]">
                {isFr ? day.dateFr : day.dateEn}
              </p>
              <p className="mt-3 text-sm font-extrabold tabular-nums text-[#222222]">
                {isFr ? day.hoursFr : day.hoursEn}
              </p>
              <p className="mt-1 text-sm text-[#8A8A8A]">
                {isFr ? day.focusFr : day.focusEn}
              </p>
            </li>
          ))}
        </ul>
        <Accordion defaultOpen="day-1">
          {programDays.map((day) => (
            <AccordionItem
              key={day.day}
              id={`day-${day.day}`}
              title={isFr ? day.labelFr : day.labelEn}
              subtitle={isFr ? day.subtitleFr : day.subtitleEn}
              icon={<span className="text-sm font-extrabold">{day.day}</span>}
            >
              <ul className="space-y-2">
                {day.slots.map((slot) => (
                  <li
                    key={`${day.day}-${slot.time}-${slot.icon}`}
                    className="flex gap-3 rounded-xl bg-[#FAFAF8] px-3 py-2.5"
                  >
                    <span className="mt-0.5 text-[#1F6B43]">
                      <ProgramIcon id={slot.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold tabular-nums text-[#1F6B43]">
                        {slot.time}
                      </p>
                      <p className="mt-0.5 text-sm text-[#222222]">
                        {isFr ? slot.activityFr : slot.activityEn}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8A8A8A]">
            {isFr ? "Activités transversales" : "Cross-cutting activities"}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {crossCut.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#8A8A8A]">
                <BulletIcon className="h-3 w-3 shrink-0 text-[#1F6B43]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* À propos — mentors/jury pliés */}
      <Section
        id="about"
        className="bg-white"
        eyebrow={isFr ? "À propos" : "About"}
        title={about.title}
        subtitle={about.body}
      >
        <Accordion>
          <AccordionItem
            id="mentors"
            title={isFr ? "Mentors" : "Mentors"}
            subtitle={isFr ? "Accompagnement tech & business" : "Tech & business support"}
          >
            <PersonGrid
              people={enrichMentors(data.mentors)}
              empty={isFr ? "Mentor à annoncer" : "Mentor TBA"}
              slots={3}
            />
          </AccordionItem>
          <AccordionItem
            id="jury"
            title={isFr ? "Jury" : "Jury"}
            subtitle={isFr ? "Évaluation Demo Day" : "Demo Day evaluation"}
          >
            <PersonGrid
              people={enrichJury(data.jury, isFr)}
              empty={isFr ? "Jury à annoncer" : "Jury TBA"}
              slots={3}
            />
          </AccordionItem>
        </Accordion>
      </Section>

      {/* Inscription — formulaires pliés */}
      <Section
        id="register"
        eyebrow={isFr ? "Rejoindre" : "Join"}
        title={isFr ? "Inscrivez-vous maintenant" : "Register now"}
        subtitle={
          isFr
            ? `Programme complet ${HACKATHON_PRICE_USD} USD · pré-inscription gratuite, place réservée.`
            : `Full program ${HACKATHON_PRICE_USD} USD · free pre-registration, seat held.`
        }
      >
        <Accordion open={formsOpen} onOpenChange={setFormsOpen}>
          <AccordionItem
            id="participant"
            title={isFr ? "Participer" : "Join as participant"}
            subtitle={
              isFr
                ? `Formulaire participant · ${HACKATHON_PRICE_USD} USD`
                : `Participant form · ${HACKATHON_PRICE_USD} USD`
            }
          >
            <div className="mx-auto max-w-2xl">
              <HackathonParticipantForm
                editionId={e.id}
                locale={locale}
                priceUsd={HACKATHON_PRICE_USD}
                registrationOpen={open}
              />
            </div>
          </AccordionItem>
          <AccordionItem
            id="partner-form"
            title={isFr ? "Devenir partenaire" : "Become a partner"}
            subtitle={
              isFr
                ? "Collaboration sur mesure (atelier, mentorat, jury…)"
                : "Tailored collaboration (workshop, mentoring, jury…)"
            }
          >
            <div id="partenaires-form" className="scroll-mt-28">
              <HackathonPartnerForm editionId={e.id} locale={locale} />
            </div>
          </AccordionItem>
          <AccordionItem
            id="sponsor-form"
            title={isFr ? "Devenir sponsor" : "Become a sponsor"}
            subtitle={
              isFr
                ? "Niveaux Bronze à Platine · visibilité événement"
                : "Bronze to Platinum tiers · event visibility"
            }
          >
            <div id="sponsor-form" className="scroll-mt-28">
              <HackathonSponsorForm editionId={e.id} locale={locale} />
            </div>
          </AccordionItem>
          <AccordionItem
            id="ambassador"
            title={isFr ? "Ambassadeur" : "Ambassador"}
            subtitle={
              isFr
                ? "Code promo, -10% et cashback pour vos inscrits"
                : "Promo code, -10% and cashback for your signups"
            }
          >
            <p className="text-sm leading-relaxed text-[#8A8A8A]">
              {isFr
                ? "Crée ton code ambassadeur, partage ton lien et suis les inscriptions confirmées."
                : "Create your ambassador code, share your link and track confirmed signups."}
            </p>
            <div className="mt-4">
              <CtaPrimary href="/hackathon/ambassadeur">
                {isFr ? "Espace ambassadeur" : "Ambassador space"}
              </CtaPrimary>
            </div>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* Écosystème — logos visibles, détails pliés */}
      <Section
        id="partenaires"
        className="bg-white"
        eyebrow={isFr ? "Écosystème" : "Ecosystem"}
        title={isFr ? "Ils accompagnent les builders" : "They back the builders"}
        subtitle={
          isFr
            ? "Preuve de sérieux pour les candidats · détails en un clic."
            : "Credibility for candidates · details one click away."
        }
      >
        {(() => {
          const featuredIds = new Set(featuredPartners.map((p) => p.name.toLowerCase()));
          const existing = data.partnerLogos.filter(
            (p) =>
              !featuredIds.has(p.name.toLowerCase()) &&
              !/pawapay|binance|ilokwe|silikin|rdpi/i.test(p.name) &&
              !/^mcbuleli$/i.test(p.name.trim()),
          );
          const logoSlots = Math.max(6, featuredPartners.length + existing.length);
          const logos = [
            ...featuredPartners.map((p) => ({
              id: p.id,
              name: p.name,
              logoUrl: p.logoUrl as string | null,
              website: p.href as string | null,
              tileBgClass: p.tileBgClass,
              fit: p.fit,
              placeholder: false as boolean,
            })),
            ...existing.map((p) => ({
              id: p.id,
              name: p.name,
              logoUrl: p.logoUrl,
              website: p.website,
              tileBgClass: "bg-white",
              fit: "contain" as const,
              placeholder: false as boolean,
            })),
            ...Array.from(
              { length: Math.max(0, logoSlots - featuredPartners.length - existing.length) },
              (_, i) => ({
                id: `partner-slot-${i}`,
                name: isFr ? "Logo partenaire" : "Partner logo",
                logoUrl: null as string | null,
                website: null as string | null,
                tileBgClass: "bg-[#FAFAF8]",
                fit: "contain" as const,
                placeholder: true,
              }),
            ),
          ];
          return (
            <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {logos.map((p) => {
                const cover = p.fit === "cover";
                const silikin = p.id === "silikin";
                const inner = p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.logoUrl}
                    alt={p.name}
                    className={
                      cover
                        ? "h-full w-full object-cover object-center"
                        : silikin
                          ? "h-[90%] w-[94%] object-contain object-center"
                          : "max-h-10 max-w-full object-contain object-center"
                    }
                  />
                ) : (
                  <span className="text-center text-[11px] font-medium text-[#8A8A8A]">
                    {p.name}
                  </span>
                );
                const cls = `flex h-16 items-center justify-center overflow-hidden rounded-xl border border-[#E5E5E0] shadow-[0_10px_28px_-14px_rgba(34,34,34,0.28)] ${
                  cover || silikin || p.placeholder ? "p-0" : "px-3"
                } ${p.tileBgClass} ${p.placeholder ? "border-dashed" : ""}`;
                return (
                  <li key={p.id}>
                    {p.website ? (
                      <a href={p.website} target="_blank" rel="noopener noreferrer" className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          );
        })()}

        {(featuredSponsors.length > 0 || data.sponsorLogos.length > 0) && (
          <ul className="mb-6 flex flex-wrap gap-3">
            {featuredSponsors.map((s) => {
              const v = BUILDERS_TIER_VISUAL[s.pack] ?? BUILDERS_TIER_VISUAL.bronze;
              return (
                <li key={s.id}>
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex min-h-16 min-w-[10rem] max-w-full flex-col items-center justify-center gap-1 rounded-xl border border-[#E5E5E0] px-4 py-2 shadow-[0_10px_28px_-14px_rgba(34,34,34,0.28)] ${v.badgeClass}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      className="h-8 w-auto max-w-[120px] rounded-md object-cover"
                    />
                    <span className="max-w-[10rem] break-words text-center text-[10px] font-extrabold uppercase leading-snug tracking-wide">
                      {isFr ? s.roleFr : s.roleEn}
                    </span>
                  </a>
                </li>
              );
            })}
            {data.sponsorLogos
              .filter((s) => !/ilokwe/i.test(s.name))
              .map((s) => {
                const v = BUILDERS_TIER_VISUAL[s.pack] ?? BUILDERS_TIER_VISUAL.bronze;
                return (
                  <li
                    key={s.id}
                    className={`flex h-16 min-w-[8rem] flex-col items-center justify-center rounded-xl border border-[#E5E5E0] px-4 shadow-[0_10px_28px_-14px_rgba(34,34,34,0.28)] ${v.badgeClass}`}
                  >
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt={s.name} className="max-h-7 max-w-[100px]" />
                    ) : (
                      <span className="text-sm font-semibold">{s.name}</span>
                    )}
                  </li>
                );
              })}
          </ul>
        )}

        <Accordion open={ecosystemOpen} onOpenChange={setEcosystemOpen}>
          <AccordionItem
            id="partner-details"
            title={isFr ? "Détails partenaires" : "Partner details"}
            subtitle="pawaPay · Binance · ILOKWE · Silikin"
          >
            <div className="space-y-4">
              {[
                {
                  href: PAWAPAY_PARTNER.website,
                  logo: PAWAPAY_PARTNER.logoUrl,
                  alt: PAWAPAY_PARTNER.name,
                  tile: "bg-[#F7F7F7]",
                  role: isFr ? PAWAPAY_PARTNER.roleFr : PAWAPAY_PARTNER.roleEn,
                  name: PAWAPAY_PARTNER.name,
                  body: isFr ? PAWAPAY_PARTNER.blurbFr : PAWAPAY_PARTNER.blurbEn,
                  meta: "pawapay.io · docs.pawapay.io",
                  cover: false,
                  silikin: false,
                },
                {
                  href: BINANCE_PARTNER.demo,
                  logo: BINANCE_PARTNER.logoUrl,
                  alt: BINANCE_PARTNER.name,
                  tile: "bg-[#12161D]",
                  role: isFr ? BINANCE_PARTNER.roleFr : BINANCE_PARTNER.roleEn,
                  name: BINANCE_PARTNER.name,
                  body: isFr ? BINANCE_PARTNER.blurbFr : BINANCE_PARTNER.blurbEn,
                  meta: "demo.binance.com · developers.binance.com",
                  cover: false,
                  silikin: false,
                },
                {
                  href: ILOKWE_PARTNER.facebook,
                  logo: ILOKWE_PARTNER.logoUrl,
                  alt: ILOKWE_PARTNER.name,
                  tile: "bg-[#0B3D2E]",
                  role: isFr ? ILOKWE_PARTNER.roleFr : ILOKWE_PARTNER.roleEn,
                  name: ILOKWE_PARTNER.name,
                  body: isFr ? ILOKWE_PARTNER.blurbFr : ILOKWE_PARTNER.blurbEn,
                  meta: "Facebook · Prix ILOKWE · Sponsor Or · Jury",
                  cover: true,
                  silikin: false,
                },
                {
                  href: SILIKIN_PARTNER.website,
                  logo: SILIKIN_PARTNER.logoUrl,
                  alt: SILIKIN_PARTNER.name,
                  tile: "bg-[#000000]",
                  role: isFr ? SILIKIN_PARTNER.roleFr : SILIKIN_PARTNER.roleEn,
                  name: SILIKIN_PARTNER.name,
                  body: isFr ? SILIKIN_PARTNER.blurbFr : SILIKIN_PARTNER.blurbEn,
                  meta: "silikinvillage.com · by TEXAF Digital",
                  cover: false,
                  silikin: true,
                },
              ].map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-[22px] border border-[#E5E5E0] bg-white p-4 shadow-[0_14px_44px_-28px_rgba(34,34,34,0.28)] transition hover:border-[#1F6B43]/35 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span
                      className={`inline-flex h-14 w-full max-w-[10rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E5E0] shadow-[0_8px_22px_-12px_rgba(34,34,34,0.35)] ${p.tile} ${p.cover || p.silikin ? "p-0" : "p-2"} sm:w-40`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.logo}
                        alt={p.alt}
                        className={
                          p.cover
                            ? "h-full w-full object-cover object-center"
                            : p.silikin
                              ? "h-[92%] w-[96%] object-contain object-center"
                              : "max-h-full max-w-full object-contain object-center"
                        }
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1F6B43]">
                        {p.role}
                      </p>
                      <p className="mt-1 break-words text-base font-extrabold text-[#222222]">
                        {p.name}
                      </p>
                      <p className="mt-1 break-words text-sm leading-relaxed text-[#8A8A8A]">
                        {p.body}
                      </p>
                      <p className="mt-2 break-words text-xs font-extrabold text-[#1F6B43]">
                        {p.meta}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </AccordionItem>
          <AccordionItem
            id="partner-benefits"
            title={isFr ? "Pourquoi devenir partenaire ?" : "Why become a partner?"}
            subtitle={isFr ? "Valeur pour votre organisation" : "Value for your organization"}
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b.id} className="min-w-0">
                  <div className="flex items-start gap-3 rounded-[18px] border border-[#E5E5E0] bg-white p-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#1F6B43]">
                      <BenefitIcon id={b.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[#222222]">
                        {isFr ? b.titleFr : b.titleEn}
                      </p>
                      <p className="mt-1 text-sm text-[#8A8A8A]">
                        {isFr ? b.bodyFr : b.bodyEn}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <a
                href="#register"
                onClick={() => setFormsOpen("partner-form")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1F6B43] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-95"
              >
                {isFr ? "Ouvrir le formulaire partenaire" : "Open partner form"}
              </a>
            </div>
          </AccordionItem>
          <AccordionItem
            id="sponsor-tiers"
            title={isFr ? "Niveaux sponsors" : "Sponsor tiers"}
            subtitle={isFr ? "Bronze à Platine" : "Bronze to Platinum"}
          >
            <ul className="grid gap-3 lg:grid-cols-2">
              {tiers.map((tier) => {
                const v = BUILDERS_TIER_VISUAL[tier.id];
                const confirmed = confirmedPacks.has(tier.id);
                const perks = isFr ? tier.perksFr : tier.perksEn;
                return (
                  <li key={tier.id}>
                    <Card
                      className={`h-full rounded-[22px] border-[#E5E5E0] shadow-[0_14px_44px_-28px_rgba(34,34,34,0.28)] ${v?.badgeClass ?? ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle>{isFr ? tier.labelFr : tier.labelEn}</CardTitle>
                        <Badge variant={confirmed ? "success" : "muted"}>
                          {confirmed
                            ? isFr
                              ? "Confirmé"
                              : "Confirmed"
                            : isFr
                              ? "Disponible"
                              : "Available"}
                        </Badge>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {perks.map((perk) => (
                          <li key={perk} className="flex items-center gap-2 text-sm opacity-90">
                            <CheckIcon className="h-4 w-4 shrink-0 text-[#1F6B43]" />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4">
              <a
                href="#register"
                onClick={() => setFormsOpen("sponsor-form")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1F6B43] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-95"
              >
                {isFr ? "Ouvrir le formulaire sponsor" : "Open sponsor form"}
              </a>
            </div>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="FAQ" title={isFr ? "Questions fréquentes" : "FAQ"}>
        <Accordion>
          {faq.map((item, i) => (
            <AccordionItem key={item.q} id={`faq-${i}`} title={item.q}>
              <p className="text-sm leading-relaxed text-[#8A8A8A]">{item.a}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* Contact */}
      <Section
        id="contact"
        className="bg-white"
        eyebrow={isFr ? "Contact" : "Contact"}
        title={isFr ? "Parler à l'équipe McBuleli" : "Talk to McBuleli"}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Email", href: `mailto:${SUPPORT_EMAIL}`, value: SUPPORT_EMAIL },
            {
              label: isFr ? "Téléphone" : "Phone",
              href: `tel:${SUPPORT_PHONE_DISPLAY.replace(/\s/g, "")}`,
              value: SUPPORT_PHONE_DISPLAY,
            },
            {
              label: "WhatsApp",
              href: SUPPORT_WA_PATH,
              value: isFr ? "Ouvrir le chat" : "Open chat",
            },
            { label: isFr ? "Site" : "Website", href: "https://mcbuleli.org", value: "mcbuleli.org" },
            { label: isFr ? "Réseaux" : "Social", href: SUPPORT_X, value: "@McBuleli" },
          ].map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="block"
            >
              <Card className="rounded-[22px] border-[#E5E5E0] shadow-[0_14px_44px_-28px_rgba(34,34,34,0.28)] transition hover:border-[#1F6B43]/35">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8A8A8A]">
                  {c.label}
                </p>
                <p className="mt-2 font-extrabold text-[#1F6B43]">{c.value}</p>
              </Card>
            </a>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="rounded-[28px] bg-[#1F6B43] px-6 py-10 text-center text-white shadow-[0_24px_64px_-30px_rgba(31,107,67,0.55)] sm:px-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            {isFr ? "Construisez votre futur avec l'IA." : "Build your future with AI."}
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#register"
              className="inline-flex min-h-11 items-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--fd-primary)]"
            >
              {isFr ? "Participer" : "Join"}
            </a>
            <a
              href="#register"
              onClick={() => setFormsOpen("sponsor-form")}
              className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-6 py-2.5 text-sm font-extrabold text-white"
            >
              {isFr ? "Devenir sponsor" : "Become a sponsor"}
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0c1c12] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold">{HACKATHON_LEGAL.legalName}</p>
            <p className="mt-2 text-sm text-white/65">{HACKATHON_LEGAL.address}</p>
            <p className="mt-3 text-xs text-white/50">
              RCCM : {HACKATHON_LEGAL.rccm}
              <br />
              ID Nat : {HACKATHON_LEGAL.idNat}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">{isFr ? "Contact" : "Contact"}</p>
            <ul className="mt-2 space-y-1 text-sm text-white/65">
              <li>
                <a className="hover:text-[color:var(--fd-mint)]" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li>{SUPPORT_PHONE_DISPLAY}</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">{isFr ? "Mentions légales" : "Legal"}</p>
            <ul className="mt-2 space-y-1 text-sm text-white/65">
              <li>
                <Link className="hover:text-[color:var(--fd-mint)]" href="/privacy">
                  {isFr ? "Confidentialité" : "Privacy"}
                </Link>
              </li>
              <li>
                <Link className="hover:text-[color:var(--fd-mint)]" href="/terms">
                  {isFr ? "Conditions" : "Terms"}
                </Link>
              </li>
              <li>
                <Link className="hover:text-[color:var(--fd-mint)]" href="/about">
                  {isFr ? "À propos" : "About"}
                </Link>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a href={SUPPORT_X} target="_blank" rel="noopener noreferrer" className="text-white/65 hover:text-[color:var(--fd-mint)]">
                X / Twitter
              </a>
              <a href={SUPPORT_WA_PATH} target="_blank" rel="noopener noreferrer" className="text-white/65 hover:text-[color:var(--fd-mint)]">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/50 sm:px-6">
          © {year} {HACKATHON_LEGAL.legalName}. {isFr ? "Tous droits réservés." : "All rights reserved."}
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--fd-border)] bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <a
            href="#register"
            className="flex flex-1 items-center justify-center rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-semibold text-white"
          >
            {isFr ? "Participer" : "Join"}
          </a>
          <a
            href="#partenaires"
            className="flex flex-1 items-center justify-center rounded-xl border border-[color:var(--fd-border)] py-3 text-sm font-semibold"
          >
            {isFr ? "Partenaire" : "Partner"}
          </a>
        </div>
      </div>
    </div>
  );
}
