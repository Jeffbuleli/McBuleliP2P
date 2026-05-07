"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WALLET_ASSETS, type WalletAsset } from "@/lib/wallet-types";
import { clientErrorText } from "@/lib/client-error-text";

export default function WalletTransferPage() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [asset, setAsset] = useState<WalletAsset>("USDT");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const a = sp.get("asset");
    if (a && WALLET_ASSETS.includes(a as WalletAsset)) {
      setAsset(a as WalletAsset);
    }
  }, [sp]);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: email, asset, amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_transfer_failed");
        return;
      }
      router.push("/app/wallet");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10 pt-2">
      <Link href="/app/wallet" className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400">
        ← {t("wallet_title")}
      </Link>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        {t("wallet_transfer_title")}
      </h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">{t("wallet_fee_internal")}</p>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("wallet_transfer_email")}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          autoComplete="email"
        />
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("wallet_transfer_asset")}
        <select
          value={asset}
          onChange={(e) => setAsset(e.target.value as WalletAsset)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          {WALLET_ASSETS.filter((a) => a !== "PI_TEST").map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("wallet_transfer_amount")}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg tabular-nums dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      {err ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading || !email.trim() || !amount.trim()}
        onClick={() => void submit()}
        className="w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
      >
        {loading ? "…" : t("wallet_transfer_submit")}
      </button>
    </div>
  );
}
