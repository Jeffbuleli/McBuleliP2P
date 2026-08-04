"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { HackathonPoweredBy } from "@/components/hackathon/hackathon-process-card";
import { HkShell, useHkLocale } from "@/components/hackathon/hk-ui";
import {
  BUDGET_EXCLUDED_ORGS,
  BUDGET_PARTNER_ORGS,
  BUDGET_SUGGESTIONS,
  BUDGET_TALK_ORGS,
  BUILDERS_TARGET_FULL,
  HACKATHON_BUDGET_DAYS,
  SILIKIN_BOOKING_URL,
  buildBudgetScenario,
  formatUsd,
  type BudgetScenarioId,
  type BudgetSnapshot,
} from "@/lib/hackathon/budget";
import {
  PARTNER_ALREADY_HAVE,
  PARTNER_BUILDER_APPROACH,
  PARTNER_WHY_SUPPORT,
  partnerComplimentaryValueLabel,
} from "@/lib/hackathon/partner-pitch";

/** Nested panel - same language as badge chips / ticket meta cards. */
function SoftCard({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3.5 py-3.5 shadow-[0_10px_28px_-18px_var(--hk-shadow)] ${
        highlight
          ? "border-[color:var(--hk-accent)] bg-[color:var(--hk-soft)]"
          : "border-[color:var(--hk-border)] bg-[color:var(--hk-surface)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Outer ticket/badge shell - no light SVG wash (breaks dark). */
function TicketCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] shadow-[0_24px_64px_-30px_var(--hk-shadow)] ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--hk-dot) 1.2px, transparent 1.5px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 bg-[color:var(--hk-accent)]"
      />
      <div className="relative z-10 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </article>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--hk-accent)] shadow-sm">
      {label}
    </span>
  );
}

function TalkPill({ isFr }: { isFr: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[color:var(--hk-accent)]/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[color:var(--hk-accent)]">
      {isFr ? "Talk" : "Talk"}
    </span>
  );
}

function MentorPill({ isFr }: { isFr: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[color:var(--hk-accent)]/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[color:var(--hk-accent)]">
      {isFr ? "Mentor" : "Mentor"}
    </span>
  );
}

function HeadcountRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[color:var(--hk-border)]/70 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[color:var(--hk-text)]">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-xs text-[color:var(--hk-muted)]">{hint}</p>
        ) : null}
      </div>
      <p className="shrink-0 font-mono text-base font-bold tabular-nums text-[color:var(--hk-text)]">
        {value}
      </p>
    </div>
  );
}

function CostRow({
  label,
  detail,
  amount,
  locale,
}: {
  label: string;
  detail: string;
  amount: number;
  locale: "fr" | "en";
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--hk-border)]/70 py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[color:var(--hk-text)]">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--hk-muted)]">
          {detail}
        </p>
      </div>
      <p className="shrink-0 font-mono text-sm font-bold tabular-nums text-[color:var(--hk-text)]">
        {formatUsd(amount, locale)}
      </p>
    </div>
  );
}

