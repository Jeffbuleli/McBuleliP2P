"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";

type Row = {
  id: string;
  type: string;
  name: string;
  status: string;
  subscriptionStatus: string;
  contributionAmountUsdt: string;
  cycleDurationDays: number;
  countryCode: string | null;
  createdAt: string;
  createdByEmail: string;
};

export default function AdminGroupsPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    setErr(null);
    void (async () => {
      const q = new URLSearchParams();
      q.set("status", status);
      const res = await fetch(`/api/admin/groups?${q.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message ?? "…");
        setRows([]);
        return;
      }
      setRows((data.groups ?? []) as Row[]);
    })();
  }, [status]);

  if (rows === null) return <p className="text-stone-500">…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-white">{t("admin_groups")}</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-stone-600 bg-stone-900 px-2 py-1 text-sm text-stone-200"
        >
          <option value="pending">{t("admin_pending")}</option>
          <option value="approved">{t("admin_approved")}</option>
          <option value="active">{t("admin_active")}</option>
          <option value="suspended">{t("admin_suspended")}</option>
          <option value="rejected">{t("admin_rejected")}</option>
          <option value="all">{t("admin_all")}</option>
        </select>
        <Link href="/admin" className="ml-auto text-sm text-amber-200 underline">
          {t("admin_back")}
        </Link>
      </div>
      {err ? <p className="mb-2 text-rose-400">{err}</p> : null}
      {rows.length === 0 ? (
        <p className="text-stone-500">—</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/groups/${r.id}`}
                className="block rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-3 transition hover:border-amber-600/50"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="min-w-0 font-mono text-sm text-amber-100/90">
                    <span className="mr-1 inline-block rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                      {r.type}
                    </span>
                    <span className="break-all">{r.name}</span>
                  </span>
                  <span className="text-xs text-stone-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-300">{r.createdByEmail}</p>
                <p className="mt-1 text-xs text-amber-100/80">
                  {r.status} · {r.subscriptionStatus} · {r.contributionAmountUsdt} USDT ·{" "}
                  {r.cycleDurationDays}d
                  {r.countryCode ? ` · ${countryLabel(locale, r.countryCode)}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

