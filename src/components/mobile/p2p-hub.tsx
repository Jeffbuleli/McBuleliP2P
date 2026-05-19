"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import type { Messages } from "@/i18n/messages";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import {
  piAuthenticateForPayments,
  piInit,
  resolvePiSdkSandbox,
} from "@/lib/pi-browser";
import { P2pHubHeader } from "@/components/p2p/p2p-hub-header";
import { P2pMarketAdCard } from "@/components/p2p/p2p-market-ad-card";
import { P2pMyAdCard } from "@/components/p2p/p2p-my-ad-card";
import { P2pOrderListRow } from "@/components/p2p/p2p-order-list-row";
import {
  P2P_COUNTRY_CODES,
  p2pAllowedQuoteFiats,
  type P2pCryptoAsset,
  type P2pSide,
} from "@/lib/p2p-config";

type MarketAd = {
  id: string;
  side: string;
  asset: string;
  fiatCurrency: string;
  price: string;
  minFiat: string;
  maxFiat: string;
  paymentMethods: string;
  terms: string | null;
  countryCode: string | null;
  createdAt: string;
  makerName: string;
  makerAvatarUrl: string | null;
  makerRating: { avg: number; count: number } | null;
  boostedUntil: string | null;
  boostAmountPi: string;
};

type MyAd = {
  id: string;
  side: string;
  asset: string;
  fiatCurrency: string;
  price: string;
  minFiat: string;
  maxFiat: string;
  paymentMethods: string;
  terms: string | null;
  countryCode: string | null;
  status: string;
  boostedUntil: string | null;
  boostAmountPi: string;
  createdAt: string;
};

type OrderRow = {
  id: string;
  adId: string;
  side: P2pSide;
  asset: string;
  fiatCurrency: string;
  fiatAmount: string;
  cryptoAmount: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  role: "maker" | "taker";
};