function ScenarioPanel({
  snap,
  isFr,
}: {
  snap: BudgetSnapshot;
  isFr: boolean;
}) {
  const locale = isFr ? "fr" : "en";
  const included = isFr ? snap.roomIncludedFr : snap.roomIncludedEn;

  return (
    <div className="space-y-5">
      {snap.exceedsRoom ? (
        <SoftCard highlight>
          <p
            className="text-sm leading-relaxed text-[color:var(--hk-warn-text)]"
            role="status"
          >
            {isFr
              ? `Effectif prévu (${snap.headcount}) supérieur à la capacité salle (${snap.roomCapacity}). À arbitrer : salle plus grande, ou plafonner les présents.`
              : `Planned headcount (${snap.headcount}) exceeds room capacity (${snap.roomCapacity}). Decide: larger room, or cap attendance.`}
          </p>
        </SoftCard>
      ) : null}

      <SoftCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          {isFr ? "Inclus dans la location Silikin" : "Included with Silikin rental"}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-[color:var(--hk-text)]">
          {snap.roomOfficialName}
        </p>
        <p className="mt-0.5 text-xs text-[color:var(--hk-muted)]">
          {isFr
            ? `Capacité ${snap.roomCapacity} · ${snap.roomUsdPerDay} $/jour`
            : `Capacity ${snap.roomCapacity} · $${snap.roomUsdPerDay}/day`}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {included.map((item) => (
            <li key={item}>
              <MetaChip label={item} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[color:var(--hk-muted)]">
          {isFr ? "Source : " : "Source: "}
          <a
            href={SILIKIN_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[color:var(--hk-accent)] hover:underline"
          >
            {isFr ? "calendrier OfficeRnD Silikin" : "Silikin OfficeRnD calendar"}
          </a>
          {isFr
            ? ". Projecteur & internet déjà dans le forfait - pas à rebudgéter à part."
            : ". Projector & internet already in the package - no separate line item."}
        </p>
      </SoftCard>

      <SoftCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          {isFr ? "Effectifs" : "Headcount"}
        </p>
        <div className="mt-2">
          <HeadcountRow
            label="Builders"
            value={snap.builders}
            hint={
              snap.id === "room100"
                ? isFr
                  ? "Cible 100 inscriptions confirmées"
                  : "Target: 100 confirmed registrations"
                : isFr
                  ? "Places tenues (paid + reserved)"
                  : "Held seats (paid + reserved)"
            }
          />
          <HeadcountRow
            label={isFr ? "Partenaires & intervenants" : "Partners & speakers"}
            value={snap.partners}
            hint={
              isFr
                ? "2 places × 10 organisations"
                : "2 seats × 10 organizations"
            }
          />
          <HeadcountRow
            label={isFr ? "Dont Talks scène" : "Incl. on-stage Talks"}
            value={snap.talkCount}
            hint={
              isFr
                ? "Intervenants qui pitchent leur business"
                : "Partners pitching their business"
            }
          />
          <HeadcountRow
            label={isFr ? "Ambassadeurs" : "Ambassadors"}
            value={snap.ambassadors}
          />
          <HeadcountRow
            label={isFr ? "Équipe McBuleli" : "McBuleli team"}
            value={snap.staff}
          />
          <div className="flex items-baseline justify-between gap-4 pt-3">
            <p className="text-sm font-black text-[color:var(--hk-text)]">
              {isFr ? "Total personnes" : "Total people"}
            </p>
            <p className="font-mono text-xl font-black tabular-nums text-[color:var(--hk-accent)]">
              {snap.headcount}
            </p>
          </div>
        </div>
      </SoftCard>

      <SoftCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          {isFr
            ? `Coûts · ${HACKATHON_BUDGET_DAYS} jours`
            : `Costs · ${HACKATHON_BUDGET_DAYS} days`}
        </p>
        <div className="mt-2">
          {snap.lines.map((line) => (
            <CostRow
              key={line.id}
              label={isFr ? line.labelFr : line.labelEn}
              detail={isFr ? line.detailFr : line.detailEn}
              amount={line.amountUsd}
              locale={locale}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-soft)] px-3.5 py-3.5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-muted)]">
              {isFr ? "Total prévisionnel" : "Projected total"}
            </p>
            <p className="mt-1 text-xs text-[color:var(--hk-muted)]">
              {isFr
                ? "Hors postes « à valider » ci-dessous"
                : "Excludes “to confirm” items below"}
            </p>
          </div>
          <p className="font-mono text-3xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-4xl">
            {formatUsd(snap.totalUsd, locale)}
          </p>
        </div>
        <p className="mt-2 text-right text-xs text-[color:var(--hk-muted)]">
          ≈ {formatUsd(snap.totalUsd / Math.max(1, snap.headcount), locale)}{" "}
          {isFr ? "/ personne sur l'événement" : "/ person for the event"}
        </p>
      </SoftCard>
    </div>
  );
}

function PartnerPitch({ isFr }: { isFr: boolean }) {
  const approach = PARTNER_BUILDER_APPROACH;
  const why = PARTNER_WHY_SUPPORT;

  return (
    <div className="mt-8 space-y-6">
      <TicketCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          {isFr ? "Pour nos partenaires" : "For our partners"}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-3xl">
          {isFr
            ? "Vous êtes déjà acceptés - gratuitement"
            : "You are already accepted - for free"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--hk-muted)]">
          {isFr
            ? "Avant même un soutien financier : McBuleli vous a ouvert la porte. Au-delà d'un Talk, vous présentez votre business et vous formez au Vibe Coding pour améliorer vos services."
            : "Before any financial support: McBuleli opened the door. Beyond a Talk, you present your business and train in Vibe Coding to improve your services."}
        </p>
        <p className="mt-3 inline-flex rounded-full bg-[color:var(--hk-soft)] px-3 py-1 text-xs font-bold text-[color:var(--hk-accent)]">
          {partnerComplimentaryValueLabel(isFr)}
        </p>

        <ul className="mt-5 space-y-2">
          {PARTNER_ALREADY_HAVE.map((item) => (
            <li key={item.titleEn}>
              <SoftCard className="!py-3">
                <p className="text-sm font-semibold text-[color:var(--hk-text)]">
                  {isFr ? item.titleFr : item.titleEn}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--hk-muted)]">
                  {isFr ? item.bodyFr : item.bodyEn}
                </p>
              </SoftCard>
            </li>
          ))}
        </ul>
      </TicketCard>

      <TicketCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          {isFr ? "Approche proposée" : "Proposed approach"}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[color:var(--hk-text)]">
          {isFr ? approach.titleFr : approach.titleEn}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--hk-muted)]">
          {isFr ? approach.ledeFr : approach.ledeEn}
        </p>
        <ol className="mt-5 space-y-2">
          {(isFr ? approach.stepsFr : approach.stepsEn).map((step, i) => (
            <li key={step}>
              <SoftCard className="!py-3" highlight={i === 1}>
                <div className="flex gap-3">
                  <span className="font-mono text-sm font-black text-[color:var(--hk-accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-relaxed text-[color:var(--hk-text)]">
                    {step}
                  </p>
                </div>
              </SoftCard>
            </li>
          ))}
        </ol>
        <SoftCard className="mt-4" highlight>
          <p className="text-sm font-semibold leading-relaxed text-[color:var(--hk-text)]">
            {isFr ? approach.closeFr : approach.closeEn}
          </p>
        </SoftCard>
      </TicketCard>

      <TicketCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          {isFr ? why.titleFr : why.titleEn}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--hk-muted)]">
          {isFr ? why.bodyFr : why.bodyEn}
        </p>
        <p className="mt-4 text-sm font-semibold leading-relaxed text-[color:var(--hk-text)]">
          {isFr ? why.askFr : why.askEn}
        </p>
        <p className="mt-4 text-xs text-[color:var(--hk-muted)]">
          {isFr
            ? "Le détail chiffré suit - transparence totale sur la salle, la restauration et les ops."
            : "The numbered budget follows - full transparency on room, catering and ops."}
        </p>
      </TicketCard>
    </div>
  );
}

