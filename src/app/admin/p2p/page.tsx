"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

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
    <div className={adminCls.page}>
      <AdminBackLink>{t("admin_back")}</AdminBackLink>
      <AdminPageHeader title={t("admin_p2p_disputes")} subtitle={t("admin_p2p_intro")} />

      <Link href="/admin/p2p/inbox" className={adminCls.btnSecondary}>
        {t("admin_p2p_support_inbox")}
      </Link>

      {err ? <p className={adminCls.error}>{err}</p> : null}

      {!rows?.length ? (
        <p className={adminCls.empty}>{t("admin_p2p_none")}</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className={adminCls.card}>
              <p className={`font-mono text-xs ${adminCls.muted}`}>{r.id}</p>
              <p className="mt-2 font-semibold text-[color:var(--fd-text)]">
                {r.fiatAmount} {r.fiatCurrency} → {r.cryptoAmount} {r.asset}
              </p>
              <p className={`mt-1 text-xs ${adminCls.muted}`}>
                {r.makerMasked} ↔ {r.takerMasked}
              </p>
              {r.disputeReason ? (
                <p className={`mt-2 whitespace-pre-wrap ${adminCls.muted}`}>{r.disputeReason}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void resolve(r.id, "release_buyer")}
                  className={`${adminCls.btnPrimary} disabled:opacity-40`}
                >
                  {t("admin_p2p_release_buyer")}
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void resolve(r.id, "refund_seller")}
                  className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 disabled:opacity-40"
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
