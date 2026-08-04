"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { HackathonPoweredBy } from "@/components/hackathon/hackathon-process-card";
import { HkShell } from "@/components/hackathon/hk-ui";
import {
  BUDGET_EXCLUDED_ORGS,
  BUDGET_PARTNER_ORGS,
  BUDGET_SUGGESTIONS,
  BUILDERS_TARGET_FULL,
  HACKATHON_BUDGET_DAYS,
  SILIKIN_BOOKING_URL,
  buildBudgetScenario,
  formatUsd,
  type BudgetScenarioId,
  type BudgetSnapshot,
} from "@/lib/hackathon/budget";

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
      className={`rounded-2xl border px-3.5 py-3.5 shadow-[0_10px_28px_-18px_var(--hk-shadow)] backdrop-blur-sm ${
        highlight
          ? "border-[color:var(--hk-accent)] bg-[color:var(--hk-soft)]"
          : "border-[color:var(--hk-border)] bg-[color:var(--hk-surface)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Outer ticket/badge shell. */
function TicketCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`hk-slide-card relative overflow-hidden rounded-[28px] border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] shadow-[0_24px_64px_-30px_var(--hk-shadow)] ${className}`}
    >
      <HackathonAtmosphere decorated />
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
    <span className="inline-flex items-center rounded-full border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--hk-accent)] shadow-sm backdrop-blur-sm">
      {label}
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
}: {
  label: string;
  detail: string;
  amount: number;
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
        {formatUsd(amount)}
      </p>
    </div>
  );
}

function ScenarioPanel({ snap }: { snap: BudgetSnapshot }) {
  return (
    <div className="space-y-5">
      {snap.exceedsRoom ? (
        <SoftCard highlight>
          <p
            className="text-sm leading-relaxed text-[color:var(--hk-warn-text,#92400e)]"
            role="status"
          >
            Effectif prévu ({snap.headcount}) supérieur à la capacité salle (
            {snap.roomCapacity}). À arbitrer : salle plus grande, ou plafonner
            les présents.
          </p>
        </SoftCard>
      ) : null}

      <SoftCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          Inclus dans la location Silikin
        </p>
        <p className="mt-1.5 text-sm font-semibold text-[color:var(--hk-text)]">
          {snap.roomOfficialName}
        </p>
        <p className="mt-0.5 text-xs text-[color:var(--hk-muted)]">
          Capacité {snap.roomCapacity} · {snap.roomUsdPerDay} $/jour
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {snap.roomIncluded.map((item) => (
            <li key={item}>
              <MetaChip label={item} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[color:var(--hk-muted)]">
          Source :{" "}
          <a
            href={SILIKIN_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[color:var(--hk-accent)] hover:underline"
          >
            calendrier OfficeRnD Silikin
          </a>
          . Projecteur & internet déjà dans le forfait - pas à rebudgéter à
          part.
        </p>
      </SoftCard>

      <SoftCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          Effectifs
        </p>
        <div className="mt-2">
          <HeadcountRow
            label="Builders"
            value={snap.builders}
            hint={
              snap.id === "room100"
                ? "Cible 100 inscriptions confirmées"
                : "Places tenues (paid + reserved)"
            }
          />
          <HeadcountRow
            label="Partenaires & intervenants"
            value={snap.partners}
            hint="2 places × 10 organisations"
          />
          <HeadcountRow label="Ambassadeurs" value={snap.ambassadors} />
          <HeadcountRow label="Équipe McBuleli" value={snap.staff} />
          <div className="flex items-baseline justify-between gap-4 pt-3">
            <p className="text-sm font-black text-[color:var(--hk-text)]">
              Total personnes
            </p>
            <p className="font-mono text-xl font-black tabular-nums text-[color:var(--hk-accent)]">
              {snap.headcount}
            </p>
          </div>
        </div>
      </SoftCard>

      <SoftCard>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
          Coûts · {HACKATHON_BUDGET_DAYS} jours
        </p>
        <div className="mt-2">
          {snap.lines.map((line) => (
            <CostRow
              key={line.id}
              label={line.label}
              detail={line.detail}
              amount={line.amountUsd}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-soft)]/70 px-3.5 py-3.5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-muted)]">
              Total prévisionnel
            </p>
            <p className="mt-1 text-xs text-[color:var(--hk-muted)]">
              Hors postes « à valider » ci-dessous
            </p>
          </div>
          <p className="font-mono text-3xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-4xl">
            {formatUsd(snap.totalUsd)}
          </p>
        </div>
        <p className="mt-2 text-right text-xs text-[color:var(--hk-muted)]">
          ≈ {formatUsd(snap.totalUsd / Math.max(1, snap.headcount))} / personne
          sur l&apos;événement
        </p>
      </SoftCard>
    </div>
  );
}

export function HackathonBudgetClient({
  buildersHeld,
}: {
  buildersHeld: number;
}) {
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
      <div className="hackathon-theme relative min-h-dvh overflow-hidden">
        <HackathonAtmosphere variant="page" />

        <main className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[color:var(--hk-accent)]">
            McBuleli · Prévision budgétaire
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-5xl">
            Hackathon Kinshasa
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[color:var(--hk-muted)]">
            28-29 août 2026 · Silikin Village. Deux hypothèses de salle selon
            l&apos;atteinte de 100 builders - restauration et ops inclus.{" "}
            <a
              href={SILIKIN_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[color:var(--hk-accent)] hover:underline"
            >
              Voir la réservation Silikin
            </a>
          </p>

          <div
            className="mt-8 grid gap-2 sm:grid-cols-2"
            role="tablist"
            aria-label="Scénario budgétaire"
          >
            {(
              [
                {
                  id: "room37" as const,
                  title: "Salle 37",
                  sub: `${buildersHeld} builders tenus`,
                },
                {
                  id: "room100" as const,
                  title: "Salle 100",
                  sub: "Si 100 builders",
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
            {snap.lede} Alternative :{" "}
            <button
              type="button"
              className="font-semibold text-[color:var(--hk-accent)] hover:underline"
              onClick={() =>
                setScenario(scenario === "room37" ? "room100" : "room37")
              }
            >
              {other.label} → {formatUsd(other.totalUsd)}
            </button>
          </p>

          <TicketCard className="mt-8">
            <ScenarioPanel snap={snap} />
          </TicketCard>

          <TicketCard className="mt-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
              Places partenaires (×2)
            </p>
            <p className="mt-2 text-sm text-[color:var(--hk-muted)]">
              {BUDGET_PARTNER_ORGS.length} organisations ·{" "}
              {BUDGET_PARTNER_ORGS.length * 2} personnes prévues sur site.
            </p>
            <ul className="mt-4 space-y-2">
              {BUDGET_PARTNER_ORGS.map((org) => (
                <li key={org.slug}>
                  <SoftCard className="!py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[color:var(--hk-text)]">
                          {org.name}
                        </p>
                        <p className="text-xs text-[color:var(--hk-muted)]">
                          {org.role}
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
              Sans place badge :{" "}
              {BUDGET_EXCLUDED_ORGS.map((o) => o.name).join(", ")}.
            </p>
          </TicketCard>

          <TicketCard className="mt-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
              À valider / à ajouter
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-muted)]">
              Postes fréquents pour un hackathon de 2 jours - pas encore
              chiffrés dans le total ci-dessus.
            </p>
            <ul className="mt-4 space-y-2">
              {BUDGET_SUGGESTIONS.map((s) => (
                <li key={s.id}>
                  <SoftCard className="!py-2.5">
                    <p className="text-sm font-semibold text-[color:var(--hk-text)]">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--hk-muted)]">
                      {s.why}
                    </p>
                  </SoftCard>
                </li>
              ))}
            </ul>
          </TicketCard>

          <p className="mt-10 text-center text-xs text-[color:var(--hk-muted)]">
            Document de travail · partage partenaires & collaborateurs ·{" "}
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
