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
  SANJA_PARTNER,
  KIMIA_PARTNER,
  RDPI_PARTNER,
  KILELO_PARTNER,
  hackathonFeaturedJury,
  hackathonFeaturedMentors,
  hackathonFeaturedPartners,
  hackathonFeaturedSponsors,
  hackathonPartnerDetails,
  podiumPrizes,
  sponsorTiers,
} from "@/lib/hackathon/event-content";
import {
  partnerLogoBorderless,
  partnerLogoTileStyles,
} from "@/lib/hackathon/partner-logo-display";
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
import { HackathonChatUnreadBadge } from "@/components/hackathon/hackathon-chat-unread-badge";
import { HackathonLogo } from "@/components/hackathon/hackathon-logo";
import { HackathonLandingJourney } from "@/components/hackathon/hackathon-phase-stepper";
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
              ? "max-w-3xl rounded-2xl bg-[color:var(--hk-surface)] px-3 py-2 sm:px-3.5 sm:py-2.5"
              : "max-w-3xl rounded-2xl bg-[color:var(--hk-page)] px-3 py-2 sm:px-3.5 sm:py-2.5"
          }
        >
          {eyebrow ? (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-base leading-relaxed text-[color:var(--hk-muted)]">
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
          ? "inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#1F6B43] shadow-sm transition hover:bg-[#EAF6EE]"
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
  badge,
}: {
  href: string;
  children: React.ReactNode;
  onDark?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={
        onDark
          ? "relative inline-flex min-h-11 items-center justify-center rounded-xl border border-white/55 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          : "relative inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--hk-surface)] px-6 py-2.5 text-sm font-semibold text-[color:var(--fd-text)] transition hover:bg-[color:var(--fd-mint)]"
      }
    >
      {children}
      {badge}
    </a>
  );
}

type PersonCard = FeaturedHackathonPayload["jury"][number] & {
  href?: string;
  photoFit?: "cover" | "contain";
  /** Brand tile fill for logo avatars (avoids white letterbox + visible borders). */
  photoBgClass?: string;
  photoScaleClass?: string;
};

