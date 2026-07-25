"use client";

import Link from "next/link";
import {
  HACKATHON_PHASES,
  actorLabel,
  deriveCurrentPhaseId,
  type HackathonPhaseId,
} from "@/lib/hackathon/phases";

export function HackathonPhaseStepper({
  isFr,
  currentId,
  compact = false,
}: {
  isFr: boolean;
  currentId: HackathonPhaseId;
  compact?: boolean;
}) {
  const currentOrder =
    HACKATHON_PHASES.find((p) => p.id === currentId)?.order ?? 1;

  return (
    <ol className="space-y-2">
      {HACKATHON_PHASES.map((phase) => {
        const active = phase.id === currentId;
        const done = phase.order < currentOrder;
        return (
          <li key={phase.id}>
            <a
              href={phase.hubAnchor ? `#${phase.hubAnchor}` : undefined}
              className={`block rounded-xl px-3.5 py-3 ring-1 transition ${
                active
                  ? "bg-[color:var(--hk-soft,var(--fd-mint))] ring-[color:var(--hk-accent,var(--fd-primary))]"
                  : done
                    ? "bg-[color:var(--hk-page,var(--fd-bg))] ring-[color:var(--hk-border,var(--fd-border))] opacity-80"
                    : "bg-[color:var(--hk-surface,var(--fd-card))]/60 ring-[color:var(--hk-border,var(--fd-border))] opacity-70"
              } ${phase.hubAnchor ? "hover:opacity-100" : "pointer-events-none"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                    active
                      ? "bg-[color:var(--hk-accent,var(--fd-primary))] text-white"
                      : done
                        ? "bg-emerald-500/20 text-emerald-700"
                        : "bg-[color:var(--hk-page,var(--fd-bg))] text-[color:var(--hk-muted,var(--fd-muted))]"
                  }`}
                >
                  {phase.order}
                </span>
                <span className="text-sm font-bold text-[color:var(--hk-text,var(--fd-text))]">
                  {isFr ? phase.titleFr : phase.titleEn}
                </span>
                {active ? (
                  <span className="rounded-full bg-[color:var(--hk-accent,var(--fd-primary))]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--hk-accent,var(--fd-primary))]">
                    {isFr ? "Étape actuelle" : "Current"}
                  </span>
                ) : null}
                {phase.core ? null : (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--hk-muted,var(--fd-muted))]">
                    {phase.id === "incubation"
                      ? isFr
                        ? "Après"
                        : "After"
                      : isFr
                        ? "Avant"
                        : "Before"}
                  </span>
                )}
              </div>
              {!compact ? (
                <>
                  <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
                    {isFr ? phase.bodyFr : phase.bodyEn}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {phase.actors.map((id) => (
                      <span
                        key={id}
                        className="rounded-full bg-[color:var(--hk-page,var(--fd-bg))] px-2 py-0.5 text-[10px] font-bold text-[color:var(--hk-text,var(--fd-text))] ring-1 ring-[color:var(--hk-border,var(--fd-border))]"
                      >
                        {actorLabel(id, isFr)}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function HackathonLandingJourney({ isFr }: { isFr: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {HACKATHON_PHASES.map((phase) => (
        <article
          key={phase.id}
          className="rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))]/90 p-4 shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))]"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--hk-accent,var(--fd-primary))]">
            {isFr ? `Étape ${phase.order}` : `Step ${phase.order}`}
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--hk-text,var(--fd-text))]">
            {isFr ? phase.titleFr : phase.titleEn}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
            {isFr ? phase.bodyFr : phase.bodyEn}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {phase.actors.map((id) => (
              <span
                key={id}
                className="rounded-full bg-[color:var(--hk-soft,var(--fd-mint))] px-2 py-0.5 text-[10px] font-bold text-[color:var(--hk-accent,var(--fd-primary))]"
              >
                {actorLabel(id, isFr)}
              </span>
            ))}
          </div>
          {phase.id === "deliberation" ? (
            <p className="mt-3 text-xs">
              <Link
                href="/hackathon/jury"
                className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:underline"
              >
                {isFr ? "Espace jury →" : "Jury space →"}
              </Link>
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export { deriveCurrentPhaseId };
