"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

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
    <div className={adminCls.page}>
      <AdminBackLink href="/admin/p2p">{t("admin_p2p_disputes")}</AdminBackLink>
      <AdminPageHeader
        title="Support inbox"
        subtitle="Disputes need urgent review. Open an order to read chat and reply as Support."
      />

      {err ? <p className={adminCls.error}>{err}</p> : null}

      {!rows?.length ? (
        <p className={adminCls.empty}>{t("admin_p2p_none")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className={adminCls.card}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-mono text-xs ${adminCls.muted}`}>{r.id}</p>
                  <p className="mt-1 font-semibold text-[color:var(--fd-text)]">
                    {r.fiatAmount} {r.fiatCurrency} → {r.cryptoAmount} {r.asset}
                  </p>
                  <p className={`mt-1 text-xs ${adminCls.muted}`}>
                    {r.makerMasked} ↔ {r.takerMasked}
                  </p>
                </div>
                <Link
                  href={`/admin/p2p/orders/${encodeURIComponent(r.id)}`}
                  className={adminCls.btnPrimary}
                >
                  Open chat
                </Link>
              </div>
              {r.disputeReason ? (
                <p className={`mt-3 whitespace-pre-wrap text-xs ${adminCls.muted}`}>
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
