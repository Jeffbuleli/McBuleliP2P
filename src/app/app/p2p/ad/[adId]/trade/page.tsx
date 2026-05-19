"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  FlowAmountBox,
  FlowError,
  FlowInput,
  FlowPrimaryBtn,
  FlowSection,
  P2pFlowShell,
} from "@/components/p2p/p2p-flow-ui";
import { P2pIconStar } from "@/components/p2p/p2p-icons";
import type { Messages } from "@/i18n/messages";
import { interpolate } from "@/i18n/messages";
import {
  isP2pCryptoQuoteCurrency,
  minCryptoForAsset,
  type P2pCryptoAsset,
  type P2pSide,
} from "@/lib/p2p-config";
import { TransactionStepper } from "@/components/wallet/transaction-progress";
import { p2pTradePreviewSteps } from "@/lib/p2p-progress-steps";
import { minQuoteAmountForAd, p2pFlowHint, p2pTakerFlowHintKey } from "@/lib/p2p-ui";

type AdDetail = {
  id: string;
  side: P2pSide;
  asset: string;
  fiatCurrency: string;
  price: string;
  minFiat: string;
  maxFiat: string;
  paymentMethods: string;
  terms: string | null;
  countryCode: string | null;
  makerName: string;
  makerAvatarUrl: string | null;
  makerRating: { avg: number; count: number } | null;
};

const ASSET_ICON: Record<string, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

export default function P2pTradePage() {
  const params = useParams();
  const adId = typeof params.adId === "string" ? params.adId : "";
  const { t, locale } = useI18n();
  const router = useRouter();
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [fiatAmount, setFiatAmount] = useState("");
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(null);
    const res = await fetch(`/api/p2p/ads/${adId}/detail`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadErr(typeof data.error === "string" ? data.error : "p2p_ad_not_found");
      setAd(null);
      return;
    }
    setAd(data.ad as AdDetail);
  }, [adId]);

  useEffect(() => {
    if (adId) void load();
  }, [adId, load]);

  const locNum = locale === "fr" ? "fr-FR" : "en-US";
  const cryptoQuote = ad ? isP2pCryptoQuoteCurrency(ad.fiatCurrency) : false;
  const asset = (ad?.asset ?? "USDT") as P2pCryptoAsset;

  const estCrypto = useMemo(() => {
    if (!ad || !fiatAmount.trim()) return null;
    const fiat = Number(fiatAmount.replace(",", "."));
    const price = Number(ad.price);
    if (!Number.isFinite(fiat) || !Number.isFinite(price) || price <= 0) return null;
    const c = fiat / price;
    if (!Number.isFinite(c) || c <= 0) return null;
    return c.toLocaleString(locNum, { maximumFractionDigits: 12 });
  }, [ad, fiatAmount, locNum]);

  const minQuote = useMemo(() => {
    if (!ad) return null;
    return minQuoteAmountForAd(asset, ad.price);
  }, [ad, asset]);

  const errMsg = useMemo(() => {
    if (!submitErr || !ad) return null;
    if (submitErr === "wallet_insufficient_balance" && cryptoQuote) {
      return interpolate(t("p2p_quote_wallet_insufficient"), { quote: ad.fiatCurrency });
    }
    if (submitErr === "wallet_insufficient_balance" && ad.side === "sell") {
      return t("p2p_sell_insufficient_balance");
    }
    if (submitErr === "wallet_insufficient_balance" && ad.side === "buy") {
      return t("p2p_buy_escrow_insufficient_balance");
    }
    if (submitErr.startsWith("p2p_") || submitErr.startsWith("wallet_")) {
      return t(submitErr as keyof Messages);
    }
    return submitErr;
  }, [submitErr, t, ad, cryptoQuote]);

  async function confirm() {
    setSubmitErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/p2p/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, fiatAmount: fiatAmount.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitErr(typeof data.error === "string" ? data.error : "p2p_invalid_limits");
        return;
      }
      const orderId = typeof data.orderId === "string" ? data.orderId : "";
      if (orderId) {
        router.push(`/app/p2p/order/${orderId}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (loadErr) {
    return (
      <P2pFlowShell title={t("p2p_take_trade")} subtitle={t("p2p_trade_subtitle")}>
        <FlowError>{t(loadErr as keyof Messages)}</FlowError>
      </P2pFlowShell>
    );
  }

  if (!ad) {
    return (
      <P2pFlowShell title={t("p2p_take_trade")} subtitle={t("p2p_trade_subtitle")}>
        <p className="py-10 text-center text-sm text-[color:var(--fd-muted)]">{t("deposit_loading")}</p>
      </P2pFlowShell>
    );
  }

  const icon = ASSET_ICON[ad.asset];
  const roleHint = p2pFlowHint(t, p2pTakerFlowHintKey(ad.side, ad.fiatCurrency), ad.fiatCurrency);

  return (
    <P2pFlowShell title={t("p2p_take_trade")} subtitle={t("p2p_trade_subtitle")}>
      <div className="fd-card overflow-hidden p-0">
        <TransactionStepper steps={p2pTradePreviewSteps(ad.fiatCurrency)} />
      </div>

      <FlowSection title={`${ad.asset}/${ad.fiatCurrency}`} hint={roleHint}>
        <div className="flex items-center gap-3">
          {icon ? (
            <Image src={icon} alt="" width={40} height={40} className="rounded-full" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold tabular-nums text-[color:var(--fd-text)]">
              {Number(ad.price).toLocaleString(locNum, { maximumFractionDigits: 8 })}{" "}
              <span className="text-sm font-normal text-[color:var(--fd-muted)]">
                {ad.fiatCurrency}/{ad.asset}
              </span>
            </p>
            <p className="text-xs text-[color:var(--fd-muted)]">
              {ad.makerName}
              {ad.makerRating && ad.makerRating.count > 0 ? (
                <span className="ml-2 inline-flex items-center gap-0.5 text-amber-600">
                  <P2pIconStar filled className="h-3 w-3" />
                  {ad.makerRating.avg.toFixed(1)}
                </span>
              ) : null}
            </p>
            <p className="text-[10px] text-[color:var(--fd-muted)]">
              {Number(ad.minFiat).toLocaleString(locNum)} — {Number(ad.maxFiat).toLocaleString(locNum)}{" "}
              {ad.fiatCurrency}
            </p>
            {cryptoQuote ? (
              <p className="text-[10px] text-[color:var(--fd-primary)]">
                {interpolate(t("p2p_crypto_quote_take_hint"), { quote: ad.fiatCurrency })}
              </p>
            ) : null}
            {minQuote != null ? (
              <p className="text-[10px] text-amber-700">
                {interpolate(t("p2p_trade_min_quote"), {
                  amount: minQuote.toLocaleString(locNum, { maximumFractionDigits: 4 }),
                  quote: ad.fiatCurrency,
                })}
              </p>
            ) : null}
          </div>
        </div>
      </FlowSection>

      <FlowSection title={t("p2p_order_fiat_amount")}>
        <FlowInput
          value={fiatAmount}
          onChange={(e) => setFiatAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="text-lg tabular-nums"
        />
        <div className="mt-3">
          <FlowAmountBox label={ad.asset} amount={`≈ ${estCrypto ?? "—"}`} unit={ad.asset} />
        </div>
      </FlowSection>

      {errMsg ? <FlowError>{errMsg}</FlowError> : null}

      <FlowPrimaryBtn disabled={loading || !fiatAmount.trim()} onClick={() => void confirm()}>
        {loading ? "…" : t("p2p_order_start")}
      </FlowPrimaryBtn>
    </P2pFlowShell>
  );
}
