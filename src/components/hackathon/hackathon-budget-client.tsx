"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
    <div className="space-y-8">
      {snap.exceedsRoom ? (
        <p
          className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-[color:var(--hk-warn-text,#92400e)] ring-1 ring-amber-500/25"
          role="status"
        >
          Effectif prévu ({snap.headcount}) supérieur à la capacité salle (
          {snap.roomCapacity}). À arbitrer : salle plus grande, ou plafonner les
          présents.
        </p>
      ) : null}

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
          Inclus dans la location Silikin
        </h2>
        <p className="mt-2 text-sm text-[color:var(--hk-muted)]">
          {snap.roomOfficialName} · capacité {snap.roomCapacity}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {snap.roomIncluded.map((item) => (
            <li
              key={item}
              className="rounded-full bg-[color:var(--hk-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--hk-text)]"
            >
              {item}
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
          . Projecteur & internet déjà dans le forfait — pas à rebudgéter à part.
        </p>
      </section>

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
          Effectifs
        </h2>
        <div className="mt-3">
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
      </section>

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
          Coûts · {HACKATHON_BUDGET_DAYS} jours
        </h2>
        <div className="mt-3">
          {snap.lines.map((line) => (
            <CostRow
              key={line.id}
              label={line.label}
              detail={line.detail}
              amount={line.amountUsd}
            />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-[color:var(--hk-border)] pt-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--hk-muted)]">
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
      </section>
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
      <main className="relative overflow-hidden">
        {/* Atmosphere */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_srgb,var(--hk-accent)_18%,transparent),transparent_55%),radial-gradient(ellipse_at_90%_10%,color-mix(in_srgb,var(--hk-soft)_80%,transparent),transparent_50%)]"
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--hk-accent)]">
            McBuleli · Prévision budgétaire
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-5xl">
            Hackathon Kinshasa
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[color:var(--hk-muted)]">
            28–29 août 2026 · Silikin Village. Deux hypothèses de salle selon
            l&apos;atteinte de 100 builders — restauration et ops inclus.{" "}
            <a
              href={SILIKIN_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[color:var(--hk-accent)] hover:underline"
            >
              Voir la réservation Silikin
            </a>
          </p>

          {/* Scenario switch */}
          <div
            className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-stretch"
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
                  className={`flex-1 rounded-2xl px-4 py-3.5 text-left transition ${
                    on
                      ? "bg-[color:var(--hk-accent)] text-white shadow-md"
                      : "bg-[color:var(--hk-surface)] text-[color:var(--hk-text)] ring-1 ring-[color:var(--hk-border)] hover:ring-[color:var(--hk-accent)]/40"
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

          <div className="mt-8 rounded-[1.75rem] bg-[color:var(--hk-surface)]/95 p-5 shadow-sm ring-1 ring-[color:var(--hk-border)] backdrop-blur-sm sm:p-8">
            <ScenarioPanel snap={snap} />
          </div>

          {/* Partner seats */}
          <section className="mt-12">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
              Places partenaires (×2)
            </h2>
            <p className="mt-2 text-sm text-[color:var(--hk-muted)]">
              {BUDGET_PARTNER_ORGS.length} organisations ·{" "}
              {BUDGET_PARTNER_ORGS.length * 2} personnes prévues sur site.
            </p>
            <ul className="mt-4 divide-y divide-[color:var(--hk-border)]/80">
              {BUDGET_PARTNER_ORGS.map((org) => (
                <li
                  key={org.slug}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[color:var(--hk-text)]">
                      {org.name}
                    </p>
                    <p className="text-xs text-[color:var(--hk-muted)]">
                      {org.role}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-[color:var(--hk-muted)]">
                    2
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-[color:var(--hk-muted)]">
              Sans place badge :{" "}
              {BUDGET_EXCLUDED_ORGS.map((o) => o.name).join(", ")}.
            </p>
          </section>

          {/* Suggestions */}
          <section className="mt-12">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
              À valider / à ajouter
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[color:var(--hk-muted)]">
              Postes fréquents pour un hackathon de 2 jours — pas encore chiffrés
              dans le total ci-dessus.
            </p>
            <ul className="mt-5 space-y-3">
              {BUDGET_SUGGESTIONS.map((s) => (
                <li key={s.id} className="flex gap-3">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--hk-accent)]"
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--hk-text)]">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--hk-muted)]">
                      {s.why}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-14 text-center text-xs text-[color:var(--hk-muted)]">
            Document de travail · partage partenaires & collaborateurs ·{" "}
            <Link
              href="/hackathon"
              className="font-semibold text-[color:var(--hk-accent)] hover:underline"
            >
              ← Hackathon
            </Link>
          </p>
        </div>
      </main>
    </HkShell>
  );
}
