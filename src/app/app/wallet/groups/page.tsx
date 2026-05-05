"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { clientErrorText } from "@/lib/client-error-text";

type Row = {
  groupId: string;
  name: string;
  type: string;
  status: string;
  subscriptionStatus: string;
  nextBillingAt: string | null;
  role: string;
  membershipStatus: string;
  createdAt: string;
};

export default function GroupsHubPage() {
  const { t } = useI18n();
  const sp = useSearchParams();
  const typeFilter = (sp.get("type") ?? "").trim();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    void (async () => {
      const res = await fetch("/api/groups/mine", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "…");
        setRows([]);
        return;
      }
      setRows((data.groups ?? []) as Row[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    const base = rows ?? [];
    if (!typeFilter) return base;
    return base.filter((r) => r.type === typeFilter);
  }, [rows, typeFilter]);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 dark:text-stone-50">
            {t("group_hub_title")}
          </h1>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {t("group_hub_sub")}
          </p>
        </div>
        <Link
          href="/app/wallet/groups/new"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
        >
          {t("group_hub_create")}
        </Link>
      </div>

      {err ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      {rows === null ? (
        <p className="text-stone-500">…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {t("group_hub_empty")}
          </p>
          <p className="mt-2 text-xs text-stone-500">{t("group_hub_empty_hint")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.groupId}>
              <Link
                href={`/app/wallet/groups/${r.groupId}`}
                className="block rounded-2xl border border-stone-200 bg-white p-4 transition active:scale-[0.99] dark:border-stone-700 dark:bg-stone-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      {r.type}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-stone-900 dark:text-stone-50">
                      {r.name}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {t("group_hub_role")}: {r.role} · {t("group_hub_sub_status")}:{" "}
                      {r.subscriptionStatus}
                    </p>
                  </div>
                  <GroupStatusBadge status={r.status} />
                </div>
                <p className="mt-2 text-[11px] text-stone-500">
                  {t("group_hub_next_billing")}:{" "}
                  {r.nextBillingAt ? new Date(r.nextBillingAt).toLocaleDateString() : "—"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

