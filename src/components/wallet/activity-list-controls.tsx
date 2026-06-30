"use client";

import { useI18n } from "@/components/i18n-provider";
import { IconArrowLeft, IconArrowRight } from "@/components/icons/flow-icons";

export function ActivityListControls({
  sort,
  pageSize,
  page,
  totalPages,
  total,
  onSortChange,
  onPageSizeChange,
  onPageChange,
}: {
  sort: "newest" | "oldest";
  pageSize: number;
  page: number;
  totalPages: number;
  total: number;
  onSortChange: (s: "newest" | "oldest") => void;
  onPageSizeChange: (n: number) => void;
  onPageChange: (p: number) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="fd-card mt-4 space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-[color:var(--fd-muted)]">
          <span>{t("wallet_activity_sort")}</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
            className="rounded-lg border border-[color:var(--fd-border)] bg-white px-2 py-1.5 text-xs font-bold text-[color:var(--fd-text)]"
          >
            <option value="newest">{t("wallet_activity_sort_newest")}</option>
            <option value="oldest">{t("wallet_activity_sort_oldest")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-[color:var(--fd-muted)]">
          <span>{t("wallet_activity_per_page")}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-[color:var(--fd-border)] bg-white px-2 py-1.5 text-xs font-bold text-[color:var(--fd-text)]"
          >
            {[10, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium text-[color:var(--fd-muted)]">
          {total} {t("wallet_activity_total")}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-primary)] disabled:opacity-35 active:scale-95"
            aria-label={t("wallet_page_prev")}
          >
            <IconArrowLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4rem] text-center text-xs font-bold tabular-nums text-[color:var(--fd-text)]">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-primary)] disabled:opacity-35 active:scale-95"
            aria-label={t("wallet_page_next")}
          >
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
