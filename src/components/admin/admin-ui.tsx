import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNavIcon, type AdminNavIconKey } from "@/components/admin/admin-icons";

/** Shared light admin (Console) design tokens — matches app home-theme. */
export const adminCls = {
  page: "space-y-6",
  section: "space-y-4",
  h1: "text-xl font-extrabold tracking-tight text-[color:var(--fd-text)]",
  h2: "text-lg font-extrabold text-[color:var(--fd-text)]",
  muted: "text-sm text-[color:var(--fd-muted)]",
  back: "text-sm font-semibold text-[color:var(--fd-primary)] hover:underline",
  card: "fd-card rounded-2xl p-4",
  listLink:
    "fd-card block rounded-xl p-4 transition hover:border-[color:var(--fd-primary)]/30 active:scale-[0.99]",
  kpiLink:
    "fd-card block rounded-2xl p-4 transition hover:border-[color:var(--fd-primary)]/25 hover:shadow-md active:scale-[0.99]",
  select:
    "rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2 text-sm font-medium text-[color:var(--fd-text)] outline-none focus:border-[color:var(--fd-primary)] focus:ring-2 focus:ring-[color:var(--fd-primary)]/15",
  input:
    "rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2 text-sm text-[color:var(--fd-text)] outline-none focus:border-[color:var(--fd-primary)] focus:ring-2 focus:ring-[color:var(--fd-primary)]/15",
  btnPrimary:
    "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[color:var(--fd-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[color:var(--fd-primary)]/20 active:scale-[0.99] disabled:opacity-50",
  btnSecondary:
    "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-5 py-2.5 text-sm font-bold text-[color:var(--fd-primary)] shadow-sm active:scale-[0.99]",
  error: "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800",
  empty: "fd-card rounded-xl px-4 py-8 text-center text-sm text-[color:var(--fd-muted)]",
  roleBadge:
    "rounded-full bg-[color:var(--fd-mint)] px-2.5 py-0.5 text-xs font-bold capitalize text-[color:var(--fd-primary)]",
  kpiLabel: "text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]",
  kpiValue: "mt-1 text-3xl font-black tabular-nums text-[color:var(--fd-primary)]",
  kpiSub: "mt-2 text-sm text-[color:var(--fd-muted)]",
};

export type AdminNavVariant =
  | "default"
  | "support"
  | "money"
  | "team"
  | "bots"
  | "audit";

const navVariant: Record<AdminNavVariant, string> = {
  default:
    "border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-text)] hover:bg-[color:var(--fd-mint)]",
  support:
    "border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] hover:bg-[color:var(--fd-mint-deep)]",
  money:
    "border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-50",
  team: "border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-50",
  bots: "border-violet-200 bg-violet-50/80 text-violet-900 hover:bg-violet-50",
  audit:
    "border-[color:var(--fd-border)] bg-stone-50 text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]",
};

export function AdminNavLink({
  href,
  variant = "default",
  icon,
  children,
}: {
  href: string;
  variant?: AdminNavVariant;
  icon?: AdminNavIconKey;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[11px] font-bold leading-tight shadow-sm transition active:scale-[0.98] ${navVariant[variant]}`}
    >
      {icon ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/60 bg-white/75 shadow-sm">
          <AdminNavIcon name={icon} />
        </span>
      ) : null}
      <span>{children}</span>
    </Link>
  );
}

export function AdminBackLink({
  href = "/admin",
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={adminCls.back}>
      ← {children}
    </Link>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className={adminCls.h1}>{title}</h2>
        {subtitle ? <p className={`mt-1 max-w-xl ${adminCls.muted}`}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminKpiCard({
  href,
  label,
  value,
  sub,
  meta,
  tone = "primary",
}: {
  href?: string;
  label: string;
  value: ReactNode;
  sub: string;
  meta?: ReactNode;
  tone?: "primary" | "warn";
}) {
  const valueCls =
    tone === "warn"
      ? "mt-1 text-3xl font-black tabular-nums text-rose-600"
      : adminCls.kpiValue;
  const inner = (
    <>
      <p className={adminCls.kpiLabel}>{label}</p>
      <p className={valueCls}>{value}</p>
      <p className={adminCls.kpiSub}>{sub}</p>
      {meta ? <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{meta}</p> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={adminCls.kpiLink}>
        {inner}
      </Link>
    );
  }
  return <div className={adminCls.card}>{inner}</div>;
}

/** In-app confirm (replaces window.confirm / "mcbuleli.org says…"). */
export function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  busy = false,
  tone = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  const lines = message.split("\n").filter(Boolean);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="w-full max-w-md rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="admin-confirm-title"
          className="text-base font-extrabold text-[color:var(--fd-text)]"
        >
          {title}
        </p>
        <div className="mt-2 space-y-1 text-sm text-[color:var(--fd-muted)]">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={adminCls.btnSecondary}
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              tone === "danger"
                ? "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md active:scale-[0.99] disabled:opacity-50"
                : adminCls.btnPrimary
            }
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
