"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useI18n } from "@/components/i18n-provider";

export const tradeFieldCls =
  "w-full rounded-2xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm font-semibold text-[color:var(--fd-text)] outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/25";

export function TradeFlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`fd-card p-3 sm:p-4 ${className}`}>{children}</section>;
}

export function TradeFlowSectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{children}</h3>
      {action}
    </div>
  );
}

export function TradeFlowInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${tradeFieldCls} ${props.className ?? ""}`} />;
}

export function TradeFlowSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${tradeFieldCls} ${props.className ?? ""}`} />;
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
            className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
              pageSize === n
                ? "bg-[color:var(--fd-primary)] text-white"
                : "bg-[color:var(--fd-mint)] text-[color:var(--fd-muted)]"
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
          className="rounded-lg border border-[color:var(--fd-border)] px-2.5 py-1 text-[10px] font-bold disabled:opacity-40"
        >
          {t("trade_ui_hist_prev")}
        </button>
        <span className="min-w-[3rem] text-center text-[10px] font-semibold tabular-nums text-[color:var(--fd-muted)]">
          {page + 1}/{totalPages}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-[color:var(--fd-border)] px-2.5 py-1 text-[10px] font-bold disabled:opacity-40"
        >
          {t("trade_ui_hist_next")}
        </button>
      </div>
    </div>
  );
}
