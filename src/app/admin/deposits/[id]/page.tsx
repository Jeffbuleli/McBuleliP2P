"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DepositStatus } from "@/lib/status";
import { useI18n } from "@/components/i18n-provider";
import { parsePiTxidOrUrl, piExplorerUrlFromTxid } from "@/lib/pi-explorer";
import { adminCls, AdminBackLink } from "@/components/admin/admin-ui";

type D = {
  id: string;
  userEmail: string;
  asset: string;
  networkCanonical: string;
  provider: string;
  status: string;
  txid: string | null;
  amount: string | null;
  declaredAmountUsdt: string | null;
  userNote: string | null;
  addressShown: string;
  memoShown: string | null;
  failureReason: string | null;
  createdAt: string;
};

export default function AdminDepositDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [d, setD] = useState<D | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [agentNote, setAgentNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/deposits/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "-");
      setD(null);
      return;
    }
    const dep = data.deposit as D;
    setD(dep);
    if (dep.declaredAmountUsdt && !creditAmount) {
      setCreditAmount(dep.declaredAmountUsdt);
    }
  }, [id, creditAmount]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const pending = d?.status === DepositStatus.PENDING_VALIDATION;
  const isPi = d?.asset.toUpperCase() === "PI";
  const explorerUrl =
    isPi && d?.txid
      ? piExplorerUrlFromTxid(
          parsePiTxidOrUrl(d.txid)?.txid ?? d.txid,
        )
      : null;

  async function approve() {
    if (!d) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: creditAmount.trim().replace(",", "."),
          agentNote: agentNote.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.message ?? "-");
        return;
      }
      router.push("/admin/deposits");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!d) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.message ?? "-");
        return;
      }
      router.push("/admin/deposits");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className={adminCls.muted}>…</p>;
  }
  if (!d) {
    return (
      <div className={adminCls.page}>
        <p className={adminCls.error}>
          {msg ?? "-"}{" "}
          <Link href="/admin/deposits" className={adminCls.back}>
            {t("admin_back")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={`${adminCls.page} pb-12`}>
      <AdminBackLink href="/admin/deposits">{t("admin_back")}</AdminBackLink>

      <div className={adminCls.card}>
        <p className={`text-xs uppercase ${adminCls.muted}`}>User</p>
        <p className="font-medium text-[color:var(--fd-text)]">{d.userEmail}</p>
        <p className={`mt-3 text-xs uppercase ${adminCls.muted}`}>{t("admin_asset")}</p>
        <p className={`text-lg font-semibold ${adminCls.h2}`}>
          {d.asset} · {d.networkCanonical}
        </p>
        <p className={`mt-1 text-xs ${adminCls.muted}`}>{d.provider}</p>
        {d.declaredAmountUsdt ? (
          <p className="mt-3 text-sm font-medium text-[color:var(--fd-primary)]">
            {t("deposit_summary_declared")}: {d.declaredAmountUsdt} USDT
          </p>
        ) : null}
        {d.userNote ? (
          <p className={`mt-2 text-sm ${adminCls.muted}`}>
            {t("deposit_summary_note")}: {d.userNote}
          </p>
        ) : null}
        <p className={`mt-3 text-xs uppercase ${adminCls.muted}`}>
          {t("admin_deposits_receive_addr")}
        </p>
        <p className="break-all font-mono text-sm text-emerald-700">
          {d.addressShown}
        </p>
        {d.memoShown ? (
          <p className="mt-2 font-mono text-sm text-rose-700">Memo: {d.memoShown}</p>
        ) : null}
        {d.txid ? (
          <div className="mt-4">
            <p className={`text-xs uppercase ${adminCls.muted}`}>{t("admin_txid")}</p>
            <p className={`break-all font-mono text-sm ${adminCls.muted}`}>{d.txid}</p>
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline"
              >
                Pi explorer ↗
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-rose-700">{t("admin_deposits_no_txid")}</p>
        )}
        <p className={`mt-3 text-xs ${adminCls.muted}`}>{d.status}</p>
        {d.failureReason ? (
          <p className="mt-2 text-sm text-rose-700">{d.failureReason}</p>
        ) : null}
      </div>

      {pending && d.txid ? (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <label className="block">
            <span className="text-sm font-medium text-amber-900">
              {t("admin_deposits_credit_amount")}
            </span>
            <input
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              inputMode="decimal"
              className={`mt-2 w-full font-mono ${adminCls.input}`}
            />
          </label>
          <label className="block">
            <span className={`text-sm font-medium ${adminCls.muted}`}>{t("admin_note")}</span>
            <input
              value={agentNote}
              onChange={(e) => setAgentNote(e.target.value)}
              className={`mt-2 w-full ${adminCls.input}`}
            />
          </label>
          <button
            type="button"
            disabled={busy || creditAmount.trim().length === 0}
            onClick={() => void approve()}
            className={`w-full ${adminCls.btnPrimary} disabled:opacity-40`}
          >
            {t("admin_deposits_approve")}
          </button>
          <label className="block">
            <span className="text-sm font-medium text-rose-800">{t("admin_reject")}</span>
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={`mt-2 w-full ${adminCls.input}`}
            />
          </label>
          <button
            type="button"
            disabled={busy || rejectReason.trim().length < 3}
            onClick={() => void reject()}
            className="w-full rounded-xl border border-rose-300 py-3 font-semibold text-rose-800 disabled:opacity-40"
          >
            {t("admin_reject")}
          </button>
        </div>
      ) : null}

      {msg ? <p className={adminCls.error}>{msg}</p> : null}
    </div>
  );
}
