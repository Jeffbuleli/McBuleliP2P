import Link from "next/link";
import type { FeaturedHackathonPayload } from "@/lib/hackathon/service";
import { defaultFaq } from "@/lib/hackathon/constants";
import { HackathonHeroIllustration } from "@/components/hackathon/hackathon-hero-illustration";
import { HackathonParticipantForm } from "@/components/hackathon/hackathon-participant-form";
import { HackathonPartnerForm } from "@/components/hackathon/hackathon-partner-form";
import { HackathonSponsorForm } from "@/components/hackathon/hackathon-sponsor-form";

function statusLabel(status: string, isFr: boolean) {
  if (status === "open") return isFr ? "Ouvert" : "Open";
  if (status === "closed") return isFr ? "Fermé" : "Closed";
  return isFr ? "Bientôt" : "Coming soon";
}

function formatDate(iso: string | null, locale: string) {
  if (!iso) return locale === "fr" ? "Dates à confirmer" : "Dates TBA";
  try {
    return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-10 sm:py-14">
      <h2 className="text-2xl font-black tracking-tight text-[color:var(--fd-text)] sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--fd-muted)] sm:text-base">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function PersonGrid({
  people,
  empty,
}: {
  people: FeaturedHackathonPayload["jury"];
  empty: string;
}) {
  if (!people.length) {
    return <p className="text-sm text-[color:var(--fd-muted)]">{empty}</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((p) => (
        <li
          key={p.id}
          className="flex gap-3 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-4"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--fd-mint)] text-lg font-black text-[color:var(--fd-primary)]">
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              p.name.slice(0, 1)
            )}
          </div>
          <div>
            <p className="font-bold text-[color:var(--fd-text)]">{p.name}</p>
            <p className="text-xs font-semibold text-[color:var(--fd-primary)]">
              {[p.title, p.company].filter(Boolean).join(" · ")}
            </p>
            {p.expertise ? (
              <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{p.expertise}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
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
  const tagline =
    (isFr ? e.taglineFr : e.taglineEn) ||
    (isFr
      ? "Participez aux Bootcamps et Hackathons McBuleli pour apprendre le Vibe Coding, créer votre startup et présenter votre projet devant un jury."
      : "Join McBuleli Bootcamps and Hackathons to learn Vibe Coding, build your startup, and pitch before a jury.");
  const stats = e.displayStats;
  const seatsLeft = Math.max(0, e.maxSeats - e.seatsTaken);
  const open = e.status === "open";
  const faq = defaultFaq(isFr);

  const cta =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-extrabold transition";

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-2 sm:px-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#e8f3ee] via-[#f4f6f5] to-[#dfece4] px-5 py-10 sm:px-10 sm:py-14">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[color:var(--fd-primary)]">
          McBuleli Hackathon
        </p>
        <h1 className="mt-3 max-w-xl text-3xl font-black leading-[1.1] tracking-tight text-[color:var(--fd-text)] sm:text-5xl">
          Build the Future with AI
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[color:var(--fd-muted)] sm:text-base">
          {tagline}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href="#register" className={`${cta} bg-[color:var(--fd-primary)] text-white`}>
            {isFr ? "S'inscrire" : "Register"}
          </a>
          <a
            href="#partner"
            className={`${cta} border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-primary)]`}
          >
            {isFr ? "Devenir partenaire" : "Become a partner"}
          </a>
          <a
            href="#sponsor"
            className={`${cta} border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-primary)]`}
          >
            {isFr ? "Sponsoriser" : "Sponsor"}
          </a>
          <a
            href="#programme"
            className={`${cta} border border-[color:var(--fd-border)] bg-white/80 text-[color:var(--fd-text)]`}
          >
            {isFr ? "Voir le programme" : "View program"}
          </a>
        </div>
        <div className="mt-8 sm:absolute sm:bottom-4 sm:right-4 sm:mt-0 sm:w-[42%] sm:max-w-md">
          <HackathonHeroIllustration className="h-auto w-full" />
        </div>
      </header>

      {/* Stats */}
      <Section
        title={isFr ? "La communauté" : "The community"}
        subtitle={
          isFr
            ? "Une plateforme pour organiser bootcamps, hackathons et compétitions IA — édition après édition."
            : "One platform to run AI bootcamps, hackathons and competitions — edition after edition."
        }
      >
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              [isFr ? "Participants" : "Participants", stats.participants || e.seatsTaken],
              [isFr ? "Équipes" : "Teams", stats.teams],
              ["Hackathons", stats.hackathons],
              [isFr ? "Projets" : "Projects", stats.projects],
              [isFr ? "Partenaires" : "Partners", stats.partners || data.partnerLogos.length],
              ["Sponsors", stats.sponsors || data.sponsorLogos.length],
            ] as const
          ).map(([label, value]) => (
            <li
              key={label}
              className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-4 text-center"
            >
              <p className="text-2xl font-black text-[color:var(--fd-primary)]">{value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {label}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Next edition */}
      <Section
        title={isFr ? "Prochaine édition" : "Next edition"}
        subtitle={name}
      >
        <div className="rounded-[1.75rem] border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[color:var(--fd-mint)] px-3 py-1 text-xs font-extrabold text-[color:var(--fd-primary)]">
              {statusLabel(e.status, isFr)}
            </span>
            <span className="text-sm font-semibold text-[color:var(--fd-muted)]">
              {seatsLeft} / {e.maxSeats} {isFr ? "places" : "seats"}
            </span>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                {isFr ? "Date" : "Date"}
              </dt>
              <dd className="mt-1 font-semibold text-[color:var(--fd-text)]">
                {formatDate(e.startDate, locale)}
                {e.endDate && e.endDate !== e.startDate
                  ? ` → ${formatDate(e.endDate, locale)}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                {isFr ? "Lieu" : "Venue"}
              </dt>
              <dd className="mt-1 font-semibold text-[color:var(--fd-text)]">
                {[e.venue, e.city].filter(Boolean).join(" · ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                {isFr ? "1 jour" : "1 day"}
              </dt>
              <dd className="mt-1 text-xl font-black text-[color:var(--fd-primary)]">
                {e.priceDay1Usd} USD
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                {isFr ? "2 jours + Hackathon" : "2 days + Hackathon"}
              </dt>
              <dd className="mt-1 text-xl font-black text-[color:var(--fd-primary)]">
                {e.priceFullUsd} USD
              </dd>
            </div>
          </dl>
        </div>
      </Section>

      {/* Program */}
      <Section
        id="programme"
        title={isFr ? "Programme" : "Program"}
        subtitle={
          isFr
            ? "Bootcamp Vibe Coding le Jour 1, compétition et pitch le Jour 2."
            : "Vibe Coding bootcamp on Day 1, competition and pitch on Day 2."
        }
      >
        <ol className="relative space-y-6 border-l-2 border-[color:var(--fd-primary)]/25 pl-6">
          {e.program.map((day) => (
            <li key={day.day} className="relative">
              <span className="absolute -left-[1.9rem] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--fd-primary)] text-[11px] font-black text-white">
                {day.day}
              </span>
              <h3 className="text-lg font-black text-[color:var(--fd-text)]">
                {isFr ? day.titleFr : day.titleEn}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {(isFr ? day.itemsFr : day.itemsEn).map((item) => (
                  <li key={item} className="text-sm text-[color:var(--fd-muted)]">
                    · {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      {/* Register */}
      <Section
        id="register"
        title={isFr ? "Inscription participant" : "Participant registration"}
        subtitle={
          isFr
            ? "Après paiement, vous recevez un ticket QR McBuleli par e-mail."
            : "After payment you receive a McBuleli QR ticket by email."
        }
      >
        <div className="rounded-[1.75rem] border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 sm:p-7">
          <HackathonParticipantForm
            editionId={e.id}
            locale={locale}
            priceDay1={e.priceDay1Usd}
            priceFull={e.priceFullUsd}
            registrationOpen={open}
          />
        </div>
      </Section>

      {/* Partner / Sponsor */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Section
          id="partner"
          title={isFr ? "Devenir partenaire" : "Become a partner"}
        >
          <div className="rounded-[1.75rem] border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5">
            <HackathonPartnerForm editionId={e.id} locale={locale} />
          </div>
        </Section>
        <Section id="sponsor" title={isFr ? "Sponsoriser" : "Sponsor"}>
          <div className="rounded-[1.75rem] border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5">
            <HackathonSponsorForm editionId={e.id} locale={locale} />
          </div>
        </Section>
      </div>

      {/* Jury / Mentors */}
      <Section title="Jury" subtitle={isFr ? "Ils évaluent les projets." : "They evaluate the projects."}>
        <PersonGrid
          people={data.jury}
          empty={isFr ? "Jury bientôt annoncé." : "Jury coming soon."}
        />
      </Section>
      <Section
        title={isFr ? "Mentors" : "Mentors"}
        subtitle={isFr ? "Ils accompagnent les équipes." : "They coach the teams."}
      >
        <PersonGrid
          people={data.mentors}
          empty={isFr ? "Mentors bientôt annoncés." : "Mentors coming soon."}
        />
      </Section>

      {/* Prizes */}
      <Section
        title={isFr ? "Prix & catégories" : "Prizes & categories"}
        subtitle={
          isFr
            ? "Récompenses pour les meilleures applications et impacts."
            : "Awards for the best apps and impact."
        }
      >
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {e.prizes.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/50 px-3 py-3 text-center text-sm font-bold text-[color:var(--fd-primary)]"
            >
              {isFr ? p.labelFr : p.labelEn}
            </li>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section title="FAQ">
        <ul className="space-y-3">
          {faq.map((item) => (
            <li
              key={item.q}
              className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-3"
            >
              <p className="font-bold text-[color:var(--fd-text)]">{item.q}</p>
              <p className="mt-1 text-sm text-[color:var(--fd-muted)]">{item.a}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Gallery */}
      <Section
        title={isFr ? "Galerie" : "Gallery"}
        subtitle={
          isFr
            ? "Photos et vidéos des éditions — bientôt enrichie."
            : "Photos and videos from past editions — growing soon."
        }
      >
        {e.gallery.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {e.gallery.map((g, i) => (
              <li key={`${g.url}-${i}`} className="overflow-hidden rounded-2xl bg-[color:var(--fd-mint)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt="" className="aspect-video w-full object-cover" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex aspect-video items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-xs font-bold text-[color:var(--fd-primary)]/60"
              >
                {isFr ? "Bientôt" : "Soon"}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Logos */}
      <Section title={isFr ? "Partenaires" : "Partners"}>
        {data.partnerLogos.length ? (
          <ul className="flex flex-wrap gap-4">
            {data.partnerLogos.map((p) => (
              <li
                key={p.id}
                className="flex h-14 min-w-[7rem] items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-white px-4 text-sm font-bold text-[color:var(--fd-muted)]"
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
        ) : (
          <p className="text-sm text-[color:var(--fd-muted)]">
            {isFr ? "Rejoignez les partenaires fondateurs." : "Join as a founding partner."}
          </p>
        )}
      </Section>

      <Section title="Sponsors">
        {data.sponsorLogos.length ? (
          <ul className="flex flex-wrap gap-4">
            {data.sponsorLogos.map((s) => (
              <li
                key={s.id}
                className="flex h-14 min-w-[7rem] flex-col items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-white px-4 text-sm font-bold text-[color:var(--fd-muted)]"
              >
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt={s.name} className="max-h-8 max-w-[120px]" />
                ) : (
                  s.name
                )}
                <span className="text-[10px] uppercase text-[color:var(--fd-primary)]">{s.pack}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[color:var(--fd-muted)]">
            {isFr ? "Packs Bronze → Platinum ouverts." : "Bronze → Platinum packs open."}
          </p>
        )}
      </Section>

      {/* Footer CTA */}
      <footer className="mt-8 rounded-[2rem] bg-[color:var(--fd-primary)] px-6 py-10 text-center text-white sm:px-10">
        <p className="text-2xl font-black tracking-tight sm:text-3xl">
          {isFr
            ? "Construisez votre futur avec l'IA."
            : "Build your future with AI."}
        </p>
        <p className="mt-2 text-sm text-white/80">
          {isFr
            ? "Bootcamps · Hackathons · Compétitions — powered by McBuleli"
            : "Bootcamps · Hackathons · Competitions — powered by McBuleli"}
        </p>
        <a
          href="#register"
          className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[color:var(--fd-primary)]"
        >
          {isFr ? "S'inscrire maintenant" : "Register now"}
        </a>
        <p className="mt-8 text-xs text-white/60">
          <Link href="/" className="underline">
            mcbuleli.org
          </Link>
        </p>
      </footer>
    </div>
  );
}
