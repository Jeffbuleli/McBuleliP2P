"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

export function useListPagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const slice = useMemo(() => {
    const start = safePage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const setPageSize = (n: number) => {
    setPageSizeState(n);
    setPage(0);
  };

  return {
    page: safePage,
    pageSize,
    setPage,
    setPageSize,
    slice,
    totalPages,
    total,
  };
}

export function ListPagination({
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  const { t } = useI18n();
  if (total === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--fd-border)] pt-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-[color:var(--fd-border)] px-2 py-1 text-xs font-bold disabled:opacity-40"
          aria-label={t("list_pagination_prev")}
        >
          ←
        </button>
        <span className="px-2 text-[10px] font-semibold tabular-nums text-[color:var(--fd-muted)]">
          {page + 1}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-[color:var(--fd-border)] px-2 py-1 text-xs font-bold disabled:opacity-40"
          aria-label={t("list_pagination_next")}
        >
          →
        </button>
      </div>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="rounded-lg border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-2 py-1 text-[10px] font-semibold"
        aria-label={t("list_pagination_rows")}
      >
        {[10, 20, 30].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
