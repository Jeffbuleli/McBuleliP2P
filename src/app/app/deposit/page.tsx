"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CexId } from "@/lib/networks";
import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";
import { formatAuthClientError } from "@/lib/format-auth-client-error";

type Step = 1 | 2 | 3 | 4;

export default function DepositWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [provider, setProvider] = useState<CexId>("binance");
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeA, setRouteA] = useState<boolean | null>(null);
  const [routeB, setRouteB] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/config/deposit-routes");
        const data = await res.json();
        setRouteA(Boolean(data.routeA));
        setRouteB(Boolean(data.routeB));
      } catch {
        setRouteA(false);
        setRouteB(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (routeA === null || routeB === null) return;
    if (routeA && !routeB) setProvider("binance");
    if (!routeA && routeB) setProvider("okx");
  }, [routeA, routeB]);

  const net = USDT_NETWORKS[network];
  const routesLoaded = routeA !== null && routeB !== null;
  const anyRoute = routesLoaded && (routeA || routeB);
  const bothRoutes = routesLoaded && routeA && routeB;

  const stepDisplay = bothRoutes
    ? { current: step, total: 4 }
    : step === 1
      ? { current: 1, total: 3 }
      : step === 3
        ? { current: 2, total: 3 }
        : step === 4
          ? { current: 3, total: 3 }
          : { current: 1, total: 3 };

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
          formatAuthClientError(data) ||
            "Could not create deposit. Check server configuration.",
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

  function continueFromStep1() {
    setError(null);
    if (!routesLoaded) return;
    if (!routeA && !routeB) {
      setError(
        "No deposit route is configured on the server. Ask an admin to add API credentials in .env.",
      );
      return;
    }
    if (routeA && !routeB) {
      setProvider("binance");
      setStep(3);
      return;
    }
    if (!routeA && routeB) {
      setProvider("okx");
      setStep(3);
      return;
    }
    setStep(2);
  }

  function continueFromStep2() {
    if (provider === "binance" && !routeA) {
      setError("Route A is not available.");
      return;
    }
    if (provider === "okx" && !routeB) {
      setError(
        "Route B needs OKX credentials on the server: OKX_API_KEY, OKX_API_SECRET, OKX_PASSPHRASE in .env",
      );
      return;
    }
    setError(null);
    setStep(3);
  }

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-bold text-stone-900">Deposit</h1>
      <p className="mt-1 text-sm text-stone-600">
        Step {stepDisplay.current} of {stepDisplay.total}
      </p>

      {routesLoaded && !anyRoute ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
          Deposit is unavailable: configure at least one route in server{" "}
          <code className="rounded bg-rose-100 px-1">.env</code> (see{" "}
          <code className="rounded bg-rose-100 px-1">.env.example</code>).
        </p>
      ) : null}

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
            onClick={continueFromStep1}
            disabled={!routesLoaded}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-50"
          >
            Continue
          </button>
          {error && step === 1 ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {error}
            </p>
          ) : null}
        </section>
      )}

      {step === 2 && bothRoutes && (
        <section className="mt-8 space-y-4">
          <p className="font-medium text-stone-800">2. Deposit route</p>
          <p className="text-sm text-stone-600">
            Two liquidity channels for address generation and TXID checks. Only
            routes enabled by your administrator are shown.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!routeA}
              onClick={() => routeA && setProvider("binance")}
              className={`rounded-xl border-2 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                provider === "binance"
                  ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              Route A
              {!routeA ? (
                <span className="mt-1 block text-xs font-normal text-stone-500">
                  Not configured
                </span>
              ) : null}
            </button>
            <button
              type="button"
              disabled={!routeB}
              onClick={() => routeB && setProvider("okx")}
              className={`rounded-xl border-2 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                provider === "okx"
                  ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              Route B
              {!routeB ? (
                <span className="mt-1 block text-xs font-normal text-stone-500">
                  Not configured
                </span>
              ) : null}
            </button>
          </div>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void continueFromStep2()}
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
          <p className="font-medium text-stone-800">Select network</p>
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
            onClick={() => setStep(bothRoutes ? 2 : 1)}
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
