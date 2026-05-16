"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DepositStatus } from "@/lib/status";
import { useI18n } from "@/components/i18n-provider";
import { parsePiTxidOrUrl, piExplorerUrlFromTxid } from "@/lib/pi-explorer";

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
      setMsg(data.message ?? "—");
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
        setMsg(data.message ?? "—");
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
        setMsg(data.message ?? "—");
        return;
      }
      router.push("/admin/deposits");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-stone-500">…</p>;
  }
  if (!d) {
    return (
      <p className="text-rose-400">
        {msg ?? "—"}{" "}
        <Link href="/admin/deposits" className="underline">
          {t("admin_back")}
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Link href="/admin/deposits" className="text-sm text-amber-200 underline">
        {t("admin_back")}
      </Link>

      <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-4">
        <p className="text-xs uppercase text-stone-500">User</p>
        <p className="font-medium text-white">{d.userEmail}</p>
        <p className="mt-3 text-xs uppercase text-stone-500">{t("admin_asset")}</p>
        <p className="text-lg font-semibold text-white">
          {d.asset} · {d.networkCanonical}
        </p>
        <p className="mt-1 text-xs text-stone-500">{d.provider}</p>
        {d.declaredAmountUsdt ? (
          <p className="mt-3 text-sm text-amber-100">
            {t("deposit_summary_declared")}: {d.declaredAmountUsdt} USDT
          </p>
        ) : null}
        {d.userNote ? (
          <p className="mt-2 text-sm text-stone-300">
            {t("deposit_summary_note")}: {d.userNote}
          </p>
        ) : null}
        <p className="mt-3 text-xs uppercase text-stone-500">
          {t("admin_deposits_receive_addr")}
        </p>
        <p className="break-all font-mono text-sm text-emerald-200/90">
          {d.addressShown}
        </p>
        {d.memoShown ? (
          <p className="mt-2 font-mono text-sm text-rose-200">Memo: {d.memoShown}</p>
        ) : null}
        {d.txid ? (
          <div className="mt-4">
            <p className="text-xs uppercase text-stone-500">{t("admin_txid")}</p>
            <p className="break-all font-mono text-sm text-stone-300">{d.txid}</p>
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-emerald-300 underline"
              >
                Pi explorer ↗
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-rose-300">{t("admin_deposits_no_txid")}</p>
        )}
        <p className="mt-3 text-xs text-stone-500">{d.status}</p>
        {d.failureReason ? (
          <p className="mt-2 text-sm text-rose-300">{d.failureReason}</p>
        ) : null}
      </div>

      {pending && d.txid ? (
        <div className="space-y-4 rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
          <label className="block">
            <span className="text-sm font-medium text-amber-100">
              {t("admin_deposits_credit_amount")}
            </span>
            <input
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              inputMode="decimal"
              className="mt-2 w-full rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 font-mono text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-300">{t("admin_note")}</span>
            <input
              value={agentNote}
              onChange={(e) => setAgentNote(e.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-white"
            />
          </label>
          <button
            type="button"
            disabled={busy || creditAmount.trim().length === 0}
            onClick={() => void approve()}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-40"
          >
            {t("admin_deposits_approve")}
          </button>
          <label className="block">
            <span className="text-sm font-medium text-rose-200">{t("admin_reject")}</span>
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-white"
            />
          </label>
          <button
            type="button"
            disabled={busy || rejectReason.trim().length < 3}
            onClick={() => void reject()}
            className="w-full rounded-xl border border-rose-700 py-3 font-semibold text-rose-200 disabled:opacity-40"
          >
            {t("admin_reject")}
          </button>
        </div>
      ) : null}

      {msg ? <p className="text-sm text-rose-300">{msg}</p> : null}
    </div>
  );
}
