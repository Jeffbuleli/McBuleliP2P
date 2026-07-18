import Link from "next/link";
import type { FeaturedHackathonPayload } from "@/lib/hackathon/service";
import {
  challengeCategories,
  evaluationCriteria,
  expandedFaq,
  HACKATHON_LEGAL,
  journeySteps,
  rewardHighlights,
  whyParticipate,
} from "@/lib/hackathon/landing-copy";
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

function statusLabel(status: string, isFr: boolean) {
  if (status === "open") return isFr ? "Inscriptions ouvertes" : "Registration open";
  if (status === "closed") return isFr ? "Inscriptions fermées" : "Registration closed";
  return isFr ? "Bientôt ouvert" : "Opening soon";
}

function isPlaceholderVenue(venue: string | null | undefined) {
  if (!venue?.trim()) return true;
  const v = venue.trim().toLowerCase();
  return (
    v.includes("confirmer") ||
    v.includes("tbd") ||
    v.includes("tba") ||
    v.includes("à définir")
  );
}

function practicalDate(iso: string | null, isFr: boolean) {
  if (!iso) {
    return isFr
      ? "À confirmer après réservation"
      : "To be confirmed after venue booking";
  }
  try {
    return new Date(iso).toLocaleDateString(isFr ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isFr
      ? "À confirmer après réservation"
      : "To be confirmed after venue booking";
  }
}

function practicalVenue(venue: string | null, city: string, isFr: boolean) {
  if (isPlaceholderVenue(venue)) {
    return isFr
      ? `À confirmer après réservation · ${city}`
      : `To be confirmed after venue booking · ${city}`;
  }
  return [venue, city].filter(Boolean).join(" · ");
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
    <section id={id} className={`scroll-mt-24 py-14 sm:py-20 ${className}`}>
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
        <div className="mt-10">{children}</div>
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
          ? "inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--fd-primary)] shadow-sm transition hover:bg-[color:var(--fd-mint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          : "inline-flex min-h-11 items-center justify-center rounded-xl bg-[color:var(--fd-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--fd-primary-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--fd-primary)]"
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
          ? "inline-flex min-h-11 items-center justify-center rounded-xl border border-white/55 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          : "inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--fd-text)] transition hover:bg-[color:var(--fd-mint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--fd-primary)]"
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
    if (/vibe\s*coding/i.test(p.name) || /mentor vibe/i.test(p.name)) {
      return {
        ...p,
        name: "Jeff Buleli",
        title: "CEO",
        company: "McBuleli",
        expertise: "Cursor · ChatGPT · Ship",
        photoUrl: PORTRAIT_PATH,
        photoFit: "cover",
        href: "/@ceo",
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
  slots = 6,
}: {
  people: PersonCard[];
  empty: string;
  slots?: number;
}) {
  const placeholders = Math.max(0, slots - people.length);
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((p) => {
        const inner = (
          <>
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--fd-mint)] text-lg font-semibold text-[color:var(--fd-primary)] ${
                p.photoFit === "contain" ? "p-2" : ""
              }`}
            >
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photoUrl}
                  alt=""
                  className={`h-full w-full ${p.photoFit === "contain" ? "object-contain" : "object-cover"}`}
                />
              ) : (
                p.name.slice(0, 1)
              )}
            </div>
            <div>
              <h3 className="font-semibold text-[color:var(--fd-text)]">{p.name}</h3>
              <p className="mt-0.5 text-sm text-[color:var(--fd-primary)]">
                {[p.title, p.company].filter(Boolean).join(" · ")}
              </p>
              {p.expertise ? (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
                  {p.expertise}
                </p>
              ) : null}
            </div>
          </>
        );
        return (
          <li key={p.id}>
            {p.href ? (
              <Link
                href={p.href}
                className="flex gap-4 rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 shadow-[0_1px_0_rgba(12,10,9,0.04)] transition hover:border-[color:var(--fd-primary)]/35 hover:bg-[color:var(--fd-mint)]/40"
              >
                {inner}
              </Link>
            ) : (
              <div className="flex gap-4 rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 shadow-[0_1px_0_rgba(12,10,9,0.04)]">
                {inner}
              </div>
            )}
          </li>
        );
      })}
      {Array.from({ length: placeholders }).map((_, i) => (
        <li
          key={`ph-${i}`}
          className="flex flex-col justify-center rounded-2xl border border-dashed border-[color:var(--fd-border)] bg-[color:var(--fd-bg)]/60 p-5"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[color:var(--fd-muted)]">
            +
          </div>
          <p className="mt-3 text-sm font-medium text-[color:var(--fd-muted)]">{empty}</p>
        </li>
      ))}
    </ul>
  );
}

function MidCta({ isFr }: { isFr: boolean }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/60 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
        <div>
          <p className="text-lg font-semibold text-[color:var(--fd-text)]">
            {isFr
              ? "Prêt à construire avec l’IA ?"
              : "Ready to build with AI?"}
          </p>
          <p className="mt-1 text-sm text-[color:var(--fd-muted)]">
            {isFr
              ? "Réservez votre place - places limitées pour cette édition."
              : "Secure your seat - limited capacity for this edition."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CtaPrimary href="#register">{isFr ? "Pré-inscrire" : "Pre-register"}</CtaPrimary>
          <CtaSecondary href="#partner">
            {isFr ? "Devenir partenaire" : "Become a partner"}
          </CtaSecondary>
        </div>
      </div>
    </div>
  );
}

export function HackathonLanding({
  data,
  locale,
}: {
  data: FeaturedHackathonPayload;
  locale: "fr" | "en";
}) {
  const isFr = locale === "fr";
  const e = data.edition;
  const name = isFr ? e.nameFr : e.nameEn;
  const open = e.status === "open";
  const seatsLeft = Math.max(0, e.maxSeats - e.seatsTaken);
  const benefits = whyParticipate(isFr);
  const challenges = challengeCategories(isFr);
  const journey = journeySteps(isFr);
  const criteria = evaluationCriteria(isFr);
  const rewards = rewardHighlights(isFr);
  const faq = expandedFaq(isFr);
  const year = new Date().getFullYear();

  return (
    <div className="bg-[color:var(--fd-bg)] pb-24 text-[color:var(--fd-text)] sm:pb-10">
      {/* Hero — Kinshasa skyline (Congo River / downtown aerial) */}
      <header className="relative min-h-[min(92vh,780px)] overflow-hidden border-b border-[color:var(--fd-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hackathon/kinshasa-skyline.jpg"
          alt={
            isFr
              ? "Vue aérienne de Kinshasa et du fleuve Congo"
              : "Aerial view of Kinshasa and the Congo River"
          }
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(12, 28, 18, 0.88) 0%, rgba(18, 42, 28, 0.72) 42%, rgba(12, 28, 18, 0.45) 70%, rgba(8, 20, 14, 0.55) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
          style={{
            background: "linear-gradient(to top, var(--fd-bg), transparent)",
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:min-h-[min(92vh,780px)] lg:justify-center lg:pb-24 lg:pt-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--fd-mint)]">
              McBuleli · {isFr ? "Hackathon IA - Kinshasa" : "AI Hackathon - Kinshasa"}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Build the Future with AI
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              {isFr
                ? "Le hackathon IA de référence en République Démocratique du Congo - organisé par McBuleli depuis Kinshasa. Apprenez le Vibe Coding, construisez un produit, pitchtez devant un jury, et rejoignez un écosystème qui relie builders, entreprises et investisseurs."
                : "The AI hackathon of reference in the Democratic Republic of the Congo - organized by McBuleli from Kinshasa. Learn Vibe Coding, ship a product, pitch before a jury, and join an ecosystem connecting builders, companies and investors."}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/75">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--fd-mint)]" />
                {isFr
                  ? "Organisé par McBuleli - plateforme fintech & communauté builders"
                  : "Organized by McBuleli - fintech platform & builders community"}
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--fd-mint)]" />
                {isFr
                  ? "Unique : bootcamp + hackathon + incubation sur une même plateforme"
                  : "Unique: bootcamp + hackathon + incubation on one platform"}
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--fd-mint)]" />
                {isFr
                  ? `${name} · ${statusLabel(e.status, isFr)} · ${seatsLeft} places restantes`
                  : `${name} · ${statusLabel(e.status, isFr)} · ${seatsLeft} seats left`}
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaPrimary href="#register" onDark>
                {isFr ? "Pré-inscrire" : "Pre-register"}
              </CtaPrimary>
              <CtaSecondary href="#partner" onDark>
                {isFr ? "Devenir partenaire" : "Become a partner"}
              </CtaSecondary>
            </div>
          </div>
        </div>
      </header>

      {/* Trust strip */}
      <div className="border-b border-[color:var(--fd-border)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-sm text-[color:var(--fd-muted)] sm:px-6">
          <p>
            <span className="font-semibold text-[color:var(--fd-text)]">McBuleli</span>
            {" · "}
            {isFr ? "Wallet · P2P · Academy · Communauté" : "Wallet · P2P · Academy · Community"}
          </p>
          <p className="font-medium text-[color:var(--fd-primary)]">
            {isFr ? "Kinshasa · Afrique" : "Kinshasa · Africa"}
          </p>
        </div>
      </div>

      {/* Why */}
      <Section
        id="pourquoi"
        eyebrow={isFr ? "Pourquoi participer" : "Why join"}
        title={
          isFr
            ? "Plus qu’une compétition - un tremplin"
            : "More than a competition - a launchpad"
        }
        subtitle={
          isFr
            ? "Conçu pour les talents qui veulent apprendre, livrer et se connecter à l’écosystème McBuleli."
            : "Built for talent who want to learn, ship and connect to the McBuleli ecosystem."
        }
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <li
              key={b.title}
              className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 shadow-[0_1px_0_rgba(12,10,9,0.04)]"
            >
              <h3 className="text-base font-semibold text-[color:var(--fd-text)]">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">{b.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <MidCta isFr={isFr} />

      {/* Practical info */}
      <Section
        id="infos"
        eyebrow={isFr ? "Informations pratiques" : "Practical info"}
        title={name}
        subtitle={
          isFr
            ? "Lieu et dates exacts communiqués après réservation du site - pas de date fictive."
            : "Exact venue and dates shared after venue booking - no placeholder dates."
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              [
                isFr ? "Date" : "Date",
                practicalDate(e.startDate, isFr) +
                  (e.endDate && e.startDate
                    ? ` → ${practicalDate(e.endDate, isFr)}`
                    : ""),
              ],
              [isFr ? "Lieu" : "Venue", practicalVenue(e.venue, e.city, isFr)],
              [
                isFr ? "Places" : "Seats",
                `${seatsLeft} / ${e.maxSeats} ${isFr ? "disponibles" : "available"}`,
              ],
              [
                isFr ? "Statut" : "Status",
                statusLabel(e.status, isFr),
              ],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug text-[color:var(--fd-text)]">
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {isFr ? "1 jour - Bootcamp" : "1 day - Bootcamp"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--fd-primary)]">
              {e.priceDay1Usd} USD
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {isFr ? "2 jours + Hackathon" : "2 days + Hackathon"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--fd-primary)]">
              {e.priceFullUsd} USD
            </p>
          </div>
        </div>
      </Section>

      {/* Challenges */}
      <Section
        id="defis"
        className="bg-white"
        eyebrow={isFr ? "Défis" : "Challenges"}
        title={
          isFr
            ? "Catégories pour un impact réel"
            : "Categories for real-world impact"
        }
        subtitle={
          isFr
            ? "Choisissez un défi - ou proposez une solution transversale."
            : "Pick a challenge - or propose a cross-cutting solution."
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {challenges.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] p-5 transition hover:border-[color:var(--fd-primary)]/30 hover:bg-white"
            >
              <h3 className="font-semibold text-[color:var(--fd-text)]">{c.label}</h3>
              <p className="mt-2 text-sm text-[color:var(--fd-muted)]">{c.blurb}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Journey */}
      <Section
        id="deroulement"
        eyebrow={isFr ? "Déroulement" : "Journey"}
        title={isFr ? "Du dossier à l’incubation" : "From application to incubation"}
      >
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((s, idx) => (
            <li
              key={s.step}
              className="relative rounded-2xl border border-[color:var(--fd-border)] bg-white p-5"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-xs font-bold text-[color:var(--fd-primary)]">
                {s.step}
              </span>
              <h3 className="mt-3 font-semibold text-[color:var(--fd-text)]">{s.title}</h3>
              <p className="mt-1.5 text-sm text-[color:var(--fd-muted)]">{s.body}</p>
              {idx < journey.length - 1 ? (
                <span className="absolute -bottom-2 left-1/2 hidden h-4 w-px bg-[color:var(--fd-border)] sm:left-auto sm:right-[-0.4rem] sm:top-1/2 sm:h-px sm:w-3 lg:block" />
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      {/* Program detail */}
      <Section
        id="programme"
        className="bg-white"
        eyebrow={isFr ? "Programme" : "Program"}
        title={isFr ? "Bootcamp puis compétition" : "Bootcamp then competition"}
        subtitle={
          isFr
            ? "Jour 1 : Vibe Coding. Jour 2 : hackathon, pitch et remise des prix."
            : "Day 1: Vibe Coding. Day 2: hackathon, pitch and awards."
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {e.program.map((day) => (
            <article
              key={day.day}
              className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] p-6 sm:p-8"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
                {isFr ? `Jour ${day.day}` : `Day ${day.day}`}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[color:var(--fd-text)]">
                {isFr ? day.titleFr : day.titleEn}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {(isFr ? day.itemsFr : day.itemsEn).map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-[color:var(--fd-muted)]">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--fd-primary)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      {/* Criteria */}
      <Section
        id="criteres"
        eyebrow={isFr ? "Évaluation" : "Judging"}
        title={isFr ? "Critères d’évaluation" : "Evaluation criteria"}
        subtitle={
          isFr
            ? "Une grille claire pour un jury crédible et transparent."
            : "A clear rubric for credible, transparent judging."
        }
      >
        <ul className="divide-y divide-[color:var(--fd-border)] overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-white">
          {criteria.map((c) => (
            <li key={c.label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <h3 className="font-semibold text-[color:var(--fd-text)]">{c.label}</h3>
                <p className="mt-1 text-sm text-[color:var(--fd-muted)]">{c.body}</p>
              </div>
              {c.weight ? (
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[color:var(--fd-primary)]">
                  {c.weight}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </Section>

      {/* Rewards */}
      <Section
        id="recompenses"
        className="bg-white"
        eyebrow={isFr ? "Récompenses" : "Rewards"}
        title={
          isFr
            ? "Au-delà du podium"
            : "Beyond the podium"
        }
        subtitle={
          isFr
            ? "Les montants seront annoncés officiellement. Voici ce que vous gagnez dès aujourd’hui en participant."
            : "Prize amounts will be announced officially. Here’s what you gain by joining."
        }
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r) => (
            <li
              key={r.title}
              className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] p-5"
            >
              <h3 className="font-semibold text-[color:var(--fd-text)]">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">{r.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <div className="py-6">
        <MidCta isFr={isFr} />
      </div>

      {/* Register */}
      <Section
        id="register"
        eyebrow={isFr ? "Inscription" : "Registration"}
        title={isFr ? "Rejoindre l’édition" : "Join this edition"}
        subtitle={
          isFr
            ? "Pré-inscription gratuite (place retenue 72 h), puis paiement quand vous êtes prêt. Ticket QR après confirmation."
            : "Free pre-registration (seat held 72 h), then pay when ready. QR ticket after confirmation."
        }
      >
        <div className="mx-auto max-w-2xl rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 shadow-sm sm:p-8">
          <HackathonParticipantForm
            editionId={e.id}
            locale={locale}
            priceDay1={e.priceDay1Usd}
            priceFull={e.priceFullUsd}
            registrationOpen={open}
          />
        </div>
      </Section>

      {/* Mentors + Jury */}
      <Section
        id="mentors"
        className="bg-white"
        eyebrow="Mentors"
        title={
          isFr
            ? "Accompagnement d’experts"
            : "Expert guidance"
        }
        subtitle={
          isFr
            ? "Grille prête - annonces au fil des confirmations."
            : "Grid ready - announcements as mentors confirm."
        }
      >
        <PersonGrid
          people={enrichMentors(data.mentors)}
          empty={isFr ? "Mentor à annoncer" : "Mentor TBA"}
        />
      </Section>

      <Section
        id="jury"
        eyebrow="Jury"
        title={isFr ? "Un jury exigeant" : "A rigorous jury"}
        subtitle={
          isFr
            ? "Évaluation selon la grille officielle."
            : "Scoring against the official rubric."
        }
      >
        <PersonGrid
          people={enrichJury(data.jury)}
          empty={isFr ? "Membre du jury à annoncer" : "Jury member TBA"}
        />
      </Section>

      {/* Sponsors */}
      <Section
        id="sponsors"
        className="bg-white"
        eyebrow="Sponsors"
        title={
          isFr
            ? "Soutenez la prochaine génération de builders"
            : "Support the next generation of builders"
        }
        subtitle={
          isFr
            ? "Packs Bronze, Silver, Gold, Platinum ou budget personnalisé."
            : "Bronze, Silver, Gold, Platinum or custom budget."
        }
      >
        {data.sponsorLogos.length ? (
          <ul className="mb-8 flex flex-wrap gap-3">
            {data.sponsorLogos.map((s) => (
              <li
                key={s.id}
                className="flex h-16 min-w-[8rem] flex-col items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-5"
              >
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt={s.name} className="max-h-8 max-w-[120px]" />
                ) : (
                  <span className="text-sm font-semibold text-[color:var(--fd-muted)]">{s.name}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["Bronze", "bronze"],
                ["Silver", "silver"],
                ["Gold", "gold"],
                ["Platinum", "platinum"],
              ] as const
            ).map(([label, tier]) => {
              const v = BUILDERS_TIER_VISUAL[tier];
              return (
                <div
                  key={tier}
                  className={`flex h-16 items-center justify-center rounded-xl text-xs font-semibold uppercase tracking-wide ${v.badgeClass}`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        )}
        <div className="mb-8">
          <CtaPrimary href="#sponsor">{isFr ? "Devenir sponsor" : "Become a sponsor"}</CtaPrimary>
        </div>
        <div id="sponsor" className="scroll-mt-24 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] p-5 sm:p-8">
          <h3 className="text-lg font-semibold text-[color:var(--fd-text)]">
            {isFr ? "Formulaire sponsor" : "Sponsor form"}
          </h3>
          <div className="mt-4">
            <HackathonSponsorForm editionId={e.id} locale={locale} />
          </div>
        </div>
      </Section>

      {/* Partners */}
      <Section
        id="partner"
        eyebrow={isFr ? "Partenaires" : "Partners"}
        title={
          isFr
            ? "Universités, entreprises, médias"
            : "Universities, companies, media"
        }
        subtitle={
          isFr
            ? "Lieu, internet, communication, jury, mentorat, incubation, formation, recrutement…"
            : "Venue, internet, communication, jury, mentoring, incubation, training, hiring…"
        }
      >
        {data.partnerLogos.length ? (
          <ul className="mb-8 flex flex-wrap gap-3">
            {data.partnerLogos.map((p) => (
              <li
                key={p.id}
                className="flex h-14 min-w-[7rem] items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-white px-4 text-sm font-semibold text-[color:var(--fd-muted)]"
              >
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt={p.name} className="max-h-8 max-w-[120px]" />
                ) : (
                  p.name
                )}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 sm:p-8">
          <HackathonPartnerForm editionId={e.id} locale={locale} />
        </div>
      </Section>

      {/* FAQ */}
      <Section
        id="faq"
        className="bg-white"
        eyebrow="FAQ"
        title={isFr ? "Questions fréquentes" : "Frequently asked questions"}
      >
        <ul className="divide-y divide-[color:var(--fd-border)] overflow-hidden rounded-2xl border border-[color:var(--fd-border)]">
          {faq.map((item) => (
            <li key={item.q} className="bg-[color:var(--fd-bg)] px-5 py-4 sm:px-6">
              <h3 className="font-semibold text-[color:var(--fd-text)]">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">{item.a}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Contact */}
      <Section
        id="contact"
        eyebrow={isFr ? "Contact" : "Contact"}
        title={isFr ? "Parler à l’équipe McBuleli" : "Talk to the McBuleli team"}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 transition hover:border-[color:var(--fd-primary)]/30"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">Email</p>
            <p className="mt-2 font-semibold text-[color:var(--fd-primary)]">{SUPPORT_EMAIL}</p>
          </a>
          <a
            href={`tel:${SUPPORT_PHONE_DISPLAY.replace(/\s/g, "")}`}
            className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 transition hover:border-[color:var(--fd-primary)]/30"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {isFr ? "Téléphone" : "Phone"}
            </p>
            <p className="mt-2 font-semibold text-[color:var(--fd-primary)]">{SUPPORT_PHONE_DISPLAY}</p>
          </a>
          <a
            href={SUPPORT_WA_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 transition hover:border-[color:var(--fd-primary)]/30"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">WhatsApp</p>
            <p className="mt-2 font-semibold text-[color:var(--fd-primary)]">
              {isFr ? "Ouvrir le chat" : "Open chat"}
            </p>
          </a>
          <a
            href="https://mcbuleli.org"
            className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 transition hover:border-[color:var(--fd-primary)]/30"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {isFr ? "Site web" : "Website"}
            </p>
            <p className="mt-2 font-semibold text-[color:var(--fd-primary)]">mcbuleli.org</p>
          </a>
          <a
            href={SUPPORT_X}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 transition hover:border-[color:var(--fd-primary)]/30"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {isFr ? "Réseaux" : "Social"}
            </p>
            <p className="mt-2 font-semibold text-[color:var(--fd-primary)]">@McBuleli</p>
          </a>
        </div>
      </Section>

      {/* Final CTA */}
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="rounded-3xl bg-[color:var(--fd-primary)] px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {isFr
              ? "Construisez votre futur avec l’IA."
              : "Build your future with AI."}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            {isFr
              ? "Hackathons IA en RDC - powered by McBuleli. Inscrivez-vous ou devenez partenaire aujourd’hui."
              : "AI hackathons in DRC - powered by McBuleli. Register or partner today."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#register"
              className="inline-flex min-h-11 items-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--fd-primary)]"
            >
              {isFr ? "Pré-inscrire maintenant" : "Pre-register now"}
            </a>
            <a
              href="#sponsor"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-6 py-2.5 text-sm font-semibold text-white"
            >
              {isFr ? "Devenir sponsor" : "Become a sponsor"}
            </a>
          </div>
        </div>
      </div>

      {/* Legal footer */}
      <footer className="border-t border-[color:var(--fd-border)] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--fd-text)]">{HACKATHON_LEGAL.legalName}</p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
              {HACKATHON_LEGAL.address}
            </p>
            <p className="mt-3 text-xs text-[color:var(--fd-muted)]">
              RCCM : {HACKATHON_LEGAL.rccm}
              <br />
              ID Nat : {HACKATHON_LEGAL.idNat}
              <br />
              NIF : {HACKATHON_LEGAL.taxId}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[color:var(--fd-text)]">
              {isFr ? "Contact" : "Contact"}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[color:var(--fd-muted)]">
              <li>
                <a className="hover:text-[color:var(--fd-primary)]" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li>{SUPPORT_PHONE_DISPLAY}</li>
              <li>
                <a className="hover:text-[color:var(--fd-primary)]" href={SUPPORT_WA_PATH} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-[color:var(--fd-text)]">
              {isFr ? "Mentions légales" : "Legal"}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[color:var(--fd-muted)]">
              <li>
                <Link className="hover:text-[color:var(--fd-primary)]" href="/privacy">
                  {isFr ? "Politique de confidentialité" : "Privacy policy"}
                </Link>
              </li>
              <li>
                <Link className="hover:text-[color:var(--fd-primary)]" href="/terms">
                  {isFr ? "Conditions d’utilisation" : "Terms of use"}
                </Link>
              </li>
              <li>
                <Link className="hover:text-[color:var(--fd-primary)]" href="/about">
                  {isFr ? "À propos / Mentions légales" : "About / Legal notice"}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[color:var(--fd-border)] px-4 py-6 sm:px-6">
          <p className="text-center text-xs text-[color:var(--fd-muted)]">
            © {year} {HACKATHON_LEGAL.legalName}. {isFr ? "Tous droits réservés." : "All rights reserved."}
          </p>
          <a
            href={SUPPORT_X}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[color:var(--fd-text)] transition hover:text-[color:var(--fd-primary)]"
          >
            <span className="text-xs font-medium text-[color:var(--fd-muted)]">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-256.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg"
            />
            <span>McBuleli</span>
          </a>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--fd-border)] bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <a
            href="#register"
            className="flex flex-1 items-center justify-center rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-semibold text-white"
          >
            {isFr ? "Pré-inscrire" : "Pre-register"}
          </a>
          <a
            href="#partner"
            className="flex flex-1 items-center justify-center rounded-xl border border-[color:var(--fd-border)] py-3 text-sm font-semibold text-[color:var(--fd-text)]"
          >
            {isFr ? "Partenaire" : "Partner"}
          </a>
        </div>
      </div>
    </div>
  );
}