function enrichMentors(
  people: FeaturedHackathonPayload["mentors"],
  isFr: boolean,
): PersonCard[] {
  const mapped: PersonCard[] = people.map((p) => {
    if (/vibe\s*coding/i.test(p.name) || /mentor vibe/i.test(p.name) || /jeff/i.test(p.name)) {
      return {
        ...p,
        name: "Jeff Buleli - CEO",
        title: "Full Stack Dev. & Entrepreneur",
        company: null,
        expertise: "Vibe Coding - Cursor · Claude · Codex",
        photoUrl: PORTRAIT_PATH,
        photoFit: "cover",
        href: "https://mcbuleli.org/@ceo",
      };
    }
    if (/kimia|mulopo/i.test(p.name) || /kimia/i.test(p.company ?? "")) {
      return {
        ...p,
        name: "Mr Mike Mulopo",
        company: "KIMIA Service",
        title: isFr ? "Mentor - Services & Talents" : "Mentor - Services & Talents",
        expertise: isFr
          ? "Employabilité, professionnalisation & mise en relation talents"
          : "Employability, professionalization & talent matching",
        photoUrl: KIMIA_PARTNER.logoUrl,
        photoFit: "cover",
        href: KIMIA_PARTNER.website,
      };
    }
    return p;
  });

  for (const m of hackathonFeaturedMentors()) {
    const already = mapped.some((p) => {
      if (p.id === m.id) return true;
      if (/kimia|mulopo/i.test(m.name) || /kimia/i.test(m.company ?? "")) {
        return /kimia|mulopo/i.test(p.name) || /kimia/i.test(p.company ?? "");
      }
      if (/kilelo|jeancy|kabangu/i.test(m.name) || /kilelo/i.test(m.company ?? "")) {
        return /kilelo|jeancy|kabangu/i.test(p.name) || /kilelo/i.test(p.company ?? "");
      }
      if (
        /ia\s*acad|kashara|rodrigue/i.test(m.name) ||
        /ia\s*acad/i.test(m.company ?? "")
      ) {
        return (
          /ia\s*acad|kashara|rodrigue/i.test(p.name) ||
          /ia\s*acad/i.test(p.company ?? "")
        );
      }
      if (
        /montana/i.test(m.name) ||
        /montana/i.test(m.company ?? "")
      ) {
        return /montana/i.test(p.name) || /montana/i.test(p.company ?? "");
      }
      return false;
    });
    if (already) continue;
    mapped.push({
      id: m.id,
      name: m.name,
      company: m.company,
      title: isFr ? m.titleFr : m.titleEn,
      expertise: isFr ? m.expertiseFr : m.expertiseEn,
      photoUrl: m.photoUrl,
      photoFit: m.photoFit ?? "cover",
      photoBgClass: m.photoBgClass,
      photoScaleClass: m.photoScaleClass,
      href: m.href ?? undefined,
    });
  }

  return mapped;
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
        expertise: "Startups - Impact",
        photoUrl: null,
        photoFit: "cover" as const,
      };
    }
    if (/aristote|rdpi|mugisho/i.test(p.name) || /rdpi/i.test(p.company ?? "")) {
      return {
        ...p,
        name: RDPI_PARTNER.contactName,
        company: RDPI_PARTNER.name,
        title: isFr ? "Jury - Policy & Impact" : "Jury - Policy & Impact",
        expertise: isFr
          ? "Politiques publiques, régulation & impact socio-économique"
          : "Public policy, regulation & socio-economic impact",
        photoUrl: RDPI_PARTNER.logoUrl,
        photoFit: "contain" as const,
        href: RDPI_PARTNER.website,
      };
    }
    if (/ilokwe|ikwele|christian/i.test(p.name) || /ilokwe/i.test(p.company ?? "")) {
      return {
        ...p,
        name: ILOKWE_PARTNER.contactName,
        company: ILOKWE_PARTNER.name,
        title: isFr ? "Jury - Agriculture & AgriBusiness" : "Jury - Agriculture & AgriBusiness",
        expertise: isFr ? "AgroTech - chaîne de valeur & Prix ILOKWE" : "AgroTech - value chain & ILOKWE Prize",
        photoUrl: ILOKWE_PARTNER.logoUrl,
        photoFit: "cover" as const,
        photoBgClass: "bg-[#2e5506]",
        href: ILOKWE_PARTNER.facebook,
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
      if (/aristote|rdpi|mugisho/i.test(j.name) || /rdpi/i.test(j.company ?? "")) {
        return /aristote|rdpi|mugisho/i.test(p.name) || /rdpi/i.test(p.company ?? "");
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
      photoFit: j.photoFit ?? "cover",
      photoBgClass: j.photoBgClass,
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
  const list = people ?? [];
  const placeholders = Math.max(0, slots - list.length);
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((p) => {
        const inner = (
          <>
            <div
              className={`mt-0.5 flex shrink-0 items-center justify-center overflow-hidden text-[color:var(--fd-primary)] ${
                p.photoFit === "contain"
                  ? "h-14 w-14 rounded-xl"
                  : "h-12 w-12 rounded-full"
              } ${
                p.photoBgClass ??
                (p.photoFit === "contain"
                  ? "bg-white ring-1 ring-[color:var(--fd-primary)]/15"
                  : "bg-[color:var(--fd-mint)]")
              }`}
            >
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photoUrl}
                  alt=""
                  className={
                    p.photoFit === "contain"
                      ? `h-full w-full object-contain object-center p-1 ${p.photoScaleClass ?? ""}`
                      : `h-full w-full object-cover object-center ${p.photoScaleClass ?? ""}`
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
          "flex items-start gap-3 rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-3 shadow-[0_10px_28px_-16px_var(--hk-shadow)] sm:p-3.5";
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
    data.mentors?.length ?? 0,
    (data.partnerLogos?.length ?? 0) + featuredPartners.length,
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
      if (h === "partenaires-form") setFormsOpen("partner-form");
      else if (h === "sponsor-form" || h === "sponsors") setFormsOpen("sponsor-form");
      else if (!h || h === "register") setFormsOpen("participant");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "");
    const hasPromo = new URLSearchParams(window.location.search).has("promo");
    const otherAnchor =
      h &&
      h !== "register" &&
      h !== "partenaires-form" &&
      h !== "sponsor-form" &&
      h !== "sponsors";
    // Promo links and bare /hackathon: privilege inscription (keep other deep-links intact).
    if (otherAnchor && !hasPromo) return;

    setFormsOpen("participant");
    if (!h || hasPromo) {
      const url = new URL(window.location.href);
      url.hash = "register";
      window.history.replaceState(null, "", `${url.pathname}${url.search}#register`);
    }
    const scrollToRegister = () => {
      document.getElementById("register")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };
    // Wait for layout (accordion + sticky nav) before scrolling.
    const t = window.setTimeout(scrollToRegister, 80);
    return () => window.clearTimeout(t);
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
    <div className="relative overflow-hidden bg-[color:var(--hk-page)] pb-24 text-[color:var(--hk-text)] sm:pb-10">
      <HackathonAtmosphere variant="page" />
      {/* Hero */}
      <header className="relative z-10 min-h-[min(48vh,420px)] overflow-hidden border-b border-[color:var(--fd-border)]">
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
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:min-h-[min(48vh,420px)] lg:justify-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-3 rounded-2xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur-sm">
              <HackathonLogo className="h-14 w-12 sm:h-16 sm:w-14" />
              <span className="pr-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/90">
                McBuleli Hackathon
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c8ebd0]">
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
              <CtaSecondary
                href="/hackathon/chat"
                onDark
                badge={<HackathonChatUnreadBadge className="ring-[#1F6B43]" />}
              >
                Chat
              </CtaSecondary>
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
      <div className="relative z-10 border-b border-[color:var(--hk-border)] bg-[color:var(--hk-surface)]">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-[color:var(--hk-border)] sm:grid-cols-4">
          {statItems.map((s) => (
            <div key={s.label} className="bg-[color:var(--hk-surface)] px-3 py-5 text-center sm:px-6">
              <dt className="break-words text-[10px] font-extrabold uppercase leading-snug tracking-[0.14em] text-[color:var(--hk-muted)]">
                {s.label}
              </dt>
              <dd className="mt-1 text-2xl font-black tabular-nums tracking-tight text-[color:var(--hk-accent)]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <HackathonStickyNav items={HACKATHON_NAV} isFr={isFr} />

      {/* Inscription en premier — priorité conversion (promo + page hackathon) */}
      <Section
        id="register"
        className="bg-[color:var(--hk-surface)]"
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
            <p className="text-sm leading-relaxed text-[color:var(--hk-muted)]">
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

      {/* Défis */}
      <Section
        id="defis"
        eyebrow={isFr ? "Défis" : "Challenges"}
        title={isFr ? "Choisissez votre impact" : "Pick your impact"}
      >
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {challenges.map((c) => (
            <li key={c.id} className="min-w-0">
              <Card className="h-full rounded-[22px] border-[color:var(--hk-border)] shadow-[0_14px_44px_-28px_var(--hk-shadow)] transition hover:border-[color:var(--hk-accent)]/35">
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
        className="bg-[color:var(--hk-surface)]"
        eyebrow={isFr ? "Prix" : "Prizes"}
        title={isFr ? "Récompenses & reconnaissance" : "Rewards & recognition"}
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prizes.map((p) => {
            const isFirst = p.id === "first";
            return (
              <li key={p.id}>
                <Card
                  className={`rounded-[22px] border-[color:var(--hk-border)] shadow-[0_14px_44px_-28px_var(--hk-shadow)] ${
                    isFirst ? "ring-1 ring-[#d4a017]/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--hk-soft)] text-[color:var(--hk-accent)]">
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
              className="relative overflow-hidden rounded-[22px] border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-5 py-5 shadow-[0_14px_44px_-28px_var(--hk-shadow)]"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
                {isFr ? `Jour ${i + 1}` : `Day ${i + 1}`}
              </p>
              <p className="mt-2 text-xl font-black tracking-tight text-[color:var(--hk-text)]">
                {isFr ? day.weekdayFr : day.weekdayEn}
              </p>
              <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
                {isFr ? day.dateFr : day.dateEn}
              </p>
              <p className="mt-3 text-sm font-extrabold tabular-nums text-[color:var(--hk-text)]">
                {isFr ? day.hoursFr : day.hoursEn}
              </p>
              <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
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
                    className="flex gap-3 rounded-xl bg-[color:var(--hk-soft)]/55 px-3 py-2.5 ring-1 ring-[color:var(--hk-border)]/60"
                  >
                    <span className="mt-0.5 text-[color:var(--hk-accent)]">
                      <ProgramIcon id={slot.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold tabular-nums text-[color:var(--hk-accent)]">
                        {slot.time}
                      </p>
                      <p className="mt-0.5 text-sm text-[color:var(--hk-text)]">
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
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-muted)]">
            {isFr ? "Activités transversales" : "Cross-cutting activities"}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {crossCut.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[color:var(--hk-muted)]">
                <BulletIcon className="h-3 w-3 shrink-0 text-[color:var(--hk-accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Parcours étape par étape + acteurs */}
      <Section
        id="parcours"
        eyebrow={isFr ? "Parcours" : "Journey"}
        title={
          isFr
            ? "Bootcamp → Équipes → Build → Mentorat → Pitch → Jury → Prix"
            : "Bootcamp → Teams → Build → Mentoring → Pitch → Jury → Awards"
        }
        subtitle={
          isFr
            ? "Chaque étape a ses acteurs. L'ordre est le fil conducteur de l'événement."
            : "Each step has its actors. This order is the spine of the event."
        }
      >
        <HackathonLandingJourney isFr={isFr} />
      </Section>

      {/* À propos - mentors/jury pliés */}
      <Section
        id="about"
        className="bg-[color:var(--hk-surface)]"
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
              people={enrichMentors(data.mentors ?? [], isFr)}
              empty={isFr ? "Mentor à annoncer" : "Mentor TBA"}
              slots={5}
            />
          </AccordionItem>
          <AccordionItem
            id="jury"
            title={isFr ? "Jury" : "Jury"}
            subtitle={isFr ? "Évaluation Demo Day" : "Demo Day evaluation"}
          >
            <PersonGrid
              people={enrichJury(data.jury ?? [], isFr)}
              empty={isFr ? "Jury à annoncer" : "Jury TBA"}
              slots={3}
            />
          </AccordionItem>
        </Accordion>
      </Section>

      {/* Écosystème - logos visibles, détails pliés */}
      <Section
        id="partenaires"
        className="bg-[color:var(--hk-surface)]"
        eyebrow={isFr ? "Écosystème" : "Ecosystem"}
        title={isFr ? "Ils accompagnent les builders" : "They back the builders"}
        subtitle={
          isFr
            ? "Preuve de sérieux pour les candidats · détails en un clic."
            : "Credibility for candidates · details one click away."
        }
      >
        <div className="mb-5">
          <a
            href="/hackathon/chat"
            className="relative inline-flex items-center gap-2 rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-4 py-2.5 text-sm font-bold text-[color:var(--hk-fg)] shadow-[0_10px_28px_-18px_var(--hk-shadow)] transition hover:border-[color:var(--fd-primary)] hover:text-[color:var(--fd-primary)]"
          >
            {isFr ? "Échange partenaires →" : "Partner exchange →"}
            <HackathonChatUnreadBadge />
          </a>
          <p className="mt-2 text-xs text-[color:var(--hk-muted)]">
            {isFr
              ? "Vue, roster et dialogue - connexion compte McBuleli (admin ou partenaire)."
              : "Overview, roster and dialogue - McBuleli account (admin or partner)."}
          </p>
        </div>
        {(() => {
          const featuredIds = new Set(featuredPartners.map((p) => p.name.toLowerCase()));
          const existing = data.partnerLogos.filter(
            (p) =>
              !featuredIds.has(p.name.toLowerCase()) &&
              !/pawapay|binance|ilokwe|silikin|kimia|rdpi|montana/i.test(p.name) &&
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
              shape: p.shape,
              imageScaleClass: p.imageScaleClass,
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
                tileBgClass: "bg-white/80",
                fit: "contain" as const,
                placeholder: true,
              }),
            ),
          ];
          return (
            <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {logos.map((p) => {
                const shape =
                  "shape" in p && p.shape ? p.shape : ("wide" as const);
                const imageScaleClass =
                  "imageScaleClass" in p ? p.imageScaleClass : undefined;
                const { tile, img } = partnerLogoTileStyles(
                  {
                    shape,
                    tileBgClass: p.tileBgClass,
                    imageScaleClass,
                    fit: "fit" in p ? p.fit : undefined,
                  },
                  "ecosystem",
                );
                const inner = p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt={p.name} className={img} />
                ) : (
                  <span className="text-center text-[11px] font-medium text-[color:var(--hk-muted)]">
                    {p.name}
                  </span>
                );
                const isCompact =
                  shape === "square-bleed" || shape === "round";
                const cls = `flex items-center justify-center overflow-hidden rounded-xl ${tile} ${p.tileBgClass} ${
                  p.placeholder ? "border-dashed border-[color:var(--hk-border)]" : ""
                }`;
                return (
                  <li
                    key={p.id}
                    className={`flex items-center ${
                      isCompact
                        ? "h-[5.5rem] justify-center sm:h-[6.25rem]"
                        : "h-16 justify-stretch"
                    }`}
                  >
                    {p.website ? (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cls}
                      >
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
              const isIlokwe = /ilokwe/i.test(s.name);
              return (
                <li key={s.id}>
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[3.25rem] min-w-[11rem] max-w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-3 py-2.5 shadow-[0_10px_28px_-14px_var(--hk-shadow)]"
                  >
                    {/* ILOKWE logo already in ecosystem grid — keep sponsor chip text-only. */}
                    {!isIlokwe ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="h-9 w-auto max-w-[130px] rounded-md object-contain"
                      />
                    ) : (
                      <span className="text-center text-sm font-extrabold leading-snug text-[color:var(--hk-text)]">
                        {s.name}
                      </span>
                    )}
                    <span
                      className={`max-w-[12rem] break-words rounded-full px-2 py-0.5 text-center text-[10px] font-extrabold uppercase leading-snug tracking-wide hk-tier-chip ${v.badgeClass}`}
                    >
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
                    className="flex h-16 min-w-[8rem] flex-col items-center justify-center gap-1 rounded-xl border border-[color:var(--hk-border)] bg-white px-4 shadow-[0_10px_28px_-14px_var(--hk-shadow)]"
                  >
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt={s.name} className="max-h-7 max-w-[100px]" />
                    ) : (
                      <span className="text-sm font-semibold text-[#222222]">{s.name}</span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide hk-tier-chip ${v.badgeClass}`}
                    >
                      {s.pack}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}

        <Accordion open={ecosystemOpen} onOpenChange={setEcosystemOpen}>
          <AccordionItem
            id="partner-details"
            title={isFr ? "Détails partenaires" : "Partner details"}
            subtitle="Kilelo · pawaPay · SanJa · RDPI · MontanaPay · Binance · ILOKWE · KIMIA · IA Académie"
          >
            <div className="space-y-4">
              {hackathonPartnerDetails().map((row) => {
                const p = row.logo;
                const tileInput = {
                  shape: p.shape,
                  tileBgClass: p.tileBgClass,
                  imageScaleClass: p.imageScaleClass,
                  fit: p.fit,
                };
                const { tile, img } = partnerLogoTileStyles(tileInput, "detail");
                const borderless = partnerLogoBorderless(tileInput);
                return (
                <a
                  key={p.id}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-[22px] border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 shadow-[0_14px_44px_-28px_var(--hk-shadow)] transition hover:border-[color:var(--hk-accent)]/35 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div
                      className={`flex shrink-0 items-center justify-center ${
                        p.shape === "wide" || p.shape === "wide-bleed"
                          ? "sm:w-[17rem]"
                          : "sm:w-[9rem]"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${tile} ${p.tileBgClass}${
                          borderless ? " border-0 shadow-none ring-0 outline-none" : ""
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.logoUrl} alt={p.name} className={img} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--hk-accent)]">
                        {isFr ? row.roleFr : row.roleEn}
                      </p>
                      <p className="mt-1 break-words text-base font-extrabold text-[color:var(--hk-text)]">
                        {p.name}
                      </p>
                      <p className="mt-1 break-words text-sm leading-relaxed text-[color:var(--hk-muted)]">
                        {isFr ? row.blurbFr : row.blurbEn}
                      </p>
                      <p className="mt-2 break-words text-xs font-extrabold text-[color:var(--hk-accent)]">
                        {isFr ? row.metaFr : row.metaEn}
                      </p>
                    </div>
                  </div>
                </a>
                );
              })}
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
                  <div className="flex items-start gap-3 rounded-[18px] border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--hk-soft)] text-[color:var(--hk-accent)]">
                      <BenefitIcon id={b.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[color:var(--hk-text)]">
                        {isFr ? b.titleFr : b.titleEn}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
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
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[color:var(--hk-accent)] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-95"
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
                    <Card className="h-full rounded-[22px] border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] shadow-[0_14px_44px_-28px_var(--hk-shadow)]">
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
                      {v ? (
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide hk-tier-chip ${v.badgeClass}`}
                        >
                          {tier.id}
                        </span>
                      ) : null}
                      <ul className="mt-3 space-y-1.5">
                        {perks.map((perk) => (
                          <li
                            key={perk}
                            className="flex items-center gap-2 text-sm text-[color:var(--hk-text)] opacity-90"
                          >
                            <CheckIcon className="h-4 w-4 shrink-0 text-[color:var(--hk-accent)]" />
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
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[color:var(--hk-accent)] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-95"
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
              <p className="text-sm leading-relaxed text-[color:var(--hk-muted)]">{item.a}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* Contact */}
      <Section
        id="contact"
        className="bg-[color:var(--hk-surface)]"
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
              <Card className="rounded-[22px] border-[color:var(--hk-border)] shadow-[0_14px_44px_-28px_var(--hk-shadow)] transition hover:border-[color:var(--hk-accent)]/35">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--hk-muted)]">
                  {c.label}
                </p>
                <p className="mt-2 font-extrabold text-[color:var(--hk-accent)]">{c.value}</p>
              </Card>
            </a>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="rounded-[28px] bg-[#1F6B43] px-6 py-10 text-center text-white shadow-[0_24px_64px_-30px_var(--hk-glow)] sm:px-12">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {isFr ? "Construisez votre futur avec l'IA." : "Build your future with AI."}
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#register"
              className="inline-flex min-h-11 items-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#1F6B43] shadow-sm transition hover:bg-[#EAF6EE]"
            >
              {isFr ? "Participer" : "Join"}
            </a>
            <a
              href="#register"
              onClick={() => setFormsOpen("sponsor-form")}
              className="inline-flex min-h-11 items-center rounded-xl border border-white/45 bg-white/10 px-6 py-2.5 text-sm font-extrabold text-white backdrop-blur-sm transition hover:bg-white/20"
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
                <a className="hk-footer-link hover:text-[#86efac]" href={`mailto:${SUPPORT_EMAIL}`}>
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
                <Link className="hk-footer-link hover:text-[#86efac]" href="/privacy">
                  {isFr ? "Confidentialité" : "Privacy"}
                </Link>
              </li>
              <li>
                <Link className="hk-footer-link hover:text-[#86efac]" href="/terms">
                  {isFr ? "Conditions" : "Terms"}
                </Link>
              </li>
              <li>
                <Link className="hk-footer-link hover:text-[#86efac]" href="/about">
                  {isFr ? "À propos" : "About"}
                </Link>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a
                href={SUPPORT_X}
                target="_blank"
                rel="noopener noreferrer"
                className="hk-footer-link text-white/65 hover:text-[#86efac]"
              >
                X / Twitter
              </a>
              <a
                href={SUPPORT_WA_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="hk-footer-link text-white/65 hover:text-[#86efac]"
              >
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
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--fd-border)] bg-[color:var(--hk-surface)]/95 p-3 backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <a
            href="#register"
            className="flex flex-1 items-center justify-center rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-semibold text-white"
          >
            {isFr ? "Participer" : "Join"}
          </a>
          <a
            href="#partenaires"
            className="flex flex-1 items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--hk-surface)] py-3 text-sm font-semibold text-[color:var(--fd-text)]"
          >
            {isFr ? "Partenaire" : "Partner"}
          </a>
        </div>
      </div>
    </div>
  );
}