export function P2PHub() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<"market" | "ads" | "orders">("market");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q === "market" || q === "ads" || q === "orders") {
      setTab(q);
    }
  }, []);

  const selectTab = useCallback((k: "market" | "ads" | "orders") => {
    setTab(k);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", k);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  const [asset, setAsset] = useState<P2pCryptoAsset | "">("");
  const [fiat, setFiat] = useState("");
  const [side, setSide] = useState<P2pSide | "">("");
  const [country, setCountry] = useState("");
  const [paymentContains, setPaymentContains] = useState("");
  const [boostedOnly, setBoostedOnly] = useState(false);
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [marketAds, setMarketAds] = useState<MarketAd[] | null>(null);
  const [myAds, setMyAds] = useState<MyAd[] | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [boostBusyId, setBoostBusyId] = useState<string | null>(null);
  const [boostMsg, setBoostMsg] = useState<string | null>(null);

  const loadMarket = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (asset) q.set("asset", asset);
      if (fiat) q.set("fiat", fiat);
      if (side) q.set("side", side);
      if (country) q.set("country", country);
      if (paymentContains.trim()) q.set("payment", paymentContains.trim());
      if (boostedOnly) q.set("boosted", "1");
      if (trustedOnly) q.set("trusted", "1");
      const res = await fetch(`/api/p2p/market?${q.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMarketAds([]);
        return;
      }
      setMarketAds(data.ads as MarketAd[]);
    } finally {
      setLoading(false);
    }
  }, [asset, fiat, side, country, paymentContains, boostedOnly, trustedOnly]);

  const loadAds = useCallback(async () => {
    const res = await fetch("/api/p2p/ads");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMyAds([]);
      return;
    }
    setMyAds(data.ads as MyAd[]);
  }, []);

  const boostAmount = useMemo(
    () => Number(process.env.NEXT_PUBLIC_PI_P2P_BOOST_AMOUNT ?? "0.1"),
    [],
  );

  async function boostAd(adId: string) {
    setBoostMsg(null);
    setBoostBusyId(adId);
    try {
      const Pi = await piInit();
      if (typeof Pi.createPayment !== "function") {
        setBoostMsg(t("pi_pay_no_sdk"));
        return;
      }
      await piAuthenticateForPayments(Pi);

      const memo = t("p2p_boost_memo");
      const amountStr = String(boostAmount);
      Pi.createPayment!(
        {
          amount: boostAmount,
          memo,
          metadata: { action: "p2p_ad_boost", adId },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            // Persist linkage before calling approve.
            const initRes = await fetchWithDeadline(
              "/api/payments/pi/u2a/init",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId,
                  action: "p2p_ad_boost",
                  actionRefId: adId,
                  amount: amountStr,
                  memo,
                  meta: { source: "p2p_hub" },
                  sandbox: resolvePiSdkSandbox(),
                }),
                credentials: "same-origin",
              },
              28_000,
            );
            if (!initRes.ok) {
              const d = await initRes.json().catch(() => ({}));
              throw new Error(
                typeof d === "object" &&
                  d !== null &&
                  "message" in d &&
                  typeof (d as { message: unknown }).message === "string"
                  ? (d as { message: string }).message
                  : "init_failed",
              );
            }

            const res = await fetchWithDeadline(
              "/api/payments/pi/approve",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
                credentials: "same-origin",
              },
              45_000,
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(
                typeof data === "object" &&
                  data !== null &&
                  "message" in data &&
                  typeof (data as { message: unknown }).message === "string"
                  ? (data as { message: string }).message
                  : "approve_failed",
              );
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            const res = await fetchWithDeadline(
              "/api/payments/pi/complete",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
                credentials: "same-origin",
              },
              45_000,
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(
                typeof data === "object" &&
                  data !== null &&
                  "message" in data &&
                  typeof (data as { message: unknown }).message === "string"
                  ? (data as { message: string }).message
                  : "complete_failed",
              );
            }
            setBoostMsg(t("p2p_boost_success"));
            void loadAds();
            void loadMarket();
          },
          onCancel: () => {
            setBoostMsg(t("pi_pay_cancelled"));
          },
          onError: (err: Error) => {
            setBoostMsg(`${t("pi_pay_failed")}: ${err?.message ?? String(err)}`);
          },
        },
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : null;
      setBoostMsg(msg ? `Pi: ${msg}` : t("pi_pay_failed"));
    } finally {
      setBoostBusyId(null);
    }
  }

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/p2p/orders");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setOrders([]);
      return;
    }
    setOrders(data.orders as OrderRow[]);
  }, []);

  useEffect(() => {
    if (tab === "market") void loadMarket();
  }, [tab, loadMarket]);

  useEffect(() => {
    if (tab === "ads") void loadAds();
  }, [tab, loadAds]);

  useEffect(() => {
    if (tab === "orders") void loadOrders();
  }, [tab, loadOrders]);

  const locNum = locale === "fr" ? "fr-FR" : "en-US";

  const fmt = useMemo(
    () => (n: string, cur: string) => {
      const x = Number(n);
      if (!Number.isFinite(x)) return n;
      return `${x.toLocaleString(locNum, { maximumFractionDigits: 2 })} ${cur}`;
    },
    [locNum],
  );

  const filteredMarketAds = useMemo(() => marketAds, [marketAds]);

  async function patchAd(id: string, status: "active" | "paused" | "closed") {
    const res = await fetch(`/api/p2p/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) void loadAds();
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
      <P2pHubHeader />

      <div className="flex gap-1 rounded-2xl border border-stone-700/50 bg-stone-950/60 p-1 shadow-lg shadow-black/30 backdrop-blur-md">
        {(
          [
            ["market", "p2p_tab_market"],
            ["ads", "p2p_tab_ads"],
            ["orders", "p2p_tab_orders"],
          ] as const
        ).map(([k, labelKey]) => (
          <button
            key={k}
            type="button"
            onClick={() => selectTab(k)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === k
                ? "bg-emerald-700 text-white shadow dark:bg-emerald-600"
                : "text-stone-300 hover:bg-stone-900/50"
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {tab === "market" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_asset")}
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as P2pCryptoAsset | "")}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900/70 px-2 py-2 text-sm text-stone-100 outline-none ring-emerald-500/40 focus:ring-2"
              >
                <option value="">{t("p2p_filter_all")}</option>
                <option value="USDT">USDT</option>
                <option value="PI">PI</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_quote")}
              <select
                value={fiat}
                onChange={(e) => setFiat(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900/70 px-2 py-2 text-sm text-stone-100 outline-none ring-emerald-500/40 focus:ring-2"
              >
                <option value="">{t("p2p_filter_all")}</option>
                {p2pAllowedQuoteFiats().map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_side")}
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as P2pSide | "")}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900/70 px-2 py-2 text-sm text-stone-100 outline-none ring-emerald-500/40 focus:ring-2"
              >
                <option value="">{t("p2p_filter_all")}</option>
                <option value="sell">{t("p2p_side_sell")}</option>
                <option value="buy">{t("p2p_side_buy")}</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_country")}
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900/70 px-2 py-2 text-sm text-stone-100 outline-none ring-emerald-500/40 focus:ring-2"
              >
                <option value="">{t("p2p_filter_all")}</option>
                {P2P_COUNTRY_CODES.map((c) => (
                  <option key={c} value={c}>
                    {countryLabel(locale, c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_payment")}
              <input
                type="search"
                value={paymentContains}
                onChange={(e) => setPaymentContains(e.target.value)}
                placeholder={t("p2p_filter_payment_hint")}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900/70 px-3 py-2 text-sm text-stone-100 outline-none ring-emerald-500/40 placeholder:text-stone-500 focus:ring-2"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void loadMarket()}
            disabled={loading}
            className="w-full rounded-xl border border-emerald-800/20 bg-emerald-50 py-2 text-sm font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
          >
            {loading ? "…" : t("continue")}
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBoostedOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                boostedOnly
                  ? "bg-amber-500/15 text-amber-200 ring-amber-500/35"
                  : "bg-stone-950/40 text-stone-300 ring-stone-700"
              }`}
            >
              {t("p2p_filter_boosted")}
            </button>
            <button
              type="button"
              onClick={() => setTrustedOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                trustedOnly
                  ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/35"
                  : "bg-stone-950/40 text-stone-300 ring-stone-700"
              }`}
            >
              {t("p2p_filter_trusted")}
            </button>
          </div>

          {!filteredMarketAds?.length ? (
            <p className="text-center text-sm text-stone-500">{t("p2p_no_ads")}</p>
          ) : (
            <ul className="space-y-3">
              {filteredMarketAds.map((a) => (
                <P2pMarketAdCard key={a.id} ad={a} locale={locale} fmt={fmt} />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "ads" ? (
        <div className="space-y-4">
          <Link
            href="/app/p2p/ad/new"
            className="flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-700 py-3 text-sm font-bold text-white dark:bg-emerald-600"
          >
            {t("p2p_post_ad")}
          </Link>
          {!myAds?.length ? (
            <p className="text-center text-sm text-stone-500">{t("p2p_ad_list_empty")}</p>
          ) : (
            <ul className="space-y-3">
              {myAds.map((a) => (
                <P2pMyAdCard
                  key={a.id}
                  ad={a}
                  fmt={fmt}
                  locale={locale}
                  boostBusy={boostBusyId === a.id}
                  onPause={() => void patchAd(a.id, "paused")}
                  onResume={() => void patchAd(a.id, "active")}
                  onBoost={() => void boostAd(a.id)}
                  onClose={() => void patchAd(a.id, "closed")}
                />
              ))}
            </ul>
          )}
          {boostMsg ? (
            <p className="text-center text-xs text-stone-500">{boostMsg}</p>
          ) : null}
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="space-y-3">
          {!orders?.length ? (
            <p className="text-center text-sm text-stone-500">{t("p2p_orders_empty")}</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <P2pOrderListRow key={o.id} order={o} fmt={fmt} locale={locale} />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
