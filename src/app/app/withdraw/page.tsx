"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";
import { formatAuthClientError } from "@/lib/format-auth-client-error";

export default function WithdrawPage() {
  const router = useRouter();
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: "USDT",
          network,
          address,
          memo: memo || undefined,
          amount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatAuthClientError(data));
        setShowConfirm(false);
        return;
      }
      if (typeof data.message === "string") {
        window.alert(data.message);
      }
      router.push("/app");
      router.refresh();
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Withdraw</h1>
        <p className="mt-1 text-sm text-stone-600">
          Requests are queued for our operations team. Funds stay reserved from
          your balance until the transfer is confirmed on-chain.
        </p>
      </div>

      <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950">
        You are responsible for the destination address and network. Incorrect
        network may result in <strong>permanent loss</strong>.
      </div>

      <div>
        <p className="text-sm font-medium text-stone-800">Network</p>
        <div className="mt-2 flex flex-col gap-2">
          {(Object.keys(USDT_NETWORKS) as NetworkId[]).map((id) => {
            const s = USDT_NETWORKS[id];
            const active = network === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setNetwork(id)}
                className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left font-semibold ${
                  active ? "border-stone-900 ring-2 ring-emerald-600/30" : "border-stone-200 bg-white"
                }`}
              >
                <span className="text-sm">{s.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.badgeClass}`}>
                  {id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-800">
        Destination address
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-mono text-sm outline-none ring-emerald-700 focus:ring-2"
          placeholder="0x… or T…"
          autoComplete="off"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-800">
        Memo / tag (if required)
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-800">
        Amount (USDT)
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base tabular-nums outline-none ring-emerald-700 focus:ring-2"
          placeholder="0.00"
        />
      </label>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={
          !amount ||
          Number(amount) <= 0 ||
          address.trim().length < 10 ||
          loading
        }
        className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-40"
      >
        Review withdrawal
      </button>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-lg font-bold text-stone-900">Confirm withdrawal</p>
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              <li>
                <strong>Network:</strong> {network}
              </li>
              <li>
                <strong>To:</strong>{" "}
                <span className="break-all font-mono text-xs">{address.trim()}</span>
              </li>
              <li>
                <strong>Amount:</strong> {amount} USDT
              </li>
            </ul>
            <p className="mt-4 text-sm text-rose-900">
              Double-check the address and network before confirming.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-stone-300 py-3 font-semibold text-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void submit()}
                className="flex-1 rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Submitting…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Link href="/app" className="inline-block text-sm font-medium text-emerald-900 underline">
        ← Dashboard
      </Link>
    </div>
  );
}
