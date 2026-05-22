import type { ReactNode } from "react";

export const avecCls = {
  hero:
    "fd-card flex items-center gap-4 rounded-2xl border border-[color:var(--fd-primary)]/15 bg-gradient-to-br from-[color:var(--fd-mint)]/50 to-white p-4",
  kpiGrid: "grid grid-cols-3 gap-2",
  kpi:
    "rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-2.5 py-2 text-center",
  kpiLabel: "text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]",
  kpiValue: "mt-0.5 text-base font-black tabular-nums text-[color:var(--fd-primary)]",
  section: "fd-card rounded-2xl p-4",
  sectionTitle: "text-xs font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]",
  input:
    "w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm font-semibold text-[color:var(--fd-text)] outline-none focus:border-[color:var(--fd-primary)] focus:ring-2 focus:ring-[color:var(--fd-primary)]/15",
  btnPrimary:
    "w-full rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-bold text-white shadow-md shadow-[color:var(--fd-primary)]/20 active:scale-[0.99] disabled:opacity-50",
  btnGhost:
    "rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-xs font-bold text-[color:var(--fd-primary)] active:scale-[0.99] disabled:opacity-50",
  shareChip:
    "flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition",
  shareChipOn:
    "border-[color:var(--fd-primary)] bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]",
  shareChipOff:
    "border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-muted)]",
};

export function AvecKpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className={avecCls.kpi}>
      <p className={avecCls.kpiLabel}>{label}</p>
      <p className={avecCls.kpiValue}>{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">{sub}</p> : null}
    </div>
  );
}
