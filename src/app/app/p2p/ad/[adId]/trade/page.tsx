"use client";

import Link from "next/link";
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
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import type { Messages } from "@/i18n/messages";
import { interpolate } from "@/i18n/messages";
import {
  isP2pCryptoQuoteCurrency,
  minCryptoForAsset,
  type P2pCryptoAsset,
  type P2pSide,
} from "@/lib/p2p-config";
import { P2pPaymentPickChips } from "@/components/p2p/p2p-payment-pick";
import { P2pInfoCard } from "@/components/p2p/p2p-info-card";
import { P2pSafetyTips } from "@/components/p2p/p2p-safety-tips";
import { P2pIllusBuy, P2pIllusSell, P2pIllusVerify } from "@/components/p2p/p2p-illustrations";
import { TransactionStepper } from "@/components/wallet/transaction-progress";
import { p2pTradePreviewSteps } from "@/lib/p2p-progress-steps";
import { p2pAdTradeLimits } from "@/lib/p2p-ui";

type AdDetail = {
  id: string;
  side: P2pSide;
  asset: string;
  fiatCurrency: string;
  price: string;
  minFiat: string;
  maxFiat: string;
  paymentMethods: string;
  paymentOptions: { code: string; label: string }[];
  terms: string | null;
  countryCode: string | null;
  makerName: string;
  makerUserId?: string;
  makerAvatarUrl: string | null;
  makerRating: { avg: number; count: number } | null;
  makerTradeCount?: number;
  reserveRemainingCrypto?: string | null;
  reserveTotalCrypto?: string | null;
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
  const [paymentCode, setPaymentCode] = useState("");

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

  useEffect(() => {
    if (ad?.paymentOptions?.length === 1) {
      setPaymentCode(ad.paymentOptions[0]!.code);
    } else {
      setPaymentCode("");
    }
  }, [ad?.id, ad?.paymentOptions]);

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

  const tradeLimits = useMemo(() => {
    if (!ad) return null;
    return p2pAdTradeLimits(ad, asset);
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
        body: JSON.stringify({
          adId,
          fiatAmount: fiatAmount.trim(),
          ...(paymentCode ? { paymentMethodCode: paymentCode } : {}),
        }),
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
  const takerBuys = ad.side === "sell";
  return (
    <P2pFlowShell title={t("p2p_take_trade")} subtitle={`${ad.asset}/${ad.fiatCurrency}`}>
      <div className="fd-card overflow-hidden p-0">
        <TransactionStepper steps={p2pTradePreviewSteps(ad.fiatCurrency)} />
      </div>

      <P2pInfoCard
        compact
        variant={takerBuys ? "buy" : "sell"}
        illustration={takerBuys ? <P2pIllusBuy className="h-8 w-8" /> : <P2pIllusSell className="h-8 w-8" />}
        title={takerBuys ? t("p2p_card_buy_flow_title") : t("p2p_card_sell_flow_title")}
        subtitle={takerBuys ? t("p2p_card_buy_flow_sub") : t("p2p_card_sell_flow_sub")}
      />
      <P2pInfoCard
        compact
        variant="warn"
        illustration={<P2pIllusVerify className="h-8 w-8" />}
        title={t("p2p_card_check_title")}
        subtitle={t("p2p_card_check_sub")}
      />

      <P2pSafetyTips />

      <FlowSection title={`${ad.asset}/${ad.fiatCurrency}`}>
        <div className="flex items-start gap-3">
          <div className="relative h-11 w-[3.5rem] shrink-0">
            {icon ? (
              <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] ring-2 ring-white">
                <Image src={icon} alt="" width={28} height={28} className="rounded-full" />
              </span>
            ) : null}
            <span className="absolute -bottom-0.5 right-0 rounded-full ring-2 ring-white">
              <UserAvatarMark
                email={ad.makerName}
                avatarUrl={ad.makerAvatarUrl}
                sizeClass="h-8 w-8"
                variant="profile"
              />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold tabular-nums text-[color:var(--fd-text)]">
              {Number(ad.price).toLocaleString(locNum, { maximumFractionDigits: 8 })}
              <span className="text-sm font-normal text-[color:var(--fd-muted)]">/{ad.asset}</span>
            </p>
            <p className="truncate text-xs font-bold text-[color:var(--fd-text)]">
              {ad.makerUserId ? (
                <Link href={`/app/p2p/merchant/${ad.makerUserId}`} className="hover:underline">
                  {ad.makerName}
                </Link>
              ) : (
                ad.makerName
              )}
            </p>
            <p className="flex items-center gap-2 text-[10px] font-semibold text-[color:var(--fd-muted)]">
              {ad.makerRating && ad.makerRating.count > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-amber-600">
                  <P2pIconStar filled className="h-3 w-3" />
                  {ad.makerRating.avg.toFixed(1)}
                </span>
              ) : null}
              <span>{t("p2p_maker_trades", { count: ad.makerTradeCount ?? 0 })}</span>
            </p>
            {tradeLimits ? (
              <>
                <p className="text-xs font-semibold tabular-nums text-[color:var(--fd-text)]">
                  {interpolate(t("p2p_trade_limits_line"), {
                    min: tradeLimits.effectiveMin.toLocaleString(locNum, {
                      maximumFractionDigits: 2,
                    }),
                    max: tradeLimits.effectiveMax.toLocaleString(locNum, {
                      maximumFractionDigits: 2,
                    }),
                    quote: ad.fiatCurrency,
                  })}
                </p>
                {ad.side === "sell" &&
                tradeLimits.reserveRemainingCrypto != null &&
                Number.isFinite(tradeLimits.reserveRemainingCrypto) ? (
                  <p className="text-[10px] font-bold text-[color:var(--fd-primary)]">
                    {interpolate(t("p2p_stock_remaining"), {
                      amount: tradeLimits.reserveRemainingCrypto.toLocaleString(locNum, {
                        maximumFractionDigits: 8,
                      }),
                      asset: ad.asset,
                    })}
                  </p>
                ) : null}
                {tradeLimits.untradeable ? (
                  <p className="text-[10px] font-semibold text-rose-700">
                    {t("p2p_trade_limits_invalid")}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </FlowSection>

      {ad.terms?.trim() ? (
        <FlowSection title={t("p2p_ad_terms")}>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-[color:var(--fd-text)]">
            {ad.terms.trim()}
          </p>
        </FlowSection>
      ) : null}

      {ad.paymentOptions.length > 1 ? (
        <FlowSection title={t("p2p_choose_payment")}>
          <P2pPaymentPickChips
            options={ad.paymentOptions.map((o) => ({ id: o.code, label: o.label }))}
            value={paymentCode}
            onChange={setPaymentCode}
            accent={ad.side === "sell" ? "buy" : "sell"}
          />
        </FlowSection>
      ) : null}

      <FlowSection title={t("p2p_order_fiat_amount")}>
        <FlowInput
          value={fiatAmount}
          onChange={(e) => setFiatAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="text-lg tabular-nums"
        />
        <div className="mt-3">
          <FlowAmountBox label={ad.asset} amount={`≈ ${estCrypto ?? "-"}`} unit={ad.asset} />
        </div>
      </FlowSection>

      {errMsg ? <FlowError>{errMsg}</FlowError> : null}

      <FlowPrimaryBtn
        disabled={
          loading ||
          !fiatAmount.trim() ||
          tradeLimits?.untradeable === true ||
          (ad.paymentOptions.length > 1 && !paymentCode)
        }
        onClick={() => void confirm()}
      >
        {loading ? "…" : t("p2p_order_start")}
      </FlowPrimaryBtn>
    </P2pFlowShell>
  );
}
