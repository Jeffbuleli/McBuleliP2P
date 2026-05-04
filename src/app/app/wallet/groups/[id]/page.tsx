"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { daysUntil, isReminderDay } from "@/lib/group-savings-reminders";
import { countryLabel } from "@/lib/country-label";

type MemberRow = {
  userId: string;
  role: string;
  status: string;
  email: string;
};

type Dashboard = {
  ok: true;
  group: {
    id: string;
    type: string;
    name: string;
    status: string;
    subscriptionStatus: string;
    nextBillingAt: string | null;
    balanceUsdt: number;
    contributionAmountUsdt: string;
    cycleDurationDays: number;
    paymentRules: string | null;
    me: { role: string; status: string };
  };
  members: MemberRow[];
};

type LedgerRow = {
  id: string;
  entryType: string;
  amount: string;
  createdAt: string;
  meta: Record<string, unknown> | null;
};

export default function GroupDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const { t } = useI18n();
  const id = params.id;
  const [data, setData] = useState<Dashboard | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");

  const me = data?.group.me;
  const canModerate = me?.status === "approved" && (me.role === "admin" || me.role === "co_admin");
  const canAdmin = me?.status === "approved" && me.role === "admin";

  const pendingMembers = useMemo(
    () => (data?.members ?? []).filter((m) => m.status === "pending"),
    [data?.members],
  );

  async function load() {
    setErr(null);
    const res = await fetch(`/api/groups/${id}`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.error ?? "…");
      setData(null);
      return;
    }
    setData(j as Dashboard);
  }

  async function loadLedger() {
    const res = await fetch(`/api/groups/${id}/wallet/history?limit=30`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLedger([]);
      return;
    }
    setLedger((j.entries ?? []) as LedgerRow[]);
  }

  useEffect(() => {
    void load();
    void loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function contribute() {
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsdt: n }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "…");
        return;
      }
      setAmount("");
      await load();
      await loadLedger();
    } finally {
      setBusy(false);
    }
  }

  async function reviewMember(userId: string, accept: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${id}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "…");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="space-y-3 pb-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-stone-900 dark:text-stone-50">
            {t("group_dash_title")}
          </h1>
          <Link href="/app/wallet/groups" className="text-xs font-semibold text-emerald-700 underline dark:text-emerald-400">
            {t("group_back")}
          </Link>
        </div>
        {err ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
            {err}
          </p>
        ) : (
          <p className="text-stone-500">…</p>
        )}
      </div>
    );
  }

  const g = data.group;
  const days = g.nextBillingAt ? daysUntil(g.nextBillingAt) : null;
  const showDueSoon =
    g.subscriptionStatus === "active" && days != null && isReminderDay(days);
  const showOverdue = g.subscriptionStatus === "overdue" && g.status !== "suspended";
  const showSuspended = g.status === "suspended";

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {g.type}
          </p>
          <h1 className="mt-1 truncate text-lg font-bold text-stone-900 dark:text-stone-50">
            {g.name}
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            {t("group_dash_subscription")}: {g.subscriptionStatus} · {t("group_dash_next_billing")}:{" "}
            {g.nextBillingAt ? new Date(g.nextBillingAt).toLocaleDateString() : "—"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <GroupStatusBadge status={g.status} />
          {canAdmin ? (
            <Link
              href={`/app/wallet/groups/${g.id}/settings`}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold dark:border-stone-600"
            >
              {t("group_dash_settings")}
            </Link>
          ) : null}
        </div>
      </div>

      {err ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {err}
        </p>
      ) : null}

      {showSuspended ? (
        <div className="rounded-2xl border border-rose-900/30 bg-rose-950/40 p-4">
          <p className="text-sm font-bold text-rose-200">{t("group_reminder_suspended")}</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
            {t("group_reminder_suspended_body")}
          </p>
        </div>
      ) : showOverdue ? (
        <div className="rounded-2xl border border-amber-900/30 bg-amber-950/30 p-4">
          <p className="text-sm font-bold text-amber-100">{t("group_reminder_overdue")}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            {t("group_reminder_overdue_body")}
          </p>
        </div>
      ) : showDueSoon ? (
        <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/25 p-4">
          <p className="text-sm font-bold text-emerald-100">{t("group_reminder_due_soon")}</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
            {t("group_reminder_due_soon_body")}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {t("group_dash_balance")}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
          {g.balanceUsdt.toFixed(2)} USDT
        </p>
        <p className="mt-2 text-xs text-stone-500">
          {t("group_dash_contribution")}: {Number(g.contributionAmountUsdt).toFixed(2)} USDT ·{" "}
          {t("group_dash_cycle")}: {g.cycleDurationDays}d
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("group_dash_actions")}
        </h2>
        <div className="mt-3 flex gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="10"
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void contribute()}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {t("group_dash_contribute")}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-stone-500">{t("group_dash_contribute_note")}</p>
      </div>

      {canModerate && pendingMembers.length > 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
            {t("group_dash_pending_members")}
          </h2>
          <ul className="mt-2 space-y-2">
            {pendingMembers.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm text-stone-700 dark:text-stone-200">
                  {m.email}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void reviewMember(m.userId, true)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {t("group_accept")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void reviewMember(m.userId, false)}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {t("group_reject")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("group_dash_ledger")}
        </h2>
        {ledger === null ? (
          <p className="text-stone-500">…</p>
        ) : ledger.length === 0 ? (
          <p className="text-sm text-stone-500">{t("group_dash_ledger_empty")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {ledger.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                    {x.entryType}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {new Date(x.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-xs text-stone-700 dark:text-stone-200">
                  {Number(x.amount).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

