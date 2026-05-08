"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";
import {
  MIN_DEPOSIT_USDT_FIRST,
  MIN_DEPOSIT_USDT_SUBSEQUENT,
} from "@/lib/usdt-deposit-constants";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";

type Step = 1 | 2;

export default function DepositWizardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledUsdt, setEnabledUsdt] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/config/deposit-routes");
        const data = await res.json();
        setEnabledUsdt(Boolean(data.usdtBinance ?? data.enabled));
      } catch {
        setEnabledUsdt(false);
      }
    })();
  }, []);

  const net = USDT_NETWORKS[network];

  async function createIntent() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/deposits/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "binance" as const,
          asset: "USDT" as const,
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

  const confirmLabel = `${network} (${net.label})`;

  return (
    <div className="pb-8 pt-10">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        {t("deposit")}
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {t("deposit_step")} {step}/2
      </p>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {t("asset_usdt_full")}
      </p>

      {enabledUsdt === false ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {t("deposit_unavailable")}
        </p>
      ) : null}

      {step === 1 && (
        <section className="mt-8 space-y-4">
          <p className="font-medium text-stone-800 dark:text-stone-200">
            {t("deposit_network")}
          </p>
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
                      ? "border-stone-900 ring-2 ring-emerald-600/40 dark:border-stone-100"
                      : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
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
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white"
          >
            {t("continue")}
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8 space-y-4">
          <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-4 text-stone-900 shadow-inner dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-50">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
              {t("deposit_warn_title")}
            </p>
            <p className="mt-3 text-pretty text-sm leading-relaxed">
              {t("deposit_warn_body")}
            </p>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-stone-800 dark:text-stone-200">
              {t("deposit_usdt_min_rules", {
                first: String(MIN_DEPOSIT_USDT_FIRST),
                next: String(MIN_DEPOSIT_USDT_SUBSEQUENT),
              })}
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-300 bg-white p-4 dark:border-stone-600 dark:bg-stone-900">
            <input
              type="checkbox"
              checked={acceptedRisk}
              onChange={(e) => setAcceptedRisk(e.target.checked)}
              className="mt-1 size-5 accent-emerald-700"
            />
            <span className="text-sm text-stone-800 dark:text-stone-200">
              {t("deposit_confirm_chk")} <strong>{confirmLabel}</strong>.
            </span>
          </label>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!acceptedRisk || loading || enabledUsdt !== true}
            onClick={() => void createIntent()}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? t("deposit_loading") : t("deposit_show_addr")}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm font-medium text-stone-600 underline dark:text-stone-400"
          >
            {t("back")}
          </button>
        </section>
      )}

      <Link
        href="/app"
        className="mt-10 inline-block text-sm font-medium text-emerald-900 underline dark:text-emerald-300"
      >
        {t("dashboard")}
      </Link>
    </div>
  );
}
