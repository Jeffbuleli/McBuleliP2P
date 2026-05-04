"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";

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
    me: { role: string; status: string };
  };
  members: MemberRow[];
};

export default function GroupSettingsPage({ params }: { params: { id: string } }) {
  const { t } = useI18n();
  const id = params.id;
  const [data, setData] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const me = data?.group.me;
  const canAdmin = me?.status === "approved" && me.role === "admin";

  const approvedMembers = useMemo(
    () => (data?.members ?? []).filter((m) => m.status === "approved"),
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
    const d = j as Dashboard;
    setData(d);
    const init: Record<string, boolean> = {};
    for (const m of d.members) {
      if (m.role === "co_admin") init[m.userId] = true;
    }
    setSelected(init);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectedIds = useMemo(() => {
    return Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .slice(0, 3);
  }, [selected]);

  async function saveCoAdmins() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coAdminUserIds: selectedIds }),
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
            {t("group_settings_title")}
          </h1>
          <Link
            href={`/app/wallet/groups/${id}`}
            className="text-xs font-semibold text-emerald-700 underline dark:text-emerald-400"
          >
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
          <Link
            href={`/app/wallet/groups/${id}`}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold dark:border-stone-600"
          >
            {t("group_back")}
          </Link>
        </div>
      </div>

      {err ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {err}
        </p>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("group_settings_subscription")}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
          {t("group_settings_subscription_note")}
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("group_settings_admin_panel")}
        </h2>
        {!canAdmin ? (
          <p className="mt-2 text-sm text-stone-500">{t("group_settings_admin_only")}</p>
        ) : (
          <>
            <p className="mt-2 text-xs text-stone-500">{t("group_settings_coadmins_note")}</p>
            <div className="mt-3 space-y-2">
              {approvedMembers.map((m) => (
                <label
                  key={m.userId}
                  className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950"
                >
                  <span className="min-w-0 truncate text-stone-800 dark:text-stone-200">
                    {m.email}
                    {m.role === "admin" ? (
                      <span className="ml-2 text-[11px] text-stone-500">(admin)</span>
                    ) : null}
                  </span>
                  <input
                    type="checkbox"
                    disabled={busy || m.role === "admin"}
                    checked={Boolean(selected[m.userId])}
                    onChange={(e) =>
                      setSelected((s) => ({ ...s, [m.userId]: e.target.checked }))
                    }
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveCoAdmins()}
              className="mt-4 w-full rounded-xl bg-stone-900 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-stone-50 dark:text-stone-950"
            >
              {t("group_settings_save")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

