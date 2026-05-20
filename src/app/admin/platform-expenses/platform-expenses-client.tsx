"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PLATFORM_EXPENSE_CATEGORIES } from "@/lib/platform-expenses-constants";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

export type ExpenseListItem = {
  id: string;
  amount: string;
  currency: string;
  category: string;
  description: string;
  vendor: string | null;
  attachmentUrl: string | null;
  expenseDate: string;
  status: string;
  createdByUserId: string;
  creatorEmail: string;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  paidAt: string | null;
  paidNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialExpenses: ExpenseListItem[];
  meId: string;
  canSubmit: boolean;
  canApprove: boolean;
  isSuperAdmin: boolean;
  initialStatus: string;
};

export function PlatformExpensesClient({
  initialExpenses,
  meId,
  canSubmit,
  canApprove,
  isSuperAdmin,
  initialStatus,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState(initialExpenses);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    amount: "",
    currency: "USD",
    category: PLATFORM_EXPENSE_CATEGORIES[0],
    description: "",
    vendor: "",
    attachmentUrl: "",
    expenseDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setRows(initialExpenses);
    setStatusFilter(initialStatus);
  }, [initialExpenses, initialStatus]);

  async function createDraft() {
    setErr(null);
    const amount = Number(form.amount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr(t("admin_platform_expenses_err"));
      return;
    }
    setBusyId("__new__");
    try {
      const r = await fetch("/api/admin/platform-expenses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: form.currency.trim() || "USD",
          category: form.category,
          description: form.description.trim(),
          vendor: form.vendor.trim() || null,
          attachmentUrl: form.attachmentUrl.trim() || null,
          expenseDate: form.expenseDate,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(typeof j.message === "string" ? j.message : t("admin_platform_expenses_err"));
        return;
      }
      setForm((f) => ({
        ...f,
        amount: "",
        description: "",
        vendor: "",
        attachmentUrl: "",
      }));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function postAction(id: string, path: string, body?: object) {
    setBusyId(id);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/platform-expenses/${id}/${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(typeof j.message === "string" ? j.message : t("admin_platform_expenses_err"));
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const filters = useMemo(
    () =>
      [
        { key: "all", label: t("admin_platform_expenses_filter_all") },
        { key: "draft", label: t("admin_platform_expenses_filter_draft") },
        { key: "submitted", label: t("admin_platform_expenses_filter_submitted") },
        { key: "approved", label: t("admin_platform_expenses_filter_approved") },
        { key: "rejected", label: t("admin_platform_expenses_filter_rejected") },
        { key: "paid", label: t("admin_platform_expenses_filter_paid") },
      ] as const,
    [t],
  );

  function catLabel(c: string) {
    switch (c) {
      case "servers":
        return t("admin_platform_exp_cat_servers");
      case "payroll_agents":
        return t("admin_platform_exp_cat_payroll_agents");
      case "equipment":
        return t("admin_platform_exp_cat_equipment");
      case "software":
        return t("admin_platform_exp_cat_software");
      case "marketing":
        return t("admin_platform_exp_cat_marketing");
      case "compliance":
        return t("admin_platform_exp_cat_compliance");
      default:
        return t("admin_platform_exp_cat_other");
    }
  }

  function statusLabel(s: string) {
    switch (s) {
      case "draft":
        return t("admin_platform_expenses_filter_draft");
      case "submitted":
        return t("admin_platform_expenses_filter_submitted");
      case "approved":
        return t("admin_platform_expenses_filter_approved");
      case "rejected":
        return t("admin_platform_expenses_filter_rejected");
      case "paid":
        return t("admin_platform_expenses_filter_paid");
      default:
        return s;
    }
  }

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={t("admin_platform_expenses_title")}
        subtitle={t("admin_platform_expenses_sub")}
        action={<AdminBackLink>{t("admin_back")}</AdminBackLink>}
      />

      <p className={`text-xs ${adminCls.muted}`}>{t("admin_platform_expenses_acl_hint")}</p>

      {err ? <p className={adminCls.error}>{err}</p> : null}

      {canSubmit ? (
        <div className={adminCls.card}>
          <h3 className={adminCls.h2}>
            {t("admin_platform_expenses_new_heading")}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={`block text-xs ${adminCls.muted}`}>
              {t("admin_platform_expenses_amount")}
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className={`mt-1 w-full ${adminCls.input}`}
              />
            </label>
            <label className={`block text-xs ${adminCls.muted}`}>
              {t("admin_platform_expenses_currency")}
              <input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className={`mt-1 w-full ${adminCls.input}`}
              />
            </label>
            <label className={`block text-xs ${adminCls.muted}`}>
              {t("admin_platform_expenses_expense_date")}
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
                className={`mt-1 w-full ${adminCls.input}`}
              />
            </label>
            <label className={`block text-xs ${adminCls.muted} sm:col-span-2`}>
              {t("admin_platform_expenses_category")}
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as (typeof form)["category"] }))
                }
                className={`mt-1 w-full ${adminCls.input}`}
              >
                {PLATFORM_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {catLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className={`block text-xs ${adminCls.muted} sm:col-span-3`}>
              {t("admin_platform_expenses_description")}
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className={`mt-1 w-full ${adminCls.input}`}
              />
            </label>
            <label className={`block text-xs ${adminCls.muted}`}>
              {t("admin_platform_expenses_vendor")}
              <input
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                className={`mt-1 w-full ${adminCls.input}`}
              />
            </label>
            <label className={`block text-xs ${adminCls.muted} sm:col-span-2`}>
              {t("admin_platform_expenses_attachment")}
              <input
                value={form.attachmentUrl}
                onChange={(e) => setForm((f) => ({ ...f, attachmentUrl: e.target.value }))}
                className={`mt-1 w-full ${adminCls.input}`}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busyId !== null}
            onClick={() => void createDraft()}
            className={`mt-4 ${adminCls.btnPrimary} disabled:opacity-40`}
          >
            {t("admin_platform_expenses_create")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/platform-expenses" : `/admin/platform-expenses?status=${f.key}`}
            className={
              statusFilter === f.key ? adminCls.btnPrimary : adminCls.btnSecondary
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="fd-card overflow-x-auto rounded-2xl">
        <table className="min-w-[960px] text-left text-sm">
          <thead className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 text-xs uppercase tracking-wide text-[color:var(--fd-muted)]">
            <tr>
              <th className="px-3 py-3">{t("admin_platform_expenses_col_date")}</th>
              <th className="px-3 py-3">{t("admin_platform_expenses_col_amount")}</th>
              <th className="px-3 py-3">{t("admin_platform_expenses_col_category")}</th>
              <th className="px-3 py-3">{t("admin_platform_expenses_col_desc")}</th>
              <th className="px-3 py-3">{t("admin_platform_expenses_col_creator")}</th>
              <th className="px-3 py-3">{t("admin_platform_expenses_col_status")}</th>
              <th className="px-3 py-3"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--fd-border)]">
            {rows.map((row) => {
              const own = row.createdByUserId === meId;
              const canSubmitRow =
                canSubmit && row.status === "draft" && (own || isSuperAdmin);
              const canApproveRow =
                canApprove &&
                row.status === "submitted" &&
                (isSuperAdmin || !own);
              const canMarkPaid =
                canApprove && row.status === "approved";

              return (
                <tr key={row.id}>
                  <td className={`whitespace-nowrap px-3 py-2 font-mono text-xs ${adminCls.muted}`}>
                    {row.expenseDate}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-[color:var(--fd-text)]">
                    {row.amount} {row.currency}
                  </td>
                  <td className={`px-3 py-2 ${adminCls.muted}`}>{catLabel(row.category)}</td>
                  <td className={`max-w-[240px] px-3 py-2 ${adminCls.muted}`}>
                    <span className="line-clamp-2">{row.description}</span>
                    {row.vendor ? (
                      <span className={`mt-1 block text-xs ${adminCls.muted}`}>{row.vendor}</span>
                    ) : null}
                    {row.attachmentUrl ? (
                      <a
                        href={row.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-xs text-emerald-400 underline"
                      >
                        file
                      </a>
                    ) : null}
                  </td>
                  <td className={`px-3 py-2 text-xs ${adminCls.muted}`}>{row.creatorEmail}</td>
                  <td className={`px-3 py-2 text-xs ${adminCls.muted}`}>{statusLabel(row.status)}</td>
                  <td className="space-y-1 px-3 py-2 text-right">
                    {row.status === "rejected" && row.rejectionReason ? (
                      <p className="text-left text-xs text-rose-300/90">{row.rejectionReason}</p>
                    ) : null}
                    {canSubmitRow ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void postAction(row.id, "submit")}
                        className={adminCls.btnPrimary}
                      >
                        {t("admin_platform_expenses_submit")}
                      </button>
                    ) : null}
                    {canApproveRow ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void postAction(row.id, "approve")}
                          className={adminCls.btnPrimary}
                        >
                          {t("admin_platform_expenses_approve")}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => {
                            const reason = window.prompt(t("admin_platform_expenses_reject_reason"));
                            if (reason) void postAction(row.id, "reject", { reason });
                          }}
                          className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                        >
                          {t("admin_platform_expenses_reject")}
                        </button>
                      </div>
                    ) : null}
                    {canMarkPaid ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => {
                          const note = window.prompt(t("admin_platform_expenses_paid_note")) ?? "";
                          void postAction(row.id, "paid", { note: note || null });
                        }}
                        className="rounded border border-emerald-600/50 px-2 py-1 text-xs text-emerald-200"
                      >
                        {t("admin_platform_expenses_paid")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
