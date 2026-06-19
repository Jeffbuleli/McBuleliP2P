"use client";

import { useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";

type RepairReport = {
  dryRun?: boolean;
  phantom?: {
    reversed?: unknown[];
    repairedOrphanSwaps?: number;
    cascadedSwaps?: number;
  };
  trusted?: {
    users?: number;
    rows?: { userId: string; asset: string; stored: number; trusted: number; untrusted: number }[];
  };
  untrustedUsers?: { userId: string; asset: string; stored: number; trusted: number; delta: number }[];
  orphanFiatLedgerRowsAfter?: number;
};

export function TreasuryBalanceRepair({
  labels,
}: {
  labels: {
    title: string;
    intro: string;
    dryRun: string;
    repair: string;
    loading: string;
    untrusted: string;
    swaps: string;
    orphanFiat: string;
    error: string;
  };
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RepairReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(dryRun: boolean) {
    setLoading(true);
    setErr(null);
    try {
      const q = dryRun ? "?dryRun=1" : "";
      const res = await fetch(`/api/admin/wallet/balance-audit${q}`, { method: "POST" });
      const data = (await res.json()) as RepairReport & { error?: string };
      if (!res.ok) {
        setErr(data.error ?? labels.error);
        setReport(null);
        return;
      }
      setReport(data);
    } catch {
      setErr(labels.error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  const untrusted = report?.trusted?.rows?.filter((r) => r.stored - r.trusted > 1e-6) ?? [];

  return (
    <section className={`${adminCls.card} mb-6`}>
      <h2 className="text-sm font-bold text-[color:var(--fd-muted)]">{labels.title}</h2>
      <p className="mt-2 text-xs text-[color:var(--fd-muted)]">{labels.intro}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => run(true)}
          className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 ring-1 ring-slate-200 disabled:opacity-50"
        >
          {loading ? labels.loading : labels.dryRun}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (!window.confirm("Réparer les soldes non justifiés (irréversible) ?")) return;
            void run(false);
          }}
          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {loading ? labels.loading : labels.repair}
        </button>
      </div>
      {err ? <p className="mt-3 text-xs font-semibold text-red-700">{err}</p> : null}
      {report ? (
        <div className="mt-3 space-y-2 text-xs">
          <p>
            {labels.swaps}:{" "}
            <strong>{report.phantom?.repairedOrphanSwaps ?? 0}</strong> réparés,{" "}
            <strong>{report.phantom?.cascadedSwaps ?? 0}</strong> en cascade
          </p>
          <p>
            {labels.orphanFiat}: <strong>{report.orphanFiatLedgerRowsAfter ?? 0}</strong>
          </p>
          {untrusted.length > 0 ? (
            <div>
              <p className="font-bold text-amber-800">{labels.untrusted}</p>
              <ul className="mt-1 max-h-40 overflow-auto font-mono text-[10px]">
                {untrusted.map((r) => (
                  <li key={`${r.userId}-${r.asset}`}>
                    {r.userId.slice(0, 8)}… {r.asset}: {r.stored.toFixed(4)} → {r.trusted.toFixed(4)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
