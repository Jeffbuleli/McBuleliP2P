"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import type { Locale } from "@/i18n/locale";
import { countryLabel } from "@/lib/country-label";
import type { P2pMarketView } from "@/lib/p2p-market-view";
import { P2pIconEscrow, P2pIconStar } from "@/components/p2p/p2p-icons";

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
  if (n >= 1000) return n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 4 });
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

  const headerBg = isBuyTab
    ? "bg-[color:var(--fd-mint)]/45"
    : "bg-[color:var(--fd-sell-mint)]/70";
  const badgeCls = isBuyTab
    ? "bg-[color:var(--fd-mint-deep)] text-[color:var(--fd-primary)]"
    : "bg-[color:var(--fd-sell-deep)] text-[color:var(--fd-sell)]";
  const btnCls = isBuyTab ? "fd-btn-soft" : "fd-btn-sell";

  const payLine = ad.paymentMethods.split(/[,;\n]/)[0]?.trim() ?? "";

  return (
    <li className="fd-card overflow-hidden p-0">
      <div className={`flex items-center justify-between gap-2 border-b border-[color:var(--fd-border)] px-3 py-1.5 ${headerBg}`}>
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
        <div className="flex gap-3">
          <div className="relative h-12 w-[4.25rem] shrink-0">
            {icon ? (
              <span
                className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl ring-2 ring-white ${
                  isBuyTab ? "bg-[color:var(--fd-mint)]" : "bg-[color:var(--fd-sell-mint)]"
                }`}
              >
                <Image src={icon} alt="" width={32} height={32} className="rounded-full" />
              </span>
            ) : null}
            <span className="absolute -bottom-0.5 right-0 ring-2 ring-white rounded-full">
              <UserAvatarMark
                email={ad.makerName}
                avatarUrl={ad.makerAvatarUrl}
                sizeClass="h-9 w-9"
                textClass="text-xs"
                variant="profile"
              />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {ad.asset}/{ad.fiatCurrency}
            </p>
            <p className="text-lg font-bold tabular-nums leading-tight text-[color:var(--fd-text)]">
              {fmt(ad.price, ad.fiatCurrency)}
              <span className="text-xs font-semibold text-[color:var(--fd-muted)]">/{ad.asset}</span>
            </p>
            <p className="text-[10px] tabular-nums text-[color:var(--fd-muted)]">
              {fmt(ad.minFiat, ad.fiatCurrency)}–{fmt(ad.maxFiat, ad.fiatCurrency)}
              {stockRem != null && Number.isFinite(stockRem) ? (
                <span className="ml-1.5 font-bold text-[color:var(--fd-primary)]">
                  · {fmtStock(stockRem, locale)} {ad.asset}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="mt-2.5 rounded-xl bg-stone-50/90 px-2 py-1.5">
          <div className="flex items-center gap-2">
          <UserAvatarMark
            email={ad.makerName}
            avatarUrl={ad.makerAvatarUrl}
            sizeClass="h-8 w-8"
            textClass="text-xs"
            variant="profile"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[color:var(--fd-text)]">{ad.makerName}</p>
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
          {payLine ? (
            <p className="mt-1 truncate text-[10px] text-[color:var(--fd-muted)]">{payLine}</p>
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
