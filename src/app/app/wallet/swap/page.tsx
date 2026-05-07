"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { SWAP_FEE_USD } from "@/lib/wallet-fees";
import { WALLET_ASSETS, type WalletAsset } from "@/lib/wallet-types";
import { clientErrorText } from "@/lib/client-error-text";

export default function WalletSwapPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [from, setFrom] = useState<WalletAsset>("USDT");
  const [to, setTo] = useState<WalletAsset>("PI");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{
    toAmount: number;
    grossUsd: number;
    netUsdAfterFee: number;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const f = sp.get("from");
    const t0 = sp.get("to");
    if (f && WALLET_ASSETS.includes(f as WalletAsset)) {
      setFrom(f as WalletAsset);
    }
    if (t0 && WALLET_ASSETS.includes(t0 as WalletAsset)) {
      setTo(t0 as WalletAsset);
    }
  }, [sp]);

  const pullQuote = useCallback(async () => {
    setErr(null);
    setQuote(null);
    if (!amount.trim()) return;
    const res = await fetch(
      `/api/wallet/swap/quote?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`,
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "wallet_swap_failed");
      return;
    }
    setQuote({
      toAmount: data.toAmount,
      grossUsd: data.grossUsd,
      netUsdAfterFee: data.netUsdAfterFee,
    });
  }, [amount, from, to]);

  useEffect(() => {
    const id = window.setTimeout(() => void pullQuote(), 400);
    return () => window.clearTimeout(id);
  }, [pullQuote]);

  const rateLine = useMemo(() => {
    if (!quote || !Number(amount)) return "—";
    const n = quote.netUsdAfterFee / quote.toAmount;
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
      maximumFractionDigits: 8,
    });
  }, [amount, quote, locale]);

  async function confirm() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_swap_failed");
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
        {t("wallet_swap_title")}
      </h1>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("wallet_swap_from")}
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value as WalletAsset)}
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
        {t("wallet_swap_to")}
        <select
          value={to}
          onChange={(e) => setTo(e.target.value as WalletAsset)}
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
        {t("wallet_swap_amount")}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg tabular-nums dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          placeholder="0"
        />
      </label>

      <div className="rounded-2xl border border-emerald-900/15 bg-emerald-50/60 p-4 text-sm dark:border-emerald-800/30 dark:bg-emerald-950/30">
        <p className="font-semibold text-emerald-950 dark:text-emerald-100">
          {t("wallet_swap_preview")}
        </p>
        <p className="mt-2 text-stone-700 dark:text-stone-300">
          {t("wallet_swap_receive")}:{" "}
          <strong className="tabular-nums">
            {quote ? quote.toAmount.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 12 }) : "—"}{" "}
            {to}
          </strong>
        </p>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {t("wallet_swap_rate")}: <span className="font-mono text-xs">{rateLine}</span>
        </p>
        <p className="mt-2 font-medium text-stone-800 dark:text-stone-200">
          {t("wallet_swap_fee_line", { feeUsd: SWAP_FEE_USD })}
        </p>
      </div>

      {err ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading || !quote}
        onClick={() => void confirm()}
        className="w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
      >
        {loading ? "…" : t("wallet_swap_confirm")}
      </button>
    </div>
  );
}
