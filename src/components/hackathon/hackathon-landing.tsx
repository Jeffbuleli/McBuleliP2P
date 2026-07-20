"use client";

import Link from "next/link";
import type { FeaturedHackathonPayload } from "@/lib/hackathon/service";
import { challengeCategories, HACKATHON_LEGAL } from "@/lib/hackathon/landing-copy";
import {
  aboutBlurb,
  crossCuttingActivities,
  defaultHeroStats,
  eventDateLabel,
  HACKATHON_EVENT_DAYS,
  HACKATHON_EVENT_YEAR,
  HACKATHON_NAV,
  hackathonFaqNav,
  hackathonProgramDays,
  partnerBenefits,
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
import { HackathonParticipantForm } from "@/components/hackathon/hackathon-participant-form";
import { HackathonPartnerForm } from "@/components/hackathon/hackathon-partner-form";
import { HackathonSponsorForm } from "@/components/hackathon/hackathon-sponsor-form";
import { HackathonStickyNav } from "@/components/hackathon/hackathon-sticky-nav";
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
  return (
    <section id={id} className={`scroll-mt-28 py-12 sm:py-16 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-[color:var(--fd-text)] sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[color:var(--fd-muted)]">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
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
        name: "Mentor Vibe Coding",
        title: "Jeff Buleli - CEO",
        company: null,
        expertise: "Cursor - Claude - Codex",
        photoUrl: PORTRAIT_PATH,
        photoFit: "cover",
        href: "https://mcbuleli.org/@ceo",
      };
    }
    return p;
  });
}

function enrichJury(people: FeaturedHackathonPayload["jury"]): PersonCard[] {
  return people.map((p) => {
    if (/jury\s*mcbuleli/i.test(p.name) || /^mcbuleli$/i.test(p.name)) {
      return {
        ...p,
        name: "Jury McBuleli",
        photoUrl: BRAND_LOGO_256,
        photoFit: "contain",
      };
    }
    return p;
  });
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
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((p) => {
        const inner = (
          <>
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ${
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
                p.name.slice(0, 1)
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-[color:var(--fd-text)]">{p.name}</h3>
              {(p.title || p.company) && (
                <p className="mt-0.5 truncate text-xs text-[color:var(--fd-primary)]">
                  {[p.title, p.company].filter(Boolean).join(" - ")}
                </p>
              )}
            </div>
          </>
        );
        const cls =
          "flex items-center gap-3 rounded-xl border border-[color:var(--fd-border)] bg-white p-3";
        return (
          <li key={p.id}>
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
          className="flex items-center gap-3 rounded-xl border border-dashed border-[color:var(--fd-border)] p-3 text-sm text-[color:var(--fd-muted)]"
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
  const stats = defaultHeroStats(data.mentors.length, data.partnerLogos.length);

  const confirmedPacks = new Set(
    data.sponsorLogos.map((s) => s.pack.toLowerCase()).filter((p) => p !== "custom"),
  );

  const statItems = [
    {
      label: isFr ? "Participants attendus" : "Expected participants",
      value: String(stats.participantsExpected),
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
    <div className="bg-[color:var(--fd-bg)] pb-24 text-[color:var(--fd-text)] sm:pb-10">
      {/* Hero */}
      <header className="relative min-h-[min(72vh,640px)] overflow-hidden border-b border-[color:var(--fd-border)]">
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
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-10 pt-14 sm:px-6 sm:pb-14 sm:pt-20 lg:min-h-[min(72vh,640px)] lg:justify-center">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--fd-mint)]">
              McBuleli Hackathon - {HACKATHON_EVENT_DAYS} {isFr ? "jours" : "days"} - {HACKATHON_EVENT_YEAR}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Build the Future with AI
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
              {isFr
                ? "Bootcamp Vibe Coding, hackathon et Demo Day au Silikin Village - Kinshasa."
                : "Vibe Coding bootcamp, hackathon and Demo Day at Silikin Village - Kinshasa."}
            </p>
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <div>
                <dt className="sr-only">{isFr ? "Date" : "Date"}</dt>
                <dd>{eventDateLabel(e.startDate, isFr)}</dd>
              </div>
              <div>
                <dt className="sr-only">{isFr ? "Ville" : "City"}</dt>
                <dd>{practicalVenue(e.venue, e.city)}</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaPrimary href="#register" onDark>
                {isFr ? "Participer" : "Join"}
              </CtaPrimary>
              <CtaSecondary href="#partenaires" onDark>
                {isFr ? "Devenir partenaire" : "Become a partner"}
              </CtaSecondary>
            </div>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <div className="border-b border-[color:var(--fd-border)] bg-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-[color:var(--fd-border)] sm:grid-cols-4">
          {statItems.map((s) => (
            <div key={s.label} className="bg-white px-4 py-5 text-center sm:px-6">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {s.label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--fd-primary)]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <HackathonStickyNav items={HACKATHON_NAV} isFr={isFr} />

      {/* About */}
      <Section
        id="about"
        eyebrow={isFr ? "À propos" : "About"}
        title={about.title}
        subtitle={about.body}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--fd-text)]">
              {isFr ? "Mentors" : "Mentors"}
            </h3>
            <div className="mt-3">
              <PersonGrid
                people={enrichMentors(data.mentors)}
                empty={isFr ? "Mentor à annoncer" : "Mentor TBA"}
                slots={3}
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--fd-text)]">
              {isFr ? "Jury" : "Jury"}
            </h3>
            <div className="mt-3">
              <PersonGrid
                people={enrichJury(data.jury)}
                empty={isFr ? "Jury à annoncer" : "Jury TBA"}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Program */}
      <Section
        id="programme"
        className="bg-white"
        eyebrow={isFr ? "Programme" : "Program"}
        title={isFr ? "3 demi-journées - 08h00 - 13h30" : "3 half-days - 8:00 AM - 1:30 PM"}
        subtitle={
          isFr
            ? "Format professionnel avec temps dédié aux partenaires."
            : "Professional format with dedicated partner slots."
        }
      >
        <Accordion defaultOpen="day-1">
          {programDays.map((day) => (
            <AccordionItem
              key={day.day}
              id={`day-${day.day}`}
              title={isFr ? day.labelFr : day.labelEn}
              subtitle={isFr ? day.subtitleFr : day.subtitleEn}
              icon={<span className="text-sm font-bold">{day.day}</span>}
            >
              <ul className="space-y-2">
                {day.slots.map((slot) => (
                  <li
                    key={`${day.day}-${slot.time}-${slot.icon}`}
                    className="flex gap-3 rounded-xl bg-[color:var(--fd-bg)] px-3 py-2.5"
                  >
                    <span className="mt-0.5 text-[color:var(--fd-primary)]">
                      <ProgramIcon id={slot.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold tabular-nums text-[color:var(--fd-primary)]">
                        {slot.time}
                      </p>
                      <p className="mt-0.5 text-sm text-[color:var(--fd-text)]">
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
          <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {isFr ? "Activités transversales" : "Cross-cutting activities"}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {crossCut.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-[color:var(--fd-muted)]"
              >
                <BulletIcon className="h-3 w-3 shrink-0 text-[color:var(--fd-primary)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Challenges */}
      <Section
        id="defis"
        eyebrow={isFr ? "Défis" : "Challenges"}
        title={isFr ? "Choisissez votre impact" : "Pick your impact"}
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {challenges.map((c) => (
            <li key={c.id}>
              <Card className="h-full transition hover:border-[color:var(--fd-primary)]/30">
                <CardTitle>{c.label}</CardTitle>
                <CardDescription>{c.blurb}</CardDescription>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* Prizes */}
      <Section
        id="prix"
        className="bg-white"
        eyebrow={isFr ? "Prix" : "Prizes"}
        title={isFr ? "Récompenses & reconnaissance" : "Awards & recognition"}
        subtitle={
          isFr
            ? "Montants officiels annoncés avant l'événement."
            : "Official amounts announced before the event."
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prizes.map((p) => (
            <li key={p.id}>
              <Card>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
                    <PrizeIcon id={p.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="mt-0">
                      {isFr ? p.titleFr : p.titleEn}
                    </CardTitle>
                    <CardDescription>{isFr ? p.bodyFr : p.bodyEn}</CardDescription>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* Register */}
      <Section
        id="register"
        eyebrow={isFr ? "Inscription" : "Registration"}
        title={isFr ? "Rejoindre l'édition" : "Join this edition"}
        subtitle={
          isFr
            ? "Pré-inscription gratuite, place réservée sans expiration - rappels 24 h pour confirmer."
            : "Free pre-registration, seat held with no expiry - 24 h reminders to confirm."
        }
      >
        <div className="mx-auto max-w-2xl">
          <Card className="p-5 sm:p-8">
            <HackathonParticipantForm
              editionId={e.id}
              locale={locale}
              priceUsd={e.priceFullUsd}
              registrationOpen={open}
            />
          </Card>
        </div>
      </Section>

      {/* Partners */}
      <Section
        id="partenaires"
        className="bg-white"
        eyebrow={isFr ? "Partenaires" : "Partners"}
        title={isFr ? "Pourquoi devenir partenaire ?" : "Why become a partner?"}
        subtitle={
          isFr
            ? "Chaque collaboration est définie sur mesure après discussion."
            : "Each collaboration is tailored after discussion."
        }
      >
        {(() => {
          const logoSlots = Math.max(6, data.partnerLogos.length);
          const logos = [
            ...data.partnerLogos,
            ...Array.from({ length: logoSlots - data.partnerLogos.length }, (_, i) => ({
              id: `partner-slot-${i}`,
              name: isFr ? "Logo partenaire" : "Partner logo",
              logoUrl: null as string | null,
              website: null as string | null,
              placeholder: true,
            })),
          ];
          return (
            <ul className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {logos.map((p) => (
                <li
                  key={p.id}
                  className={`flex h-16 items-center justify-center rounded-xl border px-3 ${
                    "placeholder" in p && p.placeholder
                      ? "border-dashed border-[color:var(--fd-border)] bg-[color:var(--fd-bg)]/60"
                      : "border-[color:var(--fd-border)] bg-white"
                  }`}
                >
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logoUrl} alt={p.name} className="max-h-8 max-w-[120px] object-contain" />
                  ) : (
                    <span className="text-center text-[11px] font-medium text-[color:var(--fd-muted)]">
                      {p.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          );
        })()}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <li key={b.id}>
              <Card className="h-full">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
                    <BenefitIcon id={b.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="mt-0">{isFr ? b.titleFr : b.titleEn}</CardTitle>
                    <CardDescription>{isFr ? b.bodyFr : b.bodyEn}</CardDescription>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaPrimary href="#partenaires-form">
            {isFr ? "Devenir partenaire" : "Become a partner"}
          </CtaPrimary>
        </div>
        <div id="partenaires-form" className="mt-8 scroll-mt-28">
          <Card className="p-5 sm:p-8">
            <HackathonPartnerForm editionId={e.id} locale={locale} />
          </Card>
        </div>
      </Section>

      {/* Sponsors */}
      <Section
        id="sponsors"
        eyebrow="Sponsors"
        title={
          isFr
            ? "Soutenez la prochaine génération de builders"
            : "Support the next generation of builders"
        }
      >
        {data.sponsorLogos.length > 0 ? (
          <ul className="mb-8 flex flex-wrap gap-3">
            {data.sponsorLogos.map((s) => {
              const v = BUILDERS_TIER_VISUAL[s.pack] ?? BUILDERS_TIER_VISUAL.bronze;
              return (
                <li
                  key={s.id}
                  className={`flex h-20 min-w-[9rem] flex-col items-center justify-center rounded-xl px-5 ${v.badgeClass}`}
                >
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logoUrl} alt={s.name} className="max-h-8 max-w-[120px]" />
                  ) : (
                    <span className="text-sm font-semibold">{s.name}</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
        <ul className="grid gap-4 lg:grid-cols-2">
          {tiers.map((tier) => {
            const v = BUILDERS_TIER_VISUAL[tier.id];
            const confirmed = confirmedPacks.has(tier.id);
            const perks = isFr ? tier.perksFr : tier.perksEn;
            return (
              <li key={tier.id}>
                <Card className={`h-full ${v?.badgeClass ?? ""}`}>
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
                  <ul className="mt-4 space-y-1.5">
                    {perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-sm opacity-90">
                        <CheckIcon className="h-4 w-4 shrink-0 text-[color:var(--fd-primary)]" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            );
          })}
        </ul>
        <div id="sponsor-form" className="mt-8 scroll-mt-28">
          <Card className="p-5 sm:p-8">
            <h3 className="text-lg font-semibold">
              {isFr ? "Formulaire sponsor" : "Sponsor form"}
            </h3>
            <div className="mt-4">
              <HackathonSponsorForm editionId={e.id} locale={locale} />
            </div>
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section
        id="faq"
        className="bg-white"
        eyebrow="FAQ"
        title={isFr ? "Questions fréquentes" : "FAQ"}
      >
        <Accordion>
          {faq.map((item, i) => (
            <AccordionItem key={item.q} id={`faq-${i}`} title={item.q}>
              <p className="text-sm leading-relaxed text-[color:var(--fd-muted)]">{item.a}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* Contact */}
      <Section
        id="contact"
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
              <Card className="transition hover:border-[color:var(--fd-primary)]/30">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                  {c.label}
                </p>
                <p className="mt-2 font-semibold text-[color:var(--fd-primary)]">{c.value}</p>
              </Card>
            </a>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="rounded-3xl bg-[color:var(--fd-primary)] px-6 py-10 text-center text-white sm:px-12">
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
              href="#sponsors"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-6 py-2.5 text-sm font-semibold text-white"
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
