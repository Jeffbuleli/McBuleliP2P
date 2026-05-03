"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { WithdrawalStatus } from "@/lib/status";
import { activityNetworkLabel } from "@/lib/activity-network-label";
import { useI18n } from "@/components/i18n-provider";

type W = {
  id: string;
  userId: string;
  asset: string;
  networkCanonical: string;
  networkCex: string;
  toAddress: string;
  memoTo: string | null;
  amount: string;
  fee: string;
  status: string;
  txid: string | null;
  assignedToUserId: string | null;
  createdAt: string;
};

export default function AdminWithdrawalDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [userEmail, setUserEmail] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState<string | null>(null);
  const [w, setW] = useState<W | null>(null);
  const [viewer, setViewer] = useState<{ id: string; role: string } | null>(null);
  const [txid, setTxid] = useState("");
  const [agentNote, setAgentNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/withdrawals/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "—");
      setW(null);
      return;
    }
    setW(data.withdrawal);
    setUserEmail(data.userEmail ?? "");
    setAssigneeEmail(data.assigneeEmail ?? null);
    setViewer(data.viewer ?? null);
  }, [id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function claim() {
    setMsg(null);
    const res = await fetch(`/api/admin/withdrawals/${id}/claim`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "—");
      return;
    }
    setW(data.withdrawal);
    void load();
  }

  async function complete() {
    setMsg(null);
    const res = await fetch(`/api/admin/withdrawals/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txid,
        agentNote: agentNote || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "—");
      return;
    }
    router.push("/admin/withdrawals");
  }

  async function reject() {
    setMsg(null);
    const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "—");
      return;
    }
    router.push("/admin/withdrawals");
  }

  if (loading) {
    return <p className="text-stone-500">…</p>;
  }
  if (!w) {
    return (
      <p className="text-rose-400">
        {msg ?? "—"}{" "}
        <Link href="/admin/withdrawals" className="underline">
          {t("admin_back")}
        </Link>
      </p>
    );
  }

  const pending = w.status === WithdrawalStatus.PENDING_AGENT;
  const processing = w.status === WithdrawalStatus.PROCESSING;
  const totalDebit = (Number(w.amount) + Number(w.fee)).toFixed(8);
  const networkLine = activityNetworkLabel(locale, w.networkCanonical);
  const canAct =
    viewer &&
    (viewer.role === "super_admin" || w.assignedToUserId === viewer.id);
  const showActions = processing && canAct;

  return (
    <div className="space-y-6 pb-12">
      <Link href="/admin/withdrawals" className="text-sm text-amber-200 underline">
        {t("admin_back")}
      </Link>

      <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-4">
        <p className="text-xs uppercase text-stone-500">User</p>
        <p className="font-medium text-white">{userEmail}</p>
        <p className="mt-3 text-xs uppercase text-stone-500">{t("admin_asset")}</p>
        <p className="text-lg font-semibold text-white">{w.asset}</p>
        <p className="mt-3 text-xs uppercase text-stone-500">{t("admin_net_fee")}</p>
        <p className="text-lg font-semibold text-amber-100">
          {w.amount} + {w.fee} {w.asset} → {totalDebit} {w.asset}
        </p>
        <p className="mt-3 text-xs uppercase text-stone-500">{t("admin_network")}</p>
        <p className="text-white">{networkLine}</p>
        <p className="mt-1 text-xs text-stone-500">{w.networkCex}</p>
        <p className="mt-3 text-xs uppercase text-stone-500">{t("admin_dest")}</p>
        <p className="break-all font-mono text-sm text-emerald-200/90">
          {w.toAddress}
        </p>
        {w.memoTo ? (
          <p className="mt-2 font-mono text-sm text-rose-200">Memo: {w.memoTo}</p>
        ) : null}
        <p className="mt-3 text-xs text-stone-500">
          {w.status === WithdrawalStatus.PENDING_AGENT && t("status_pending")}
          {w.status === WithdrawalStatus.PROCESSING && (
            <>
              {t("admin_processing_label")}
              {assigneeEmail ? ` · ${assigneeEmail}` : ""}
            </>
          )}
        </p>
        {w.txid ? (
          <p className="mt-2 font-mono text-sm text-stone-400">TXID: {w.txid}</p>
        ) : null}
      </div>

      {pending ? (
        <button
          type="button"
          onClick={() => void claim()}
          className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white"
        >
          {t("admin_claim")}
        </button>
      ) : null}

      {processing && !canAct ? (
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
          {t("admin_release_hint")}
          {assigneeEmail ? ` (${assigneeEmail})` : ""}
        </div>
      ) : null}

      {showActions ? (
        <>
          <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/30 p-3 text-sm text-emerald-100/90">
            {t("admin_txid")} → {t("admin_mark_sent")}
          </div>
          <label className="block text-sm text-stone-300">
            {t("admin_txid")}
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 font-mono text-sm text-white"
            />
          </label>
          <label className="block text-sm text-stone-300">
            {t("admin_note")}
            <textarea
              value={agentNote}
              onChange={(e) => setAgentNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm text-white"
              rows={2}
            />
          </label>
          <button
            type="button"
            disabled={txid.trim().length < 8}
            onClick={() => void complete()}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-40"
          >
            {t("admin_mark_sent")}
          </button>

          <div className="border-t border-stone-700 pt-6">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mb-2 w-full rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm text-white"
              rows={2}
            />
            <button
              type="button"
              disabled={rejectReason.trim().length < 3}
              onClick={() => void reject()}
              className="w-full rounded-xl border border-rose-700 bg-rose-950/40 py-3 font-semibold text-rose-100 disabled:opacity-40"
            >
              {t("admin_reject")}
            </button>
          </div>
        </>
      ) : null}

      {msg ? <p className="text-rose-400">{msg}</p> : null}
    </div>
  );
}
