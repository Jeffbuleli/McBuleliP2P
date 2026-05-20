"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { SupportThreadListItem } from "@/lib/support-service";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type PageData = {
  threads: SupportThreadListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminSupportInboxPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<PageData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 20 | 30>(20);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [urgencyFilter, setUrgencyFilter] = useState<
    "all" | "urgent" | "attention"
  >("all");
  const [sort, setSort] = useState<"urgency" | "lastMessage" | "unread" | "status">(
    "urgency",
  );

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const queryString = [
    `page=${page}`,
    `limit=${pageSize}`,
    statusFilter !== "all" ? `status=${statusFilter}` : null,
    urgencyFilter !== "all" ? `urgency=${urgencyFilter}` : null,
    `sort=${sort}`,
  ]
    .filter(Boolean)
    .join("&");

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch(`/api/admin/support/threads?${queryString}`, {
      credentials: "include",
      cache: "no-store",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setData({ threads: [], total: 0, page: 1, pageSize });
      setErr(typeof j.error === "string" ? j.error : "Forbidden");
      return;
    }
    setData({
      threads: (j.threads as SupportThreadListItem[]) ?? [],
      total: typeof j.total === "number" ? j.total : 0,
      page: typeof j.page === "number" ? j.page : 1,
      pageSize: typeof j.pageSize === "number" ? j.pageSize : pageSize,
    });
  }, [queryString, pageSize]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(id);
  }, [load]);

  function urgencyBadgeClass(u: string) {
    if (u === "urgent") return "bg-rose-600 text-white";
    if (u === "attention") return "bg-amber-500 text-white";
    if (u === "closed") return "bg-stone-400 text-white";
    return "bg-emerald-700/85 text-white";
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const prevDisabled = !data || data.page <= 1;
  const nextDisabled =
    !data || data.page >= Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className={adminCls.page}>
      <AdminBackLink>{t("admin_nav_dashboard")}</AdminBackLink>
      <AdminPageHeader title={t("admin_support_inbox")} subtitle={t("support_subtitle")} />

      <div className="flex flex-wrap items-end gap-2">
        <label className={`flex flex-col gap-1 ${adminCls.muted}`}>
          <span className="text-xs font-semibold">{t("admin_support_filter_status")}</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as "all" | "open" | "closed");
            }}
            className={adminCls.select}
          >
            <option value="all">{t("admin_support_status_all")}</option>
            <option value="open">{t("admin_support_status_open")}</option>
            <option value="closed">{t("admin_support_status_closed")}</option>
          </select>
        </label>
        <label className={`flex flex-col gap-1 ${adminCls.muted}`}>
          <span className="text-xs font-semibold">{t("admin_support_filter_priority")}</span>
          <select
            value={urgencyFilter}
            onChange={(e) => {
              setPage(1);
              setUrgencyFilter(e.target.value as typeof urgencyFilter);
            }}
            className={adminCls.select}
          >
            <option value="all">{t("admin_support_priority_all")}</option>
            <option value="urgent">{t("admin_support_priority_urgent")}</option>
            <option value="attention">{t("admin_support_priority_attention")}</option>
          </select>
        </label>
        <label className={`flex flex-col gap-1 ${adminCls.muted}`}>
          <span className="text-xs font-semibold">{t("admin_support_sort")}</span>
          <select
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value as typeof sort);
            }}
            className={adminCls.select}
          >
            <option value="urgency">{t("admin_support_sort_priority")}</option>
            <option value="lastMessage">{t("admin_support_sort_last")}</option>
            <option value="unread">{t("admin_support_sort_unread")}</option>
            <option value="status">{t("admin_support_sort_status")}</option>
          </select>
        </label>
        <label className={`flex flex-col gap-1 ${adminCls.muted}`}>
          <span className="text-xs font-semibold">{t("admin_support_page_size")}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value) as 10 | 20 | 30);
            }}
            className={adminCls.select}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </label>
      </div>

      {err ? <p className={adminCls.error}>{err}</p> : null}

      {!data ? (
        <p className={adminCls.empty}>…</p>
      ) : data.total === 0 ? (
        <p className={adminCls.empty}>{t("admin_support_none")}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--fd-border)]">
            <table className="min-w-[720px] w-full divide-y divide-[color:var(--fd-border)] text-sm">
              <thead className="bg-[color:var(--fd-mint)]/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold text-[color:var(--fd-text)]">
                    {t("admin_support_col_priority")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-[color:var(--fd-text)]">
                    {t("admin_support_col_user")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-[color:var(--fd-text)]">
                    {t("admin_support_col_status")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-[color:var(--fd-text)]">
                    {t("admin_support_col_waiting")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-[color:var(--fd-text)]">
                    {t("admin_support_col_last")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-[color:var(--fd-text)]">
                    {t("admin_support_col_preview")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-[color:var(--fd-text)]">
                    {t("admin_support_col_unread")}
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--fd-border)] bg-[color:var(--fd-card)]">
                {data.threads.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${urgencyBadgeClass(
                          r.urgency,
                        )}`}
                      >
                        {t(
                          r.urgency === "urgent"
                            ? "admin_support_pri_urgent"
                            : r.urgency === "attention"
                              ? "admin_support_pri_attention"
                              : r.urgency === "closed"
                                ? "admin_support_pri_closed"
                                : "admin_support_pri_normal",
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-[color:var(--fd-text)]">
                      {r.userLabel}
                    </td>
                    <td className="px-3 py-2 capitalize text-[color:var(--fd-muted)]">
                      {r.status}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[color:var(--fd-muted)]">
                      {r.waitingMinutes}m
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[color:var(--fd-muted)]">
                      {new Date(r.lastMessageAt).toLocaleString(loc)}
                    </td>
                    <td className="max-w-[220px] px-3 py-2">
                      <p className="line-clamp-2 break-words text-xs text-[color:var(--fd-text)]">
                        {r.preview}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">
                      {r.unreadCount > 0 ? (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {r.unreadCount}
                        </span>
                      ) : (
                        <span className="text-[color:var(--fd-muted)]">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/support/${encodeURIComponent(r.id)}`}
                        className={`${adminCls.btnPrimary} whitespace-nowrap !min-h-[40px] !px-4 !py-2 !text-xs`}
                      >
                        {t("admin_support_open")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className={`text-xs ${adminCls.muted}`}>
              {locale === "fr"
                ? `Page ${data.page} · ${data.total} fil(s)`
                : `Page ${data.page} · ${data.total} thread(s)`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={prevDisabled}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={adminCls.btnSecondary}
              >
                {t("admin_support_previous")}
              </button>
              <button
                type="button"
                disabled={nextDisabled}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={adminCls.btnSecondary}
              >
                {t("admin_support_next")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
