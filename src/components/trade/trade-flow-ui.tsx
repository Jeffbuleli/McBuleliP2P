"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useI18n } from "@/components/i18n-provider";

export const tradeFieldCls =
  "w-full rounded-2xl border-2 border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm font-bold text-[color:var(--fd-text)] outline-none focus:border-[color:var(--fd-primary)] focus:ring-2 focus:ring-[color:var(--fd-primary)]/20";

export function TradeFlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`fd-card overflow-hidden p-3 sm:p-4 ${className}`}>{children}</section>
  );
}

export function TradeFlowSectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h3 className="text-sm font-extrabold tracking-tight text-[color:var(--fd-text)]">
        {children}
      </h3>
      {action}
    </div>
  );
}

export function TradeFlowField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-2 block">
      <span className="text-[11px] font-bold text-[color:var(--fd-muted)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function TradeFlowInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${tradeFieldCls} ${props.className ?? ""}`} />;
}

export function TradeFlowSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${tradeFieldCls} ${props.className ?? ""}`} />;
}

export function TradeStatRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">{label}</span>
      <span
        className={`font-mono text-[11px] font-bold tabular-nums text-[color:var(--fd-text)] ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

export function TradePrimaryBtn({
  children,
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`trade-btn-primary w-full rounded-2xl py-3.5 text-sm font-extrabold disabled:opacity-45 active:scale-[0.99] ${className}`}
    >
      {children}
    </button>
  );
}

export function TradeSideBtn({
  active,
  side,
  onClick,
  label,
}: {
  active: boolean;
  side: "long" | "short";
  onClick: () => void;
  label: string;
}) {
  const longCls = active
    ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-primary)] text-white shadow-md"
    : "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]";
  const shortCls = active
    ? "border-rose-500 bg-rose-500 text-white shadow-md"
    : "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 py-3 text-sm font-extrabold transition ${
        side === "long" ? longCls : shortCls
      }`}
    >
      {label}
    </button>
  );
}

export function TradeLeverageChip({
  lv,
  active,
  disabled,
  onClick,
}: {
  lv: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 rounded-xl border-2 py-2 text-xs font-extrabold disabled:opacity-35 ${
        active
          ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-primary)] text-white"
          : "border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/60 text-[color:var(--fd-text)]"
      }`}
    >
      {lv}×
    </button>
  );
}

export function TradeHistoryPager({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: 10 | 20 | 30;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: 10 | 20 | 30) => void;
}) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--fd-border)] pt-2">
      <div className="flex items-center gap-1">
        {([10, 20, 30] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageSizeChange(n)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${
              pageSize === n
                ? "bg-[color:var(--fd-primary)] text-white"
                : "bg-[color:var(--fd-mint-deep)] text-[color:var(--fd-muted)]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border-2 border-[color:var(--fd-border)] bg-white px-2.5 py-1 text-[10px] font-bold disabled:opacity-40"
        >
          {t("trade_ui_hist_prev")}
        </button>
        <span className="min-w-[3rem] text-center text-[10px] font-bold tabular-nums text-[color:var(--fd-muted)]">
          {page + 1}/{totalPages}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border-2 border-[color:var(--fd-border)] bg-white px-2.5 py-1 text-[10px] font-bold disabled:opacity-40"
        >
          {t("trade_ui_hist_next")}
        </button>
      </div>
    </div>
  );
}
