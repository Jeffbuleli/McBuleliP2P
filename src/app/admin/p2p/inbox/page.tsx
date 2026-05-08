"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

type InboxRow = {
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

export default function AdminP2pInboxPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<InboxRow[] | null>(null);
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
    setRows(data.disputes as InboxRow[]);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-4">
      <Link href="/admin/p2p" className="text-sm text-amber-200 underline">
        ← {t("admin_p2p_disputes")}
      </Link>
      <h2 className="text-lg font-bold text-white">Support inbox</h2>
      <p className="text-sm text-stone-400">
        Disputes need urgent review. Open an order to read chat and reply as Support.
      </p>

      {err ? (
        <p className="rounded-lg bg-rose-950/50 px-3 py-2 text-sm text-rose-100">{err}</p>
      ) : null}

      {!rows?.length ? (
        <p className="text-sm text-stone-400">{t("admin_p2p_none")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-stone-700 bg-stone-900/80 p-4 text-sm text-stone-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-stone-500">{r.id}</p>
                  <p className="mt-1 font-semibold">
                    {r.fiatAmount} {r.fiatCurrency} → {r.cryptoAmount} {r.asset}
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    {r.makerMasked} ↔ {r.takerMasked}
                  </p>
                </div>
                <Link
                  href={`/admin/p2p/orders/${encodeURIComponent(r.id)}`}
                  className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                >
                  Open chat
                </Link>
              </div>
              {r.disputeReason ? (
                <p className="mt-3 whitespace-pre-wrap text-xs text-stone-300">
                  {r.disputeReason}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

