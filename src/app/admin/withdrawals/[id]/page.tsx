"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { WithdrawalStatus } from "@/lib/status";

type W = {
  id: string;
  userId: string;
  asset: string;
  networkCanonical: string;
  networkCex: string;
  toAddress: string;
  memoTo: string | null;
  amount: string;
  status: string;
  txid: string | null;
  provider: string;
  createdAt: string;
};

export default function AdminWithdrawalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [userEmail, setUserEmail] = useState("");
  const [w, setW] = useState<W | null>(null);
  const [txid, setTxid] = useState("");
  const [agentNote, setAgentNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/withdrawals/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "Not found");
      setW(null);
      return;
    }
    setW(data.withdrawal);
    setUserEmail(data.userEmail ?? "");
  }, [id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

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
      setMsg(data.message ?? "Failed");
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
      setMsg(data.message ?? "Failed");
      return;
    }
    router.push("/admin/withdrawals");
  }

  if (loading) {
    return <p className="text-stone-500">Loading…</p>;
  }
  if (!w) {
    return (
      <p className="text-rose-400">
        {msg ?? "Not found"}{" "}
        <Link href="/admin/withdrawals" className="underline">
          Back
        </Link>
      </p>
    );
  }

  const pending = w.status === WithdrawalStatus.PENDING_AGENT;

  return (
    <div className="space-y-6 pb-12">
      <Link href="/admin/withdrawals" className="text-sm text-amber-200 underline">
        ← Queue
      </Link>

      <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-4">
        <p className="text-xs uppercase text-stone-500">User</p>
        <p className="font-medium text-white">{userEmail}</p>
        <p className="mt-3 text-xs uppercase text-stone-500">Amount</p>
        <p className="text-lg font-semibold text-amber-100">
          {w.amount} {w.asset}
        </p>
        <p className="mt-3 text-xs uppercase text-stone-500">Network (user)</p>
        <p className="text-white">{w.networkCanonical}</p>
        <p className="mt-1 text-xs text-stone-500">
          Internal chain code: {w.networkCex}
        </p>
        <p className="mt-3 text-xs uppercase text-stone-500">Destination</p>
        <p className="break-all font-mono text-sm text-emerald-200/90">
          {w.toAddress}
        </p>
        {w.memoTo ? (
          <>
            <p className="mt-3 text-xs uppercase text-stone-500">Memo / tag</p>
            <p className="font-mono text-sm text-rose-200">{w.memoTo}</p>
          </>
        ) : null}
        <p className="mt-3 text-xs text-stone-500">Status: {w.status}</p>
        {w.txid ? (
          <p className="mt-2 font-mono text-sm text-stone-400">TXID: {w.txid}</p>
        ) : null}
      </div>

      {pending ? (
        <>
          <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-3 text-sm text-amber-100/90">
            After you send funds from custody, paste the on-chain TXID below.
            This updates the customer-facing status to completed.
          </div>
          <label className="block text-sm text-stone-300">
            On-chain TXID
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 font-mono text-sm text-white"
              placeholder="0x… or Tron txid"
            />
          </label>
          <label className="block text-sm text-stone-300">
            Internal note (optional)
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
            Mark as sent (save TXID)
          </button>

          <div className="border-t border-stone-700 pt-6">
            <p className="mb-2 text-sm text-stone-400">
              Reject &amp; refund (funds return to user balance)
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mb-2 w-full rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm text-white"
              placeholder="Reason shown to user"
              rows={2}
            />
            <button
              type="button"
              disabled={rejectReason.trim().length < 3}
              onClick={() => void reject()}
              className="w-full rounded-xl border border-rose-700 bg-rose-950/40 py-3 font-semibold text-rose-100 disabled:opacity-40"
            >
              Reject withdrawal
            </button>
          </div>
        </>
      ) : null}

      {msg ? <p className="text-rose-400">{msg}</p> : null}
    </div>
  );
}
