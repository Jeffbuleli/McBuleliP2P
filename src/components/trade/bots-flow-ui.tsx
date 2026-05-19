"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import type { BotPlanId } from "@/lib/bot-config";

export const botFieldCls =
  "w-full rounded-2xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[color:var(--fd-text)] outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/25";

export function BotFlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`fd-card p-4 ${className}`}>{children}</section>;
}

export function BotFlowSection({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function BotFlowField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[color:var(--fd-muted)]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function BotFlowInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${botFieldCls} ${props.className ?? ""}`} />;
}

export function BotFlowSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${botFieldCls} ${props.className ?? ""}`} />;
}

export function BotFlowBtn({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger" | "violet" | "amber";
  className?: string;
}) {
  const cls =
    variant === "ghost"
      ? "border-2 border-[color:var(--fd-border)] bg-white text-[color:var(--fd-text)]"
      : variant === "danger"
        ? "bg-rose-600 text-white"
        : variant === "violet"
          ? "bg-violet-700 text-white"
          : variant === "amber"
            ? "fd-btn-sell bg-amber-800 text-white"
            : "fd-btn-soft";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[48px] flex-1 items-center justify-center rounded-2xl text-sm font-bold active:scale-[0.98] disabled:opacity-45 ${cls} ${className}`}
    >
      {children}
    </button>
  );
}

export function BotFlowToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[color:var(--fd-primary)]"
      />
      <span className="text-sm font-semibold text-[color:var(--fd-text)]">{label}</span>
    </label>
  );
}

export function BotFlowError({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900">
      {children}
    </p>
  );
}

export function BotStatusPill({
  tone,
  children,
}: {
  tone: "idle" | "active" | "paused" | "wait" | "open";
  children: ReactNode;
}) {
  const cls =
    tone === "active"
      ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
      : tone === "paused"
        ? "bg-stone-200 text-stone-700"
        : tone === "wait"
          ? "bg-sky-100 text-sky-800"
          : tone === "open"
            ? "bg-amber-100 text-amber-900"
            : "bg-stone-100 text-stone-600";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

const PLAN_BORDER: Record<BotPlanId, string> = {
  dca_spot: "border-l-4 border-l-[color:var(--fd-primary)]",
  grid_spot: "border-l-4 border-l-violet-600",
  futures_um: "border-l-4 border-l-amber-700",
};

export function BotPlanCard({
  planId,
  children,
  className = "",
}: {
  planId: BotPlanId;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`fd-card overflow-hidden p-0 ${PLAN_BORDER[planId]} ${className}`}>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function BotFormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function BotFlowCategory({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bot-category ${className}`}>
      <div className="bot-category__head">
        {icon ? <span className="bot-category__icon">{icon}</span> : null}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}
