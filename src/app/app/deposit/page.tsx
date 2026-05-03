"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CexId } from "@/lib/networks";
import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";

type Step = 1 | 2 | 3 | 4;

export default function DepositWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [provider, setProvider] = useState<CexId>("binance");
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const net = USDT_NETWORKS[network];

  async function createIntent() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/deposits/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          asset: "USDT",
          network,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not create deposit. Check server API keys.",
        );
        return;
      }
      const id = data.deposit?.id as string | undefined;
      if (id) {
        router.push(`/app/deposit/${id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-bold text-stone-900">Deposit</h1>
      <p className="mt-1 text-sm text-stone-600">Step {step} of 4</p>

      {step === 1 && (
        <section className="mt-8 space-y-4">
          <p className="font-medium text-stone-800">1. Select crypto</p>
          <button
            type="button"
            className="w-full rounded-xl border-2 border-emerald-800 bg-emerald-50 py-4 text-center text-lg font-semibold text-emerald-950"
          >
            USDT
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white"
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8 space-y-4">
          <p className="font-medium text-stone-800">2. Select exchange source</p>
          <p className="text-sm text-stone-600">
            Address and validation use your server-side Binance or OKX API keys.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider("binance")}
              className={`rounded-xl border-2 py-4 text-sm font-semibold ${
                provider === "binance"
                  ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              Binance
            </button>
            <button
              type="button"
              onClick={() => setProvider("okx")}
              className={`rounded-xl border-2 py-4 text-sm font-semibold ${
                provider === "okx"
                  ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              OKX
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm font-medium text-stone-600 underline"
          >
            Back
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="mt-8 space-y-4">
          <p className="font-medium text-stone-800">3. Select network</p>
          <div className="flex flex-col gap-3">
            {(Object.keys(USDT_NETWORKS) as NetworkId[]).map((id) => {
              const s = USDT_NETWORKS[id];
              const active = network === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNetwork(id)}
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-4 text-left font-semibold transition ${
                    active
                      ? "border-stone-900 ring-2 ring-emerald-600/40"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <span>{s.label}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${s.badgeClass}`}
                  >
                    {id}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setStep(4)}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full text-sm font-medium text-stone-600 underline"
          >
            Back
          </button>
        </section>
      )}

      {step === 4 && (
        <section className="mt-8 space-y-4">
          <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-4 text-stone-900 shadow-inner">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-900">
              Warning — read carefully
            </p>
            <p className="mt-3 text-pretty text-sm leading-relaxed">
              Only send <strong>USDT</strong> via <strong>{network}</strong>.
              Sending via another network will result in{" "}
              <strong>permanent loss of funds</strong>.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-300 bg-white p-4">
            <input
              type="checkbox"
              checked={acceptedRisk}
              onChange={(e) => setAcceptedRisk(e.target.checked)}
              className="mt-1 size-5 accent-emerald-700"
            />
            <span className="text-sm text-stone-800">
              I confirm I will only send USDT on <strong>{network}</strong> (
              {net.label}).
            </span>
          </label>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!acceptedRisk || loading}
            onClick={() => void createIntent()}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Loading address…" : "Show deposit address"}
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full text-sm font-medium text-stone-600 underline"
          >
            Back
          </button>
        </section>
      )}

      <Link
        href="/app"
        className="mt-10 inline-block text-sm font-medium text-emerald-900 underline"
      >
        ← Dashboard
      </Link>
    </div>
  );
}
