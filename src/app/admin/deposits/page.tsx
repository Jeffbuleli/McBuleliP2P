"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DepositStatus } from "@/lib/status";
import { useI18n } from "@/components/i18n-provider";

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
    return <p className="text-stone-500">…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-white">{t("admin_deposits_queue")}</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-stone-600 bg-stone-900 px-2 py-1 text-sm text-stone-200"
        >
          <option value="pending">{t("admin_deposits_pending")}</option>
          <option value="done">{t("admin_deposits_done")}</option>
          <option value="all">{t("admin_all")}</option>
        </select>
      </div>
      {err ? <p className="mb-3 text-sm text-rose-300">{err}</p> : null}
      {rows.length === 0 ? (
        <p className="text-stone-500">{t("admin_deposits_empty")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/deposits/${r.id}`}
                className="block rounded-xl border border-stone-700 bg-stone-900/60 px-4 py-3 hover:border-amber-700/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-white">{r.userEmail}</span>
                  <span className="text-xs text-stone-500">
                    {new Date(r.createdAt).toLocaleString(locale)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-300">
                  {r.asset} · {r.networkCanonical}
                  {r.status === DepositStatus.PENDING_VALIDATION
                    ? ` · ${t("admin_deposits_pending")}`
                    : ` · ${r.status}`}
                </p>
                {r.declaredAmountUsdt ? (
                  <p className="mt-1 text-xs text-stone-500">
                    {t("deposit_summary_declared")}: {r.declaredAmountUsdt} USDT
                  </p>
                ) : null}
                {r.txid ? (
                  <p className="mt-1 truncate font-mono text-xs text-emerald-200/80">
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
