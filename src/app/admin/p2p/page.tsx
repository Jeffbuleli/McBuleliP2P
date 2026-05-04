"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

type DisputeRow = {
  id: string;
  fiatAmount: string;
  fiatCurrency: string;
  cryptoAmount: string;
  asset: string;
  disputedAt: string;
  disputeReason: string | null;
  makerMasked: string;
  takerMasked: string;
};

export default function AdminP2pDisputesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<DisputeRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/p2p/disputes");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRows([]);
      setErr(typeof data.message === "string" ? data.message : "Forbidden");
      return;
    }
    setRows(data.disputes as DisputeRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(id: string, resolution: "release_buyer" | "refund_seller") {
    setBusyId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/p2p/orders/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-amber-200 underline">
        ← {t("admin_back")}
      </Link>
      <h2 className="text-lg font-bold text-white">{t("admin_p2p_disputes")}</h2>
      <p className="text-sm text-stone-400">{t("admin_p2p_intro")}</p>

      {err ? (
        <p className="rounded-lg bg-rose-950/50 px-3 py-2 text-sm text-rose-100">{err}</p>
      ) : null}

      {!rows?.length ? (
        <p className="text-sm text-stone-400">{t("admin_p2p_none")}</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-stone-700 bg-stone-900/80 p-4 text-sm text-stone-100"
            >
              <p className="font-mono text-xs text-stone-500">{r.id}</p>
              <p className="mt-2 font-semibold">
                {r.fiatAmount} {r.fiatCurrency} → {r.cryptoAmount} {r.asset}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {r.makerMasked} ↔ {r.takerMasked}
              </p>
              {r.disputeReason ? (
                <p className="mt-2 whitespace-pre-wrap text-stone-300">{r.disputeReason}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void resolve(r.id, "release_buyer")}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                >
                  {t("admin_p2p_release_buyer")}
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void resolve(r.id, "refund_seller")}
                  className="rounded-lg border border-rose-500/60 px-4 py-2 text-xs font-bold text-rose-100 disabled:opacity-40"
                >
                  {t("admin_p2p_refund_seller")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
