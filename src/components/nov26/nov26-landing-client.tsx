"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HackathonParticipantForm } from "@/components/hackathon/hackathon-participant-form";
import {
  HackathonMomoRailLogos,
  HackathonPoweredBy,
} from "@/components/hackathon/hackathon-process-card";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { useI18n } from "@/components/i18n-provider";
import {
  NOV26_DATES_LABEL_EN,
  NOV26_DATES_LABEL_FR,
  NOV26_FAQ,
  NOV26_NAV,
  NOV26_PROGRAM,
  NOV26_TAGLINE_EN,
  NOV26_TAGLINE_FR,
  NOV26_TIME_LABEL_EN,
  NOV26_TIME_LABEL_FR,
  NOV26_TITLE_EN,
  NOV26_TITLE_FR,
  NOV26_TOOL_TAGS,
} from "@/lib/nov26/content";
import { SUPPORT_EMAIL, SUPPORT_WA_PATH } from "@/lib/support-contact";

type Props = {
  basePath?: string;
  editionId: string | null;
  registrationOpen: boolean;
  priceUsd: string;
};

function Nov26Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  band = false,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  band?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 py-10 sm:py-12 ${band ? "bg-[color:var(--hk-surface,var(--fd-card))]" : ""}`}
    >
      <div className="mx-auto max-w-3xl px-4">
        {eyebrow ? (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--hk-accent,var(--fd-primary))]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-black tracking-tight text-[color:var(--hk-text,var(--fd-text))] sm:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

export function Nov26LandingClient({
  basePath = "/nov26",
  editionId,
  registrationOpen,
  priceUsd,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const hubPath = `${basePath}/espace`;
  const registerPath = `${basePath}#register`;
  const loginNext = encodeURIComponent(hubPath);

  const stats = [
    {
      label: isFr ? "Dates" : "Dates",
      value: isFr ? "27–29 nov." : "Nov 27–29",
    },
    {
      label: isFr ? "Horaire" : "Time",
      value: "19h30",
    },
    {
      label: isFr ? "Tarif" : "Fee",
      value: `${priceUsd} $`,
    },
  ];

  return (
    <div className="min-h-dvh bg-[color:var(--hk-page,var(--fd-bg))] text-[color:var(--hk-text,var(--fd-fg))]">
      <LandingTopBar authReturnPath={basePath} />

      {/* Hero compact */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#5c1830] via-[#7a2840] to-[#1F6B43] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-8 pt-6 sm:pb-10 sm:pt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
            {isFr ? "Formation pratique · McBuleli" : "Practical training · McBuleli"}
          </p>
          <h1 className="mt-3 text-2xl font-black leading-[1.15] tracking-tight sm:text-[1.75rem]">
            {isFr ? NOV26_TITLE_FR : NOV26_TITLE_EN}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/90">
            {isFr ? NOV26_TAGLINE_FR : NOV26_TAGLINE_EN}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {NOV26_TOOL_TAGS.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#register"
              className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-[#1F6B43] shadow-sm transition hover:bg-[#EAF6EE]"
            >
              {isFr ? "S'inscrire" : "Register"}
            </a>
            <a
              href="#programme"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {isFr ? "Programme" : "Program"}
            </a>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <dl className="grid grid-cols-3 border-b border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-surface,var(--fd-card))]">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border-r border-[color:var(--hk-border,var(--fd-border))] px-2 py-4 text-center last:border-r-0 sm:px-4"
          >
            <dt className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[color:var(--hk-muted,var(--fd-muted))] sm:text-[10px]">
              {s.label}
            </dt>
            <dd className="mt-1 text-lg font-black tabular-nums text-[color:var(--hk-accent,var(--fd-primary))] sm:text-xl">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Anchor nav */}
      <nav
        className="sticky top-0 z-20 border-b border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-page,var(--fd-bg))]/95 backdrop-blur-md"
        aria-label={isFr ? "Sections" : "Sections"}
      >
        <ul className="mx-auto flex max-w-3xl justify-center gap-1 px-2 py-2 sm:gap-2">
          {NOV26_NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="inline-flex rounded-lg px-3 py-2 text-xs font-bold text-[color:var(--hk-muted,var(--fd-muted))] transition hover:bg-[color:var(--hk-soft,var(--fd-mint))] hover:text-[color:var(--hk-accent,var(--fd-primary))] sm:text-sm"
              >
                {isFr ? item.labelFr : item.labelEn}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Inscription first — like hackathon conversion block */}
      <Nov26Section
        id="register"
        band
        eyebrow={isFr ? "Rejoindre" : "Join"}
        title={isFr ? "Inscrivez-vous" : "Register"}
        subtitle={
          isFr
            ? `${priceUsd} USD · pré-inscription gratuite (rappels e-mail) ou paiement Mobile Money immédiat.`
            : `${priceUsd} USD · free pre-registration (email reminders) or immediate Mobile Money payment.`
        }
      >
        <div className="rounded-2xl bg-[color:var(--hk-page,var(--fd-bg))] p-4 ring-1 ring-[color:var(--hk-border,var(--fd-border))] sm:p-6">
          <HackathonMomoRailLogos
            className="mb-5"
            label={
              isFr ? "Paiement sécurisé · RDC" : "Secure payment · DRC"
            }
          />
          {!editionId ? (
            <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-900 dark:text-amber-200">
              {isFr
                ? "Inscriptions bientôt actives. Contact : hi@mcbuleli.org"
                : "Registration opening soon. Contact: hi@mcbuleli.org"}
            </p>
          ) : (
            <HackathonParticipantForm
              editionId={editionId}
              priceUsd={priceUsd}
              registrationOpen={registrationOpen}
              product="formation"
              registerPath={registerPath}
              hubPath={hubPath}
            />
          )}
          <p className="mt-5 text-center text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
            {isFr ? "Déjà un compte McBuleli ?" : "Already have a McBuleli account?"}{" "}
            <Link
              href={`/login?next=${loginNext}`}
              className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] underline"
            >
              {isFr ? "Se connecter → espace" : "Sign in → hub"}
            </Link>
            <span className="mx-2">·</span>
            <Link
              href={hubPath}
              className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] underline"
            >
              {isFr ? "Mon espace" : "My hub"}
            </Link>
          </p>
        </div>
      </Nov26Section>

      {/* Programme — light cards, not a wall of bullets */}
      <Nov26Section
        id="programme"
        eyebrow={isFr ? "Contenu" : "Curriculum"}
        title={isFr ? "Trois soirées" : "Three evenings"}
        subtitle={
          isFr ? NOV26_DATES_LABEL_FR : NOV26_DATES_LABEL_EN
        }
      >
        <p className="-mt-4 mb-4 text-xs font-medium text-[color:var(--hk-muted,var(--fd-muted))]">
          {isFr ? NOV26_TIME_LABEL_FR : NOV26_TIME_LABEL_EN}
          <span className="mx-2">·</span>
          {isFr ? "Ir Jeff Buleli" : "Ir Jeff Buleli"}
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {NOV26_PROGRAM.map((day) => (
            <li
              key={day.day}
              className="flex flex-col rounded-2xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-surface,var(--fd-card))] p-4"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--hk-accent,var(--fd-primary))]">
                {isFr ? `Jour ${day.day}` : `Day ${day.day}`}
              </span>
              <p className="mt-2 text-sm font-bold leading-snug text-[color:var(--hk-text,var(--fd-text))]">
                {isFr ? day.labelFr.replace(/^Jour \d · /, "") : day.labelEn.replace(/^Day \d · /, "")}
              </p>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
                {(isFr ? day.topicsFr : day.topicsEn)[0]}
              </p>
            </li>
          ))}
        </ul>
      </Nov26Section>

      {/* FAQ */}
      <Nov26Section
        id="faq"
        band
        eyebrow="FAQ"
        title={isFr ? "Questions fréquentes" : "Common questions"}
      >
        <ul className="space-y-2">
          {NOV26_FAQ.map((item) => (
            <li key={item.qFr}>
              <details className="group rounded-xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-page,var(--fd-bg))] open:bg-[color:var(--hk-surface,var(--fd-card))]">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[color:var(--hk-text,var(--fd-text))] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {isFr ? item.qFr : item.qEn}
                    <span className="text-[color:var(--hk-muted,var(--fd-muted))] transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="border-t border-[color:var(--hk-border,var(--fd-border))] px-4 pb-3 pt-2 text-sm leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
                  {isFr ? item.aFr : item.aEn}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </Nov26Section>

      <footer className="border-t border-[color:var(--hk-border,var(--fd-border))] px-4 py-8 text-center">
        <p className="text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
          <a
            href={SUPPORT_WA_PATH}
            className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))]"
          >
            WhatsApp
          </a>
          <span className="mx-2">·</span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))]"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
        <HackathonPoweredBy className="mt-4" />
      </footer>
    </div>
  );
}
