"use client";

import { AcademyIcon } from "@/components/academy/academy-icon";

type FormationStats = {
  formationTotal: number;
  formationLinkedToUser: number;
  academyEnrolledLaunch: number;
  pendingAcademyEnroll: number;
};

const STEPS: {
  key: keyof FormationStats;
  label: string;
  hint: string;
}[] = [
  { key: "formationTotal", label: "Leads", hint: "/formation" },
  { key: "formationLinkedToUser", label: "Comptes liés", hint: "Compte McBuleli" },
  { key: "academyEnrolledLaunch", label: "Membres", hint: "Cohorte sélectionnée" },
  { key: "pendingAcademyEnroll", label: "En attente", hint: "À activer" },
];

export function AcademyFormationFunnel({
  formation,
  editionTitle,
  onLeads,
  onSync,
  syncing,
  syncMsg,
}: {
  formation: FormationStats;
  editionTitle?: string;
  onLeads: () => void;
  onSync: () => void;
  syncing: boolean;
  syncMsg: string | null;
}) {
  const max = Math.max(formation.formationTotal, 1);

  return (
    <div className="mt-4 space-y-4">
      {editionTitle ? (
        <p className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
          Membres comptés pour : <span className="font-bold">{editionTitle}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-2">
        {STEPS.map((step, i) => {
          const value = formation[step.key];
          const pct = Math.round((value / max) * 100);
          return (
            <div key={step.key} className="flex min-w-[72px] flex-1 items-end gap-1">
              {i > 0 ? (
                <span className="mb-6 shrink-0 text-[10px] text-[color:var(--fd-muted)]" aria-hidden>
                  →
                </span>
              ) : null}
              <div className="flex-1">
                <p className="text-[10px] font-bold text-[color:var(--fd-muted)]">{step.label}</p>
                <p className="text-xl font-black text-[color:var(--fd-primary)]">{value}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--fd-mint)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--fd-primary)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[9px] text-[color:var(--fd-muted)]">{step.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onLeads}
          className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2 text-xs font-bold text-[color:var(--fd-primary)]"
        >
          <AcademyIcon name="chat" className="h-4 w-4" />
          Voir les leads
        </button>
        <button
          type="button"
          disabled={syncing}
          onClick={onSync}
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--fd-primary)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          <AcademyIcon name="wallet" className="h-4 w-4 !text-white" />
          {syncing ? "…" : "Sync formation → Academy"}
        </button>
      </div>
      {syncMsg ? (
        <p className="text-xs font-semibold text-[color:var(--fd-primary)]">{syncMsg}</p>
      ) : null}
    </div>
  );
}
