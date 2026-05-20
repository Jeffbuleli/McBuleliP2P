"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

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

function AdminGroupsContent() {
  const { t, locale } = useI18n();
  const sp = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState(() => sp.get("status") ?? "pending");
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    () => sp.get("subscriptionStatus") ?? "",
  );

  useEffect(() => {
    setErr(null);
    void (async () => {
      const q = new URLSearchParams();
      q.set("status", status);
      if (subscriptionStatus) {
        q.set("subscriptionStatus", subscriptionStatus);
      }
      const res = await fetch(`/api/admin/groups?${q.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message ?? "…");
        setRows([]);
        return;
      }
      setRows((data.groups ?? []) as Row[]);
    })();
  }, [status, subscriptionStatus]);

  if (rows === null) return <p className={adminCls.muted}>…</p>;

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={t("admin_groups")}
        action={<AdminBackLink>{t("admin_back")}</AdminBackLink>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={adminCls.select}
          aria-label={t("admin_status")}
        >
          <option value="pending">{t("admin_pending")}</option>
          <option value="approved">{t("admin_approved")}</option>
          <option value="active">{t("admin_active")}</option>
          <option value="approved,active">{t("admin_groups_lifecycle_approved_active")}</option>
          <option value="suspended">{t("admin_suspended")}</option>
          <option value="rejected">{t("admin_rejected")}</option>
          <option value="all">{t("admin_all")}</option>
        </select>
        <select
          value={subscriptionStatus}
          onChange={(e) => setSubscriptionStatus(e.target.value)}
          className={adminCls.select}
          aria-label={t("admin_subscription")}
        >
          <option value="">{t("admin_groups_sub_any")}</option>
          <option value="active">{t("admin_subscription_state_active")}</option>
          <option value="overdue">{t("admin_subscription_state_overdue")}</option>
          <option value="suspended">{t("admin_subscription_state_suspended")}</option>
        </select>
      </div>
      {err ? <p className={adminCls.error}>{err}</p> : null}
      {rows.length === 0 ? (
        <p className={adminCls.empty}>—</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/groups/${r.id}`} className={adminCls.listLink}>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="min-w-0 font-mono text-sm text-[color:var(--fd-primary)]">
                    <span className="mr-1 inline-block rounded bg-[color:var(--fd-mint)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
                      {r.type}
                    </span>
                    <span className="break-all text-[color:var(--fd-text)]">{r.name}</span>
                  </span>
                  <span className={`text-xs ${adminCls.muted}`}>
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${adminCls.muted}`}>{r.createdByEmail}</p>
                <p className="mt-1 text-xs font-medium text-[color:var(--fd-primary)]">
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

export default function AdminGroupsPage() {
  return (
    <Suspense fallback={<p className={adminCls.muted}>…</p>}>
      <AdminGroupsContent />
    </Suspense>
  );
}
