"use client";

import { useMemo, useState, type ReactNode } from "react";
import { IconChevronLeft, IconChevronRight, IconSort } from "@/components/admin/admin-icons";
import { adminCls } from "@/components/admin/admin-ui";
import { useI18n } from "@/components/i18n-provider";

export type SortDir = "asc" | "desc";

export type AdminTableColumn<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  cell: (row: T) => ReactNode;
  className?: string;
};

export function AdminDataTable<T>({
  rows,
  columns,
  rowKey,
  emptyMessage = "—",
  pageSizeOptions = [10, 20, 30],
  totalLabel,
  initialSortId,
  initialSortDir = "asc",
  toolbar,
  rowClassName,
  onRowClick,
}: {
  rows: T[];
  columns: AdminTableColumn<T>[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  pageSizeOptions?: number[];
  totalLabel?: string;
  initialSortId?: string;
  initialSortDir?: SortDir;
  toolbar?: ReactNode;
  rowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
}) {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10);
  const [sortId, setSortId] = useState<string | null>(initialSortId ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

  const sorted = useMemo(() => {
    if (!sortId) return rows;
    const col = columns.find((c) => c.id === sortId);
    if (!col?.sortValue) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
  }, [rows, columns, sortId, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(id: string) {
    if (sortId === id) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortId(id);
      setSortDir("asc");
    }
    setPage(0);
  }

  const totalText =
    totalLabel ?? t("admin_table_total", { count: sorted.length });

  return (
    <div className="admin-table-wrap space-y-3">
      {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--fd-muted)]">
        <span className="font-semibold tabular-nums">{totalText}</span>
        <label className="flex items-center gap-1.5">
          <span className="font-medium uppercase tracking-wide">
            {t("admin_table_page_size")}
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="admin-table-select"
            aria-label={t("admin_table_page_size")}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sorted.length === 0 ? (
        <p className={adminCls.empty}>{emptyMessage}</p>
      ) : (
        <div className="admin-table-scroll fd-card overflow-hidden rounded-xl">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={`${col.align === "right" ? "text-right" : "text-left"} ${col.className ?? ""}`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.id)}
                        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-[color:var(--fd-primary)]"
                      >
                        {col.header}
                        <IconSort
                          className={
                            sortId === col.id
                              ? "text-[color:var(--fd-primary)]"
                              : "opacity-40"
                          }
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={rowClassName?.(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`${col.align === "right" ? "text-right" : "text-left"} ${col.className ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > 0 ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="admin-table-nav-btn"
            aria-label={t("admin_table_prev")}
          >
            <IconChevronLeft />
          </button>
          <span className="text-xs font-medium tabular-nums text-[color:var(--fd-muted)]">
            {t("admin_table_page_of", {
              current: safePage + 1,
              total: pageCount,
            })}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="admin-table-nav-btn"
            aria-label={t("admin_table_next")}
          >
            <IconChevronRight />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminTotalBadge({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  tone?: "primary" | "warn" | "neutral";
}) {
  const valueCls =
    tone === "warn"
      ? "text-rose-600"
      : tone === "neutral"
        ? "text-[color:var(--fd-text)]"
        : "text-[color:var(--fd-primary)]";
  return (
    <div className="admin-total-badge">
      <p className="admin-total-badge__label">{label}</p>
      <p className={`admin-total-badge__value ${valueCls}`}>{value}</p>
    </div>
  );
}
