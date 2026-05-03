"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import {
  EXTERNAL_WITHDRAW_FEE_PI,
  EXTERNAL_WITHDRAW_FEE_USDT,
  MIN_WITHDRAW_NET_PI,
  MIN_WITHDRAW_NET_USDT,
} from "@/lib/withdraw-fees";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";

type WAsset = "USDT" | "PI";

export default function WithdrawPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [wAsset, setWAsset] = useState<WAsset>("USDT");
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [minNetUsdt, setMinNetUsdt] = useState(MIN_WITHDRAW_NET_USDT);
  const [minNetPi, setMinNetPi] = useState(MIN_WITHDRAW_NET_PI);
  const [feeUsdt, setFeeUsdt] = useState(EXTERNAL_WITHDRAW_FEE_USDT);
  const [feePi, setFeePi] = useState(EXTERNAL_WITHDRAW_FEE_PI);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/config/withdraw-fees");
        const data = await res.json();
        if (typeof data.minNetUsdt === "number") setMinNetUsdt(data.minNetUsdt);
        if (typeof data.minNetPi === "number") setMinNetPi(data.minNetPi);
        if (typeof data.feeUsdt === "number") setFeeUsdt(data.feeUsdt);
        if (typeof data.feePi === "number") setFeePi(data.feePi);
      } catch {
        /* defaults */
      }
    })();
  }, []);

  const fee = wAsset === "PI" ? feePi : feeUsdt;
  const minNet = wAsset === "PI" ? minNetPi : minNetUsdt;
  const netNum = Number(amount);
  const totalDebit =
    Number.isFinite(netNum) && netNum > 0 ? netNum + fee : null;
  const unit = wAsset === "PI" ? "PI" : "USDT";

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: wAsset,
          network: wAsset === "PI" ? PI_MAIN_NETWORK_ID : network,
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

  const addrOk =
    wAsset === "PI"
      ? address.trim().length >= 20
      : address.trim().length >= 10;

  return (
    <div className="space-y-6 pb-10 pt-10">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          {t("withdraw_title")}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {t("withdraw_sub", { fee })}
        </p>
      </div>

      <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        {t("withdraw_warn")}
      </div>

      <div>
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
          {t("deposit_pick_asset")}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWAsset("USDT")}
            className={`rounded-xl border-2 py-3 text-sm font-semibold ${
              wAsset === "USDT"
                ? "border-emerald-800 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100"
                : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
            }`}
          >
            USDT
          </button>
          <button
            type="button"
            onClick={() => setWAsset("PI")}
            className={`rounded-xl border-2 py-3 text-sm font-semibold ${
              wAsset === "PI"
                ? "border-violet-800 bg-violet-50 text-violet-950 dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-100"
                : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
            }`}
          >
            Pi
          </button>
        </div>
      </div>

      {wAsset === "USDT" ? (
        <div>
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {t("deposit_network")}
          </p>
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
                    active
                      ? "border-stone-900 ring-2 ring-emerald-600/30 dark:border-stone-100"
                      : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
                  }`}
                >
                  <span className="text-sm">{s.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.badgeClass}`}
                  >
                    {id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm text-violet-950 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100">
          {t("withdraw_pi_network_only")}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("withdraw_addr")}
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-mono text-sm outline-none ring-emerald-700 focus:ring-2 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          placeholder={wAsset === "PI" ? t("withdraw_addr_pi_ph") : "0x… / T…"}
          autoComplete="off"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("withdraw_memo")}
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-800 dark:text-stone-200">
        {wAsset === "PI" ? t("withdraw_amt_pi") : t("withdraw_amt")}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base tabular-nums outline-none ring-emerald-700 focus:ring-2 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          placeholder="0.00"
        />
      </label>

      {totalDebit !== null ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
          {t("fee_note_asset", { fee, min: minNet, unit })} →{" "}
          <strong className="tabular-nums">
            {totalDebit.toLocaleString(undefined, { maximumFractionDigits: 8 })}{" "}
            {unit}
          </strong>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={!amount || Number(amount) <= 0 || !addrOk || loading}
        className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-40"
      >
        {t("withdraw_review")}
      </button>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-900">
            <p className="text-lg font-bold text-stone-900 dark:text-stone-50">
              {t("withdraw_review")}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-700 dark:text-stone-300">
              <li>
                <strong>{wAsset}</strong> ·{" "}
                {wAsset === "USDT" ? network : PI_MAIN_NETWORK_ID}
              </li>
              <li className="break-all font-mono text-xs">{address.trim()}</li>
              <li>
                {t("withdraw_amt")}: {amount} · +{fee} {unit} →{" "}
                {totalDebit?.toLocaleString(undefined, { maximumFractionDigits: 8 })}{" "}
                {unit}
              </li>
            </ul>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-stone-300 py-3 font-semibold text-stone-800 dark:border-stone-600 dark:text-stone-100"
              >
                {t("back")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void submit()}
                className="flex-1 rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "…" : t("withdraw_confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Link
        href="/app"
        className="inline-block text-sm font-medium text-emerald-900 underline dark:text-emerald-300"
      >
        {t("dashboard")}
      </Link>
    </div>
  );
}
