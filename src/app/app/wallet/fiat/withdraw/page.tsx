"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import type { Messages } from "@/i18n/messages";

export default function WalletFiatWithdrawPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [asset, setAsset] = useState<"USD" | "CDF">("USD");
  const [gross, setGross] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pct = Math.round(FIAT_FEE_RATE * 100);

  const summary = useMemo(() => {
    const g = Number(gross);
    if (!Number.isFinite(g) || g <= 0) return null;
    const fee = g * FIAT_FEE_RATE;
    const net = g - fee;
    return { fee, net, g };
  }, [gross]);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fiat/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, grossAmount: gross }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_fiat_withdraw_failed");
        return;
      }
      router.push("/app/wallet/history");
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
        {t("wallet_fiat_withdraw_title")}
      </h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {t("wallet_fiat_withdraw_intro", { pct })}
      </p>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("wallet_transfer_asset")}
        <select
          value={asset}
          onChange={(e) => setAsset(e.target.value as "USD" | "CDF")}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          <option value="USD">USD</option>
          <option value="CDF">CDF</option>
        </select>
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("wallet_fiat_gross")}
        <input
          value={gross}
          onChange={(e) => setGross(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg tabular-nums dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      {summary ? (
        <div className="rounded-2xl border border-emerald-900/15 bg-emerald-50/70 p-4 text-sm dark:border-emerald-800/30 dark:bg-emerald-950/30">
          <p>
            {t("wallet_fiat_fee")}:{" "}
            <strong className="tabular-nums">
              {summary.fee.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 })}{" "}
              {asset}
            </strong>
          </p>
          <p className="mt-2">
            {t("wallet_fiat_net")}:{" "}
            <strong className="tabular-nums">
              {summary.net.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 })}{" "}
              {asset}
            </strong>
          </p>
        </div>
      ) : null}

      <p className="text-xs text-stone-500 dark:text-stone-400">{t("wallet_fiat_ops_note")}</p>

      {err ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {err.startsWith("wallet_") ? t(err as keyof Messages) : err}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading || !summary}
        onClick={() => void submit()}
        className="w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
      >
        {loading ? "…" : t("wallet_fiat_submit")}
      </button>
    </div>
  );
}
