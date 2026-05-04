"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import type { Messages } from "@/i18n/messages";
import {
  P2P_COUNTRY_CODES,
  P2P_FIAT_CURRENCIES,
  type P2pCryptoAsset,
  type P2pSide,
} from "@/lib/p2p-config";

export default function P2pNewAdPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [side, setSide] = useState<P2pSide>("sell");
  const [asset, setAsset] = useState<P2pCryptoAsset>("USDT");
  const [fiat, setFiat] = useState("CDF");
  const [price, setPrice] = useState("");
  const [minFiat, setMinFiat] = useState("");
  const [maxFiat, setMaxFiat] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [terms, setTerms] = useState("");
  const [country, setCountry] = useState("CD");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [balUsdt, setBalUsdt] = useState<number | null>(null);
  const [balPi, setBalPi] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/wallet/summary", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || cancelled) return;
      const lines = (data as { lines?: { asset: string; balanceNum: number }[] }).lines;
      if (!Array.isArray(lines)) return;
      const u = lines.find((x) => x.asset === "USDT")?.balanceNum;
      const p = lines.find((x) => x.asset === "PI")?.balanceNum;
      setBalUsdt(typeof u === "number" ? u : 0);
      setBalPi(typeof p === "number" ? p : 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sellNeedHint = useMemo(() => {
    if (side !== "sell") return null;
    const p = Number(price.replace(",", "."));
    const maxF = Number(maxFiat.replace(",", "."));
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(maxF) || maxF <= 0) return null;
    const need = maxF / p;
    if (!Number.isFinite(need) || need <= 0) return null;
    const bal = asset === "USDT" ? balUsdt : balPi;
    if (bal == null) return null;
    const needR = Math.ceil(need * 1e8) / 1e8;
    const balR = Math.floor(bal * 1e8) / 1e8;
    return { need: needR, bal: balR, ok: bal + 1e-12 >= need };
  }, [side, price, maxFiat, asset, balUsdt, balPi]);

  const errMsg = useMemo(() => {
    if (!err) return null;
    if (err.startsWith("p2p_") || err.startsWith("wallet_")) {
      return t(err as keyof Messages);
    }
    return err;
  }, [err, t]);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/p2p/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side,
          asset,
          fiatCurrency: fiat,
          price,
          minFiat,
          maxFiat,
          paymentMethods,
          terms: terms.trim() || undefined,
          countryCode: country === "OTHER" ? undefined : country,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_ad_create_failed");
        return;
      }
      router.push("/app/p2p");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
      <Link
        href="/app/p2p"
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
      >
        ← {t("p2p_title")}
      </Link>
      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">{t("p2p_post_title")}</h1>

      <div>
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t("p2p_side_label")}</p>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={`rounded-xl py-3 text-sm font-bold transition ${
              side === "buy"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40"
                : "border border-stone-300 bg-white text-stone-700 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200"
            }`}
          >
            {t("p2p_side_buy")}
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={`rounded-xl py-3 text-sm font-bold transition ${
              side === "sell"
                ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40"
                : "border border-stone-300 bg-white text-stone-700 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200"
            }`}
          >
            {t("p2p_side_sell")}
          </button>
        </div>
      </div>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_asset_label")}
        <select
          value={asset}
          onChange={(e) => setAsset(e.target.value as P2pCryptoAsset)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          <option value="USDT">USDT</option>
          <option value="PI">PI</option>
        </select>
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_fiat_label")}
        <select
          value={fiat}
          onChange={(e) => setFiat(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          {P2P_FIAT_CURRENCIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_price_per_unit")}
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_min_fiat")}
        <input
          value={minFiat}
          onChange={(e) => setMinFiat(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_max_fiat")}
        <input
          value={maxFiat}
          onChange={(e) => setMaxFiat(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_payment_detail")}
        <textarea
          value={paymentMethods}
          onChange={(e) => setPaymentMethods(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_terms_optional")}
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_country_label")}
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          {P2P_COUNTRY_CODES.map((c) => (
            <option key={c} value={c}>
              {countryLabel(locale, c)}
            </option>
          ))}
        </select>
      </label>

      {errMsg ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {errMsg}
        </p>
      ) : null}

      {sellNeedHint && !sellNeedHint.ok ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          {t("p2p_sell_need_hint")
            .replace("{need}", String(sellNeedHint.need))
            .replace("{asset}", asset)
            .replace("{bal}", String(sellNeedHint.bal))}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading || (sellNeedHint != null && !sellNeedHint.ok)}
        onClick={() => void submit()}
        className="w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
      >
        {loading ? "…" : t("p2p_create_ad")}
      </button>
    </div>
  );
}
