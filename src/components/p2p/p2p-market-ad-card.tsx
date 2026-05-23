"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import type { Locale } from "@/i18n/locale";
import { interpolate } from "@/i18n/messages";
import { countryLabel } from "@/lib/country-label";
import type { P2pMarketView } from "@/lib/p2p-market-view";
import { P2pIconEscrow, P2pIconStar } from "@/components/p2p/p2p-icons";
import { KycVerifiedBadge } from "@/components/kyc/kyc-verified-badge";

export type P2pMarketAd = {
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
  makerName: string;
  makerAvatarUrl?: string | null;
  makerKycApproved?: boolean;
  makerRating: { avg: number; count: number } | null;
  makerTradeCount?: number;
  reserveRemainingCrypto?: string | null;
  reserveTotalCrypto?: string | null;
};

const ASSET_ICON: Record<string, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

function fmtStock(n: number, locale: Locale): string {
  if (n >= 1000) {
    return n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 });
  }
  return n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 4 });
}

function splitPaymentMethods(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]/)) {
    const s = part.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function P2pMarketAdCard({
  ad,
  locale,
  fmt,
  marketView = "buy",
}: {
  ad: P2pMarketAd;
  locale: Locale;
  fmt: (n: string, cur: string) => string;
  marketView?: P2pMarketView;
}) {
  const { t } = useI18n();
  const isBuyTab = marketView === "buy";
  const icon = ASSET_ICON[ad.asset];
  const ctaLabel = isBuyTab ? t("p2p_cta_buy") : t("p2p_cta_sell");
  const tabLabel = isBuyTab ? t("p2p_market_tab_buy") : t("p2p_market_tab_sell");
  const stockRem =
    ad.side === "sell" && ad.reserveRemainingCrypto != null
      ? Number(ad.reserveRemainingCrypto)
      : null;
  const trades = ad.makerTradeCount ?? 0;
  const rating = ad.makerRating;
  const payMethods = useMemo(() => splitPaymentMethods(ad.paymentMethods), [ad.paymentMethods]);

  const headerBg = isBuyTab
    ? "bg-[color:var(--fd-mint)]/45"
    : "bg-[color:var(--fd-sell-mint)]/70";
  const badgeCls = isBuyTab
    ? "bg-[color:var(--fd-mint-deep)] text-[color:var(--fd-primary)]"
    : "bg-[color:var(--fd-sell-deep)] text-[color:var(--fd-sell)]";
  const btnCls = isBuyTab ? "fd-btn-soft" : "fd-btn-sell";
  const stockCls = isBuyTab ? "text-[color:var(--fd-primary)]" : "text-[color:var(--fd-sell)]";
  const logoBg = isBuyTab ? "bg-[color:var(--fd-mint)]" : "bg-[color:var(--fd-sell-mint)]";

  const locNum = locale === "fr" ? "fr-FR" : "en-US";
  const fmtLimit = (n: string) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return n;
    return x.toLocaleString(locNum, { maximumFractionDigits: 2 });
  };
  const limitsLine = interpolate(t("p2p_trade_limits_line"), {
    min: fmtLimit(ad.minFiat),
    max: fmtLimit(ad.maxFiat),
    quote: ad.fiatCurrency,
  });

  const stockLine =
    stockRem != null && Number.isFinite(stockRem)
      ? interpolate(t("p2p_stock_remaining"), {
          amount: fmtStock(stockRem, locale),
          asset: ad.asset,
        })
      : null;

  return (
    <li className="fd-card overflow-hidden p-0">
      <div
        className={`flex items-center justify-between gap-2 border-b border-[color:var(--fd-border)] px-3 py-1.5 ${headerBg}`}
      >
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${badgeCls}`}
        >
          <P2pIconEscrow className="h-2.5 w-2.5" />
          {tabLabel}
        </span>
        {ad.countryCode ? (
          <span className="max-w-[50%] truncate text-[9px] font-semibold text-[color:var(--fd-muted)]">
            {countryLabel(locale, ad.countryCode)}
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-2.5">
            {icon ? (
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${logoBg}`}
              >
                <Image src={icon} alt="" width={32} height={32} className="rounded-full" />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {ad.asset}/{ad.fiatCurrency}
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight text-[color:var(--fd-text)]">
                {fmt(ad.price, ad.fiatCurrency)}
                <span className="text-xs font-semibold text-[color:var(--fd-muted)]">/{ad.asset}</span>
              </p>
              <p className="mt-0.5 text-[10px] tabular-nums text-[color:var(--fd-muted)]">{limitsLine}</p>
            </div>
          </div>

          {stockLine ? (
            <p
              className={`max-w-[42%] shrink-0 text-right text-[10px] font-bold leading-snug tabular-nums ${stockCls}`}
            >
              {stockLine}
            </p>
          ) : null}
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-stone-50/90 px-2 py-1.5">
            <UserAvatarMark
              email={ad.makerName}
              avatarUrl={ad.makerAvatarUrl}
              sizeClass="h-8 w-8"
              textClass="text-xs"
              variant="profile"
            />
            <div className="min-w-0 flex-1">
              <p className="flex min-w-0 items-center gap-1 truncate text-xs font-bold text-[color:var(--fd-text)]">
                <span className="truncate">{ad.makerName}</span>
                {ad.makerKycApproved ? <KycVerifiedBadge compact /> : null}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0 text-[10px] font-semibold text-[color:var(--fd-muted)]">
                {rating && rating.count > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-amber-600">
                    <P2pIconStar filled className="h-3 w-3" />
                    {rating.avg.toFixed(1)}
                  </span>
                ) : null}
                <span>{t("p2p_maker_trades", { count: trades })}</span>
              </p>
            </div>
          </div>

          {payMethods.length > 0 ? (
            <ul className="max-w-[46%] shrink-0 space-y-0.5 text-right">
              {payMethods.map((m) => (
                <li
                  key={m}
                  className="truncate text-[10px] font-medium leading-tight text-[color:var(--fd-muted)]"
                  title={m}
                >
                  {m}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Link
          href={`/app/p2p/ad/${ad.id}/trade`}
          className={`mt-3 flex min-h-[44px] items-center justify-center rounded-2xl text-sm font-bold active:scale-[0.99] ${btnCls}`}
        >
          {ctaLabel}
        </Link>
      </div>
    </li>
  );
}
