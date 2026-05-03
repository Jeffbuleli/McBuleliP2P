"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";
import { USDT_NETWORKS } from "@/lib/networks";
import { DepositStatus } from "@/lib/status";

type Deposit = {
  id: string;
  asset: string;
  networkCanonical: string;
  addressShown: string;
  memoShown: string | null;
  minConfirmations: number;
  status: string;
  failureReason: string | null;
  txid: string | null;
  amount: string | null;
  provider: string;
};

export default function DepositDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [txid, setTxid] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deposits/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Not found");
      setDeposit(null);
      return;
    }
    setDeposit(data.deposit);
  }, [id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function markSent() {
    setMsg(null);
    const res = await fetch(`/api/deposits/${id}/sent`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "Could not update");
      return;
    }
    setDeposit(data.deposit);
  }

  async function submitTxid() {
    setMsg(null);
    const res = await fetch(`/api/deposits/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txid }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.status === "confirmed") {
      setDeposit(data.deposit);
      setTxid("");
      return;
    }
    if (data.status === "failed") {
      setDeposit(data.deposit);
      setMsg(data.reason ?? "Failed");
      return;
    }
    if (data.status === "pending") {
      setMsg(data.message ?? "Still pending on exchange");
      await load();
      return;
    }
    setMsg(data.message ?? data.error ?? "Could not confirm");
  }

  if (loading) {
    return <p className="text-stone-600">Loading…</p>;
  }
  if (!deposit) {
    return (
      <p className="text-rose-800">
        {msg ?? "Deposit not found."}{" "}
        <Link href="/app" className="underline">
          Home
        </Link>
      </p>
    );
  }

  const net =
    USDT_NETWORKS[deposit.networkCanonical as keyof typeof USDT_NETWORKS];
  const badge = net?.badgeClass ?? "bg-stone-700 text-white";

  const showTxid =
    deposit.status === DepositStatus.AWAITING_TXID ||
    deposit.status === DepositStatus.PENDING_VALIDATION;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMsg("Copied to clipboard.");
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Deposit details</h1>
        <p className="mt-1 text-sm text-stone-600">
          Status:{" "}
          <strong className="text-stone-900">{deposit.status}</strong>
        </p>
      </div>

      <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">
        Only send {deposit.asset} on the network shown below. Wrong network =
        permanent loss.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-4 py-2 text-sm font-bold uppercase ${badge}`}
        >
          {deposit.networkCanonical}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {deposit.provider === "binance"
            ? "Route A"
            : deposit.provider === "okx"
              ? "Route B"
              : deposit.provider}
        </span>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-stone-200">
        <p className="text-xs font-semibold uppercase text-stone-500">
          Deposit address
        </p>
        <p className="mt-2 break-all font-mono text-sm text-stone-900">
          {deposit.addressShown}
        </p>
        <button
          type="button"
          onClick={() => void copy(deposit.addressShown)}
          className="mt-3 w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white"
        >
          Copy address
        </button>
      </div>

      {deposit.memoShown ? (
        <div className="rounded-2xl border-2 border-rose-900/30 bg-rose-50 p-4">
          <p className="text-xs font-bold uppercase text-rose-900">
            Required memo / tag
          </p>
          <p className="mt-2 font-mono text-sm">{deposit.memoShown}</p>
          <button
            type="button"
            onClick={() => void copy(deposit.memoShown!)}
            className="mt-2 text-sm font-semibold text-rose-900 underline"
          >
            Copy memo
          </button>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 shadow ring-1 ring-stone-200">
        <QRCode value={deposit.addressShown} size={200} />
        <p className="text-xs text-stone-500">Scan to copy address on mobile</p>
      </div>

      <p className="text-sm text-stone-600">
        Expected confirmations (indicative):{" "}
        <strong>{deposit.minConfirmations}</strong>
      </p>

      {deposit.status === DepositStatus.AWAITING_TRANSFER ? (
        <button
          type="button"
          onClick={() => void markSent()}
          className="w-full rounded-xl bg-emerald-700 py-3 text-lg font-semibold text-white"
        >
          I have sent
        </button>
      ) : null}

      {showTxid ? (
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <label className="block text-sm font-medium text-stone-800">
            Transaction ID (TXID)
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              placeholder="Paste TXID from your wallet"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-mono text-sm outline-none ring-emerald-700 focus:ring-2"
            />
          </label>
          <button
            type="button"
            disabled={txid.trim().length < 8}
            onClick={() => void submitTxid()}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-40"
          >
            Submit TXID for validation
          </button>
        </div>
      ) : null}

      {deposit.status === DepositStatus.CONFIRMED ? (
        <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 text-emerald-950">
          <p className="font-bold">Deposit confirmed</p>
          <p className="mt-1 text-sm">
            Credited {deposit.amount ?? ""} {deposit.asset}. TXID: {deposit.txid}
          </p>
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="mt-4 w-full rounded-lg bg-emerald-700 py-2 font-semibold text-white"
          >
            Back to wallet
          </button>
        </div>
      ) : null}

      {deposit.status === DepositStatus.FAILED ? (
        <div className="rounded-xl border-2 border-rose-700 bg-rose-50 p-4 text-rose-950">
          <p className="font-bold">Failed</p>
          <p className="mt-1 text-sm">{deposit.failureReason}</p>
        </div>
      ) : null}

      {msg ? (
        <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-800">
          {msg}
        </p>
      ) : null}

      <Link href="/app" className="inline-block text-sm font-medium text-emerald-900 underline">
        ← Dashboard
      </Link>
    </div>
  );
}
