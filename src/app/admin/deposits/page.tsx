"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DepositStatus } from "@/lib/status";
import { useI18n } from "@/components/i18n-provider";
import { adminCls, AdminPageHeader } from "@/components/admin/admin-ui";

type Row = {
  id: string;
  userEmail: string;
  asset: string;
  networkCanonical: string;
  status: string;
  txid: string | null;
  amount: string | null;
  declaredAmountUsdt: string | null;
  createdAt: string;
};

export default function AdminDepositsPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    setErr(null);
    void (async () => {
      const res = await fetch(`/api/admin/deposits?status=${encodeURIComponent(status)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message ?? "—");
        setRows([]);
        return;
      }
      setRows(data.deposits as Row[]);
    })();
  }, [status]);

  if (rows === null) {
    return <p className={adminCls.muted}>…</p>;
  }

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={t("admin_deposits_queue")}
        action={
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={adminCls.select}
          >
            <option value="pending">{t("admin_deposits_pending")}</option>
            <option value="done">{t("admin_deposits_done")}</option>
            <option value="all">{t("admin_all")}</option>
          </select>
        }
      />
      {err ? <p className={adminCls.error}>{err}</p> : null}
      {rows.length === 0 ? (
        <p className={adminCls.empty}>{t("admin_deposits_empty")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/deposits/${r.id}`} className={adminCls.listLink}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[color:var(--fd-text)]">{r.userEmail}</span>
                  <span className={`text-xs ${adminCls.muted}`}>
                    {new Date(r.createdAt).toLocaleString(locale)}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${adminCls.muted}`}>
                  {r.asset} · {r.networkCanonical}
                  {r.status === DepositStatus.PENDING_VALIDATION
                    ? ` · ${t("admin_deposits_pending")}`
                    : ` · ${r.status}`}
                </p>
                {r.declaredAmountUsdt ? (
                  <p className={`mt-1 text-xs ${adminCls.muted}`}>
                    {t("deposit_summary_declared")}: {r.declaredAmountUsdt} USDT
                  </p>
                ) : null}
                {r.txid ? (
                  <p className="mt-1 truncate font-mono text-xs text-emerald-700">
                    {r.txid}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
