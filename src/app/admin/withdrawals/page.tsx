"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WithdrawalStatus } from "@/lib/status";

type Row = {
  id: string;
  userId: string;
  userEmail: string;
  asset: string;
  networkCanonical: string;
  amount: string;
  status: string;
  createdAt: string;
};

export default function AdminWithdrawalsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(WithdrawalStatus.PENDING_AGENT);

  useEffect(() => {
    setErr(null);
    void (async () => {
      const res = await fetch(
        `/api/admin/withdrawals?status=${encodeURIComponent(status)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message ?? "Could not load");
        setRows([]);
        return;
      }
      setRows(data.withdrawals as Row[]);
    })();
  }, [status]);

  if (rows === null) {
    return <p className="text-stone-500">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-white">Withdrawals</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-stone-600 bg-stone-900 px-2 py-1 text-sm text-stone-200"
        >
          <option value={WithdrawalStatus.PENDING_AGENT}>Pending</option>
          <option value={WithdrawalStatus.COMPLETED}>Completed</option>
          <option value={WithdrawalStatus.REJECTED}>Rejected</option>
        </select>
        <Link
          href="/admin"
          className="ml-auto text-sm text-amber-200 underline"
        >
          Back
        </Link>
      </div>
      {err ? (
        <p className="mb-2 text-rose-400">{err}</p>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-stone-500">No items.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/withdrawals/${r.id}`}
                className="block rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-3 transition hover:border-amber-600/50"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-mono text-sm text-amber-100/90">
                    {r.amount} {r.asset} · {r.networkCanonical}
                  </span>
                  <span className="text-xs text-stone-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-300">{r.userEmail}</p>
                <p className="text-xs text-stone-500">{r.status}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