export function HackathonBudgetClient({
  buildersHeld,
}: {
  buildersHeld: number;
}) {
  const isFr = useHkLocale();
  const locale = isFr ? "fr" : "en";
  const [scenario, setScenario] = useState<BudgetScenarioId>("room37");

  const snap = useMemo(
    () =>
      buildBudgetScenario({
        id: scenario,
        builders:
          scenario === "room100" ? BUILDERS_TARGET_FULL : buildersHeld,
      }),
    [scenario, buildersHeld],
  );

  const other = useMemo(
    () =>
      buildBudgetScenario({
        id: scenario === "room37" ? "room100" : "room37",
        builders:
          scenario === "room37" ? BUILDERS_TARGET_FULL : buildersHeld,
      }),
    [scenario, buildersHeld],
  );

  return (
    <HkShell authReturnPath="/hackathon/budget">
      <div className="relative min-h-dvh overflow-hidden">
        <HackathonAtmosphere variant="page" />

        <main className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[color:var(--hk-accent)]">
            {isFr
              ? "McBuleli · Partenaires & budget"
              : "McBuleli · Partners & budget"}
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-5xl">
            {isFr
              ? "Pourquoi nous soutenir"
              : "Why support us"}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[color:var(--hk-muted)]">
            {isFr
              ? "Hackathon Kinshasa · 28-29 août 2026 · Silikin Village. Vous gagnez scène, formation et réseau - nous partageons le coût réel de l'événement."
              : "Hackathon Kinshasa · 28-29 Aug 2026 · Silikin Village. You gain stage, training and network - we share the real cost of the event."}{" "}
            <a
              href={SILIKIN_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[color:var(--hk-accent)] hover:underline"
            >
              {isFr ? "Réservation Silikin" : "Silikin booking"}
            </a>
          </p>

          <PartnerPitch isFr={isFr} />

          <p className="mt-10 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
            {isFr ? "Budget prévisionnel" : "Budget forecast"}
          </p>

          <div
            className="mt-4 grid gap-2 sm:grid-cols-2"
            role="tablist"
            aria-label={isFr ? "Scénario budgétaire" : "Budget scenario"}
          >
            {(
              [
                {
                  id: "room37" as const,
                  title: isFr ? "Salle 37" : "37-seat room",
                  sub: isFr
                    ? `${buildersHeld} builders tenus`
                    : `${buildersHeld} builders held`,
                },
                {
                  id: "room100" as const,
                  title: isFr ? "Salle 100" : "100-seat room",
                  sub: isFr ? "Si 100 builders" : "If 100 builders",
                },
              ] as const
            ).map((opt) => {
              const on = scenario === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setScenario(opt.id)}
                  className={`rounded-2xl border px-4 py-3.5 text-left shadow-[0_10px_28px_-18px_var(--hk-shadow)] transition ${
                    on
                      ? "border-[color:var(--hk-accent)] bg-[color:var(--hk-accent)] text-white"
                      : "border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] text-[color:var(--hk-text)] hover:border-[color:var(--hk-accent)]/50"
                  }`}
                >
                  <span className="block text-sm font-black">{opt.title}</span>
                  <span
                    className={`mt-0.5 block text-xs ${on ? "text-white/80" : "text-[color:var(--hk-muted)]"}`}
                  >
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-[color:var(--hk-muted)]">
            {isFr ? snap.ledeFr : snap.ledeEn}{" "}
            {isFr ? "Alternative :" : "Alternative:"}{" "}
            <button
              type="button"
              className="font-semibold text-[color:var(--hk-accent)] hover:underline"
              onClick={() =>
                setScenario(scenario === "room37" ? "room100" : "room37")
              }
            >
              {isFr ? other.labelFr : other.labelEn} →{" "}
              {formatUsd(other.totalUsd, locale)}
            </button>
          </p>

          <TicketCard className="mt-8">
            <ScenarioPanel snap={snap} isFr={isFr} />
          </TicketCard>

          <TicketCard className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
                {isFr ? "Talks & speakers" : "Talks & speakers"}
              </p>
              <MetaChip
                label={
                  isFr
                    ? `${BUDGET_TALK_ORGS.length} talks`
                    : `${BUDGET_TALK_ORGS.length} talks`
                }
              />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-muted)]">
              {isFr
                ? "Ils montent sur scène pour présenter leur business / expertise - pas seulement un logo."
                : "They take the stage to present their business / expertise - not logo-only presence."}
            </p>
            <ul className="mt-4 space-y-2">
              {BUDGET_TALK_ORGS.map((org) => (
                <li key={org.slug}>
                  <SoftCard className="!py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[color:var(--hk-text)]">
                            {org.name}
                          </p>
                          <TalkPill isFr={isFr} />
                        </div>
                        <p className="mt-1 text-xs text-[color:var(--hk-muted)]">
                          {isFr
                            ? org.talkFr ?? org.roleFr
                            : org.talkEn ?? org.roleEn}
                        </p>
                      </div>
                    </div>
                  </SoftCard>
                </li>
              ))}
            </ul>
          </TicketCard>

          <TicketCard className="mt-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
              {isFr
                ? "Places partenaires (×2)"
                : "Partner seats (×2)"}
            </p>
            <p className="mt-2 text-sm text-[color:var(--hk-muted)]">
              {isFr
                ? `${BUDGET_PARTNER_ORGS.length} organisations · ${BUDGET_PARTNER_ORGS.length * 2} personnes prévues sur site.`
                : `${BUDGET_PARTNER_ORGS.length} organizations · ${BUDGET_PARTNER_ORGS.length * 2} people expected on site.`}
            </p>
            <ul className="mt-4 space-y-2">
              {BUDGET_PARTNER_ORGS.map((org) => (
                <li key={org.slug}>
                  <SoftCard className="!py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[color:var(--hk-text)]">
                            {org.name}
                          </p>
                          {org.talk ? <TalkPill isFr={isFr} /> : null}
                          {org.kind === "mentor" ? (
                            <MentorPill isFr={isFr} />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-[color:var(--hk-muted)]">
                          {isFr ? org.roleFr : org.roleEn}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-[color:var(--hk-accent)]">
                        2
                      </span>
                    </div>
                  </SoftCard>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-[color:var(--hk-muted)]">
              {isFr ? "Sans place badge : " : "No door badge: "}
              {BUDGET_EXCLUDED_ORGS.map((o) => o.name).join(", ")}.
            </p>
          </TicketCard>

          <TicketCard className="mt-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
              {isFr ? "À valider / à ajouter" : "To confirm / add"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-muted)]">
              {isFr
                ? "Postes fréquents pour un hackathon de 2 jours - pas encore chiffrés dans le total ci-dessus."
                : "Common line items for a 2-day hackathon - not yet priced in the total above."}
            </p>
            <ul className="mt-4 space-y-2">
              {BUDGET_SUGGESTIONS.map((s) => (
                <li key={s.id}>
                  <SoftCard className="!py-2.5">
                    <p className="text-sm font-semibold text-[color:var(--hk-text)]">
                      {isFr ? s.labelFr : s.labelEn}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--hk-muted)]">
                      {isFr ? s.whyFr : s.whyEn}
                    </p>
                  </SoftCard>
                </li>
              ))}
            </ul>
          </TicketCard>

          <p className="mt-10 text-center text-xs text-[color:var(--hk-muted)]">
            {isFr
              ? "Document de travail · partage partenaires & collaborateurs · "
              : "Working document · for partners & collaborators · "}
            <Link
              href="/hackathon"
              className="font-semibold text-[color:var(--hk-accent)] hover:underline"
            >
              ← Hackathon
            </Link>
          </p>

          <HackathonPoweredBy />
        </main>
      </div>
    </HkShell>
  );
}
