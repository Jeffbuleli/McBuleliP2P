"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import type { Messages } from "@/i18n/messages";
import { clientErrorText } from "@/lib/client-error-text";
import {
  P2P_COUNTRY_CODES,
  p2pAllowedQuoteFiats,
  type P2pCryptoAsset,
  type P2pFiatCurrency,
  type P2pSide,
} from "@/lib/p2p-config";

type PaymentDef = { code: string; label: string };

export default function P2pNewAdPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [side, setSide] = useState<P2pSide>("sell");
  const [asset, setAsset] = useState<P2pCryptoAsset>("USDT");
  const quoteFiats = p2pAllowedQuoteFiats();
  const [fiat, setFiat] = useState<P2pFiatCurrency>(() => quoteFiats[0] ?? "CDF");

  useEffect(() => {
    if (
      quoteFiats.length > 0 &&
      !quoteFiats.includes(fiat as (typeof quoteFiats)[number])
    ) {
      setFiat(quoteFiats[0] ?? "CDF");
    }
  }, [quoteFiats, fiat]);
  const [price, setPrice] = useState("");
  const [minFiat, setMinFiat] = useState("");
  const [maxFiat, setMaxFiat] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [paymentDefs, setPaymentDefs] = useState<PaymentDef[]>([]);
  const [paymentCodes, setPaymentCodes] = useState<string[]>([]);
  const [terms, setTerms] = useState("");
  const [country, setCountry] = useState("CD");
  const [reserveAmountCrypto, setReserveAmountCrypto] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [balUsdt, setBalUsdt] = useState<number | null>(null);
  const [balPi, setBalPi] = useState<number | null>(null);
  const cryptoQuote = fiat === "USDT" || fiat === "PI";

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

  useEffect(() => {
    let cancelled = false;
    async function loadDefs() {
      const cc = country === "OTHER" ? "CD" : country;
      const res = await fetch(`/api/p2p/payment-methods?country=${encodeURIComponent(cc)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (!cancelled) setPaymentDefs([]);
        return;
      }
      const list = (data.methods as PaymentDef[]) ?? [];
      if (!cancelled) {
        setPaymentDefs(list);
        // Keep existing selections, but drop unknown codes.
        setPaymentCodes((cur) => cur.filter((c) => list.some((d) => d.code === c)));
      }
    }
    void loadDefs();
    return () => {
      cancelled = true;
    };
  }, [country]);

  useEffect(() => {
    // Keep legacy string in sync for now (public display).
    if (!paymentCodes.length) return;
    const labels = paymentDefs
      .filter((d) => paymentCodes.includes(d.code))
      .map((d) => d.label);
    if (labels.length) setPaymentMethods(labels.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentCodes, paymentDefs]);

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
    return clientErrorText(t, err);
  }, [err, t]);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const codes = paymentCodes.length ? paymentCodes : undefined;
      const pm =
        codes && paymentDefs.length
          ? paymentDefs.filter((d) => codes.includes(d.code)).map((d) => d.label).join(", ")
          : paymentMethods;
      if (!cryptoQuote && (!pm || pm.trim().length < 3)) {
        setErr("p2p_payment_methods_required");
        return;
      }
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
          paymentMethods: cryptoQuote ? "On-platform" : pm,
          paymentMethodCodes: cryptoQuote ? undefined : codes,
          reserveAmountCrypto: side === "sell" ? reserveAmountCrypto.trim() || undefined : undefined,
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
          onChange={(e) => setFiat(e.target.value as P2pFiatCurrency)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          {quoteFiats.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {t("p2p_fiat_quote_escrow_note")}
        </p>
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
        {side === "sell" ? (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{t("p2p_sell_escrow_explainer")}</p>
        ) : null}
      </label>

      {cryptoQuote ? (
        <div className="rounded-2xl border border-emerald-900/20 bg-emerald-50/70 p-4 text-sm text-emerald-950 dark:border-emerald-800/30 dark:bg-emerald-950/25 dark:text-emerald-100">
          {t("p2p_crypto_quote_hint")}
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            {t("p2p_payment_detail")}
          </p>
          {!paymentDefs.length ? (
            <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
              {t("p2p_payment_detail")}
              <textarea
                value={paymentMethods}
                onChange={(e) => setPaymentMethods(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {paymentDefs.map((d) => {
                const on = paymentCodes.includes(d.code);
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() =>
                      setPaymentCodes((cur) =>
                        on ? cur.filter((x) => x !== d.code) : [...cur, d.code],
                      )
                    }
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      on
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                        : "border-stone-300 bg-stone-50 text-stone-800 dark:border-stone-600 dark:bg-stone-950/40 dark:text-stone-200"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}
          {paymentDefs.length ? (
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t("p2p_payment_methods_profile_hint")}
            </p>
          ) : null}
        </div>
      )}

      {side === "sell" ? (
        <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
          {t("p2p_reserve_label")}
          <input
            value={reserveAmountCrypto}
            onChange={(e) => setReserveAmountCrypto(e.target.value)}
            inputMode="decimal"
            placeholder={asset === "USDT" ? "100" : "20"}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          />
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {t("p2p_reserve_hint")}
          </p>
        </label>
      ) : null}

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
            .replace("{maxFiat}", maxFiat.trim() || "—")
            .replace("{fiat}", fiat)
            .replace("{need}", String(sellNeedHint.need))
            .replace("{asset}", asset)
            .replace("{bal}", String(sellNeedHint.bal))}
        </p>
      ) : null}

      <button
        type="button"
        disabled={
          loading ||
          (sellNeedHint != null && !sellNeedHint.ok) ||
          (!cryptoQuote &&
            (paymentDefs.length > 0 ? paymentCodes.length === 0 : paymentMethods.trim().length < 3))
        }
        onClick={() => void submit()}
        className="w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
      >
        {loading ? "…" : t("p2p_create_ad")}
      </button>
    </div>
  );
}
