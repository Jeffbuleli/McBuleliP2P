import type { ReactNode } from "react";

export const avecCls = {
  hero:
    "fd-card flex items-center gap-4 rounded-2xl border border-[color:var(--fd-primary)]/15 bg-gradient-to-br from-[color:var(--fd-mint)]/50 to-white p-4",
  /** Savings-app hero: large balance + progress */
  heroBalance:
    "relative overflow-hidden rounded-[1.35rem] border border-[color:var(--fd-primary)]/20 bg-gradient-to-br from-[color:var(--fd-primary)] to-[color:var(--fd-primary-dark,#244a27)] p-5 text-white shadow-lg shadow-[color:var(--fd-primary)]/25",
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
  feedRow:
    "flex items-center justify-between gap-3 border-b border-[color:var(--fd-border)] py-2.5 last:border-0",
  alertChip:
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ring-1",
  checkoutCard:
    "rounded-[1.35rem] border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-4 shadow-sm",
  moneyNote: "text-[10px] leading-snug text-[color:var(--fd-muted)]",
  layoutVue:
    "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 md:items-start",
  hubCard:
    "fd-card block p-3.5 transition active:scale-[0.99] hover:border-[color:var(--fd-primary)]/30",
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

export function AvecFeedRow({
  title,
  meta,
  amount,
}: {
  title: string;
  meta?: string;
  amount?: string;
}) {
  return (
    <div className={avecCls.feedRow}>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[color:var(--fd-text)]">{title}</p>
        {meta ? (
          <p className="truncate text-[10px] text-[color:var(--fd-muted)]">{meta}</p>
        ) : null}
      </div>
      {amount ? (
        <p className="shrink-0 text-sm font-black tabular-nums text-[color:var(--fd-primary)]">
          {amount}
        </p>
      ) : null}
    </div>
  );
}

export function AvecMoneyNote({ children }: { children: ReactNode }) {
  return <p className={avecCls.moneyNote}>{children}</p>;
}

export function AvecSectionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold transition ${
              on
                ? "bg-[color:var(--fd-primary)] text-white"
                : "bg-[color:var(--fd-card)] text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]"
            }`}
          >
            {tab.label}
            {tab.badge && tab.badge > 0 ? (
              <span
                className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] ${
                  on ? "bg-white/25" : "bg-amber-100 text-amber-900"
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
