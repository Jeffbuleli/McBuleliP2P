"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
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
  FlowField,
  FlowInput,
  FlowPrimaryBtn,
  FlowSection,
  FlowSelect,
  FlowTabBar,
} from "@/components/p2p/p2p-flow-ui";
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

  async function patchAd(id: string, status: "active" | "paused" | "closed") {
    const res = await fetch(`/api/p2p/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) void loadAds();
  }

  const tabOptions = useMemo(
    () =>
      [
        { id: "market" as const, label: t("p2p_tab_market") },
        { id: "ads" as const, label: t("p2p_tab_ads") },
        { id: "orders" as const, label: t("p2p_tab_orders") },
      ] satisfies { id: "market" | "ads" | "orders"; label: string }[],
    [t],
  );

  return (
    <div className="-mx-1 space-y-3 pb-10 pt-1">
      <P2pHubHeader />

      <FlowTabBar options={tabOptions} value={tab} onChange={selectTab} />

      {tab === "market" ? (
        <div className="space-y-3">
          <FlowSection title={t("p2p_hub_filters")}>
            <div className="grid grid-cols-2 gap-2">
              <FlowField label={t("p2p_filter_asset")}>
                <FlowSelect
                  value={asset}
                  onChange={(e) => setAsset(e.target.value as P2pCryptoAsset | "")}
                >
                  <option value="">{t("p2p_filter_all")}</option>
                  <option value="USDT">USDT</option>
                  <option value="PI">PI</option>
                </FlowSelect>
              </FlowField>
              <FlowField label={t("p2p_filter_quote")}>
                <FlowSelect value={fiat} onChange={(e) => setFiat(e.target.value)}>
                  <option value="">{t("p2p_filter_all")}</option>
                  {p2pAllowedQuoteFiats().map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </FlowSelect>
              </FlowField>
              <FlowField label={t("p2p_filter_side")}>
                <FlowSelect
                  value={side}
                  onChange={(e) => setSide(e.target.value as P2pSide | "")}
                >
                  <option value="">{t("p2p_filter_all")}</option>
                  <option value="sell">{t("p2p_side_sell")}</option>
                  <option value="buy">{t("p2p_side_buy")}</option>
                </FlowSelect>
              </FlowField>
              <FlowField label={t("p2p_filter_country")}>
                <FlowSelect value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">{t("p2p_filter_all")}</option>
                  {P2P_COUNTRY_CODES.map((c) => (
                    <option key={c} value={c}>
                      {countryLabel(locale, c)}
                    </option>
                  ))}
                </FlowSelect>
              </FlowField>
            </div>
            <FlowField label={t("p2p_filter_payment")} hint={t("p2p_filter_payment_hint")}>
              <FlowInput
                type="search"
                value={paymentContains}
                onChange={(e) => setPaymentContains(e.target.value)}
              />
            </FlowField>
          </FlowSection>

          <FlowPrimaryBtn disabled={loading} onClick={() => void loadMarket()}>
            {loading ? "…" : t("continue")}
          </FlowPrimaryBtn>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBoostedOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                boostedOnly
                  ? "bg-amber-50 text-amber-800 ring-amber-300"
                  : "bg-white text-[color:var(--fd-muted)] ring-[color:var(--fd-border)]"
              }`}
            >
              {t("p2p_filter_boosted")}
            </button>
            <button
              type="button"
              onClick={() => setTrustedOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                trustedOnly
                  ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-[color:var(--fd-primary)]/30"
                  : "bg-white text-[color:var(--fd-muted)] ring-[color:var(--fd-border)]"
              }`}
            >
              {t("p2p_filter_trusted")}
            </button>
          </div>

          {!marketAds?.length ? (
            <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">{t("p2p_no_ads")}</p>
          ) : (
            <ul className="space-y-3">
              {marketAds.map((a) => (
                <P2pMarketAdCard key={a.id} ad={a} locale={locale} fmt={fmt} />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "ads" ? (
        <div className="space-y-3">
          <Link
            href="/app/p2p/ad/new"
            className="fd-btn-soft flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-bold active:scale-[0.98]"
          >
            {t("p2p_post_ad")}
          </Link>
          {!myAds?.length ? (
            <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">
              {t("p2p_ad_list_empty")}
            </p>
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
            <p className="text-center text-xs text-[color:var(--fd-muted)]">{boostMsg}</p>
          ) : null}
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="space-y-3">
          {!orders?.length ? (
            <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">
              {t("p2p_orders_empty")}
            </p>
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
