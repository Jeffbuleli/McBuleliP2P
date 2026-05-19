"use client";

import Link from "next/link";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { IconCheck } from "@/components/icons/flow-icons";

export function P2pFlowShell({
  title,
  subtitle,
  backHref = "/app/p2p",
  headerBadge,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  headerBadge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="wallet-theme -mx-1 pb-10">
      <WalletSubpageHeader
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        badge={headerBadge}
      />
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function FlowSection({
  title,
  hint,
  children,
  action,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="fd-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[color:var(--fd-text)]">{title}</h2>
          {hint ? <p className="text-[10px] text-[color:var(--fd-muted)]">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FlowField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[color:var(--fd-text)]">{label}</span>
      {hint ? <span className="ml-1 text-[10px] text-[color:var(--fd-muted)]">· {hint}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-2xl border border-[color:var(--fd-border)] bg-white px-3 py-3 text-sm text-[color:var(--fd-text)] outline-none ring-[color:var(--fd-primary)]/30 focus:ring-2";

export function FlowInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function FlowTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function FlowSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function FlowSegment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`relative rounded-2xl border-2 py-3 text-sm font-bold transition ${
              on
                ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
                : "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]"
            }`}
          >
            {on ? (
              <span className="absolute right-2 top-2 text-[color:var(--fd-primary)]">
                <IconCheck className="h-3.5 w-3.5" />
              </span>
            ) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FlowChipGrid({
  items,
  selected,
  onToggle,
  configured,
}: {
  items: { code: string; label: string }[];
  selected: string[];
  onToggle: (code: string) => void;
  configured?: Set<string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((d) => {
        const on = selected.includes(d.code);
        const ready = !configured || configured.has(d.code);
        return (
          <button
            key={d.code}
            type="button"
            onClick={() => onToggle(d.code)}
            className={`relative rounded-2xl border-2 px-2 py-2.5 text-left text-xs font-semibold transition ${
              on
                ? ready
                  ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
                  : "border-amber-500 bg-amber-50 text-amber-900"
                : "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-text)]"
            }`}
          >
            {on && ready ? (
              <span className="absolute right-1.5 top-1.5 text-[color:var(--fd-primary)]">
                <IconCheck className="h-3 w-3" />
              </span>
            ) : null}
            <span className="block pr-4 leading-tight">{d.label}</span>
            {!ready ? (
              <span className="mt-0.5 block text-[9px] font-medium text-amber-700">!</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function FlowAmountBox({
  label,
  amount,
  unit,
}: {
  label: string;
  amount: string;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--fd-border)] bg-stone-50/80 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-[color:var(--fd-text)]">
        {amount} <span className="text-lg font-semibold text-[color:var(--fd-muted)]">{unit}</span>
      </p>
    </div>
  );
}

export function FlowUploadZone({
  label,
  hint,
  busy,
  hasFile,
  onPick,
}: {
  label: string;
  hint?: string;
  busy?: boolean;
  hasFile?: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <label className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color:var(--fd-border)] bg-stone-50/50 px-4 py-6 transition hover:bg-[color:var(--fd-mint)]/40">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.currentTarget.value = "";
        }}
      />
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
        {hasFile ? <IconCheck className="h-5 w-5" /> : "+"}
      </span>
      <span className="text-xs font-bold text-[color:var(--fd-text)]">{busy ? "…" : label}</span>
      {hint ? <span className="text-[10px] text-[color:var(--fd-muted)]">{hint}</span> : null}
    </label>
  );
}

export function FlowPrimaryBtn({
  children,
  disabled,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost";
}) {
  const cls =
    variant === "danger"
      ? "bg-rose-600 text-white"
      : variant === "ghost"
        ? "border-2 border-[color:var(--fd-border)] bg-white text-[color:var(--fd-text)]"
        : "bg-gradient-to-br from-[color:var(--fd-primary)] to-[color:var(--fd-primary-dark)] text-white";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-md active:scale-[0.98] disabled:opacity-45 ${cls}`}
    >
      {children}
    </button>
  );
}

export function FlowError({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-800">
      {children}
    </p>
  );
}

export function FlowKvCard({ rows }: { rows: { k: string; v: string }[] }) {
  return (
    <div className="fd-card divide-y divide-[color:var(--fd-border)] p-0">
      {rows.map((r) => (
        <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <span className="text-[color:var(--fd-muted)]">{r.k}</span>
          <span className="max-w-[60%] truncate text-right font-semibold text-[color:var(--fd-text)]">
            {r.v}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FlowProfileLink({ label }: { label: string }) {
  return (
    <Link
      href="/app/profile/payments"
      className="text-[10px] font-bold text-[color:var(--fd-primary)] underline"
    >
      {label}
    </Link>
  );
}
