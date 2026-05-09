"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PLATFORM_EXPENSE_CATEGORIES } from "@/lib/platform-expenses-constants";

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t("admin_platform_expenses_title")}</h2>
          <p className="mt-1 max-w-3xl text-sm text-stone-400">
            {t("admin_platform_expenses_sub")}
          </p>
        </div>
        <Link href="/admin" className="text-sm text-amber-200 underline">
          {t("admin_back")}
        </Link>
      </div>

      <p className="text-xs text-stone-500">{t("admin_platform_expenses_acl_hint")}</p>

      {err ? (
        <p className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
          {err}
        </p>
      ) : null}

      {canSubmit ? (
        <div className="rounded-2xl border border-stone-700 bg-stone-900/50 p-4">
          <h3 className="text-sm font-semibold text-stone-200">
            {t("admin_platform_expenses_new_heading")}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-xs text-stone-500">
              {t("admin_platform_expenses_amount")}
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-2 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="block text-xs text-stone-500">
              {t("admin_platform_expenses_currency")}
              <input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-2 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="block text-xs text-stone-500">
              {t("admin_platform_expenses_expense_date")}
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-2 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="block text-xs text-stone-500 sm:col-span-2">
              {t("admin_platform_expenses_category")}
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as (typeof form)["category"] }))
                }
                className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-2 py-2 text-sm text-stone-100"
              >
                {PLATFORM_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {catLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-stone-500 sm:col-span-3">
              {t("admin_platform_expenses_description")}
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-2 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="block text-xs text-stone-500">
              {t("admin_platform_expenses_vendor")}
              <input
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-2 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="block text-xs text-stone-500 sm:col-span-2">
              {t("admin_platform_expenses_attachment")}
              <input
                value={form.attachmentUrl}
                onChange={(e) => setForm((f) => ({ ...f, attachmentUrl: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-2 py-2 text-sm text-stone-100"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busyId !== null}
            onClick={() => void createDraft()}
            className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
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
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              statusFilter === f.key
                ? "border-amber-500 bg-amber-950/40 text-amber-100"
                : "border-stone-600 bg-stone-900/60 text-stone-300"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-700">
        <table className="min-w-[960px] text-left text-sm">
          <thead className="border-b border-stone-800 bg-stone-900/80 text-xs uppercase tracking-wide text-stone-500">
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
          <tbody className="divide-y divide-stone-800">
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
                <tr key={row.id} className="bg-stone-950/40">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-stone-300">
                    {row.expenseDate}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-stone-200">
                    {row.amount} {row.currency}
                  </td>
                  <td className="px-3 py-2 text-stone-400">{catLabel(row.category)}</td>
                  <td className="max-w-[240px] px-3 py-2 text-stone-300">
                    <span className="line-clamp-2">{row.description}</span>
                    {row.vendor ? (
                      <span className="mt-1 block text-xs text-stone-500">{row.vendor}</span>
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
                  <td className="px-3 py-2 text-xs text-stone-400">{row.creatorEmail}</td>
                  <td className="px-3 py-2 text-xs text-stone-300">{statusLabel(row.status)}</td>
                  <td className="space-y-1 px-3 py-2 text-right">
                    {row.status === "rejected" && row.rejectionReason ? (
                      <p className="text-left text-xs text-rose-300/90">{row.rejectionReason}</p>
                    ) : null}
                    {canSubmitRow ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void postAction(row.id, "submit")}
                        className="rounded bg-amber-700/80 px-2 py-1 text-xs font-semibold text-stone-950"
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
                          className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white"
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
                          className="rounded bg-rose-800/80 px-2 py-1 text-xs font-semibold text-white"
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
