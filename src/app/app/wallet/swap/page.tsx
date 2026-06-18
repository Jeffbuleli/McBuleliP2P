"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { swapFeePercentLabel } from "@/lib/wallet-fees";
import { clientErrorText } from "@/lib/client-error-text";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { IconSwapBrand } from "@/components/wallet/icon-swap-brand";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { WalletErrorBanner, walletPrimaryBtnClass } from "@/components/wallet/wallet-form";

const SWAP_ASSETS = ["USDT", "PI", "USD", "CDF"] as const;
type SwapAsset = (typeof SWAP_ASSETS)[number];

type Quote = {
  toAmount: number;
  netUsdAfterFee: number;
  feeUsd: number;
  feeRate: number;
  rateLabel: string;
  involvesCdf: boolean;
  cdfPerUsd: number;
  quoteTtlSec: number;
  fetchedAt: number;
};

type Balances = Partial<Record<SwapAsset, number>>;

export default function WalletSwapPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [from, setFrom] = useState<SwapAsset>("USDT");
  const [to, setTo] = useState<SwapAsset>("PI");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [balances, setBalances] = useState<Balances>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const f = sp.get("from");
    const t0 = sp.get("to");
    const realm = sp.get("realm");
    if (f && (SWAP_ASSETS as readonly string[]).includes(f)) setFrom(f as SwapAsset);
    if (t0 && (SWAP_ASSETS as readonly string[]).includes(t0)) setTo(t0 as SwapAsset);
    if (realm === "fiat" && !f) {
      setFrom("USD");
      setTo("USDT");
    }
  }, [sp]);

  useEffect(() => {
    void fetch("/api/wallet/summary")
      .then((r) => r.json())
      .then((j) => {
        const map: Balances = {};
        for (const line of j.lines ?? []) {
          if ((SWAP_ASSETS as readonly string[]).includes(line.asset)) {
            map[line.asset as SwapAsset] = line.balanceNum;
          }
        }
        setBalances(map);
      })
      .catch(() => {});
  }, []);

  const pullQuote = useCallback(async () => {
    setErr(null);
    if (!amount.trim()) {
      setQuote(null);
      return;
    }
    const res = await fetch(
      `/api/wallet/swap/quote?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`,
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setQuote(null);
      setErr(typeof data.error === "string" ? data.error : "wallet_swap_failed");
      return;
    }
    setQuote({
      toAmount: data.toAmount,
      netUsdAfterFee: data.netUsdAfterFee,
      feeUsd: data.feeUsd ?? 0,
      feeRate: data.feeRate ?? 0.01,
      rateLabel: data.rateLabel ?? "",
      involvesCdf: Boolean(data.involvesCdf),
      cdfPerUsd: data.cdfPerUsd ?? 0,
      quoteTtlSec: data.quoteTtlSec ?? 60,
      fetchedAt: data.fetchedAt ?? Date.now(),
    });
    setCountdown(data.quoteTtlSec ?? 60);
  }, [amount, from, to]);

  useEffect(() => {
    const id = window.setTimeout(() => void pullQuote(), 350);
    return () => window.clearTimeout(id);
  }, [pullQuote, refreshKey]);

  useEffect(() => {
    if (!quote) return;
    const tick = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setRefreshKey((k) => k + 1);
          return quote.quoteTtlSec;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [quote?.fetchedAt, quote?.quoteTtlSec]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const fromBalance = balances[from] ?? 0;

  function flip() {
    setFrom(to);
    setTo(from);
    setQuote(null);
  }

  function pickFrom(a: SwapAsset) {
    setFrom(a);
    if (a === to) {
      const next = SWAP_ASSETS.find((x) => x !== a);
      if (next) setTo(next);
    }
  }

  function pickTo(a: SwapAsset) {
    if (a === from) return;
    setTo(a);
  }

  function setFraction(frac: number) {
    if (fromBalance <= 0) return;
    const v = fromBalance * frac;
    const decimals = from === "CDF" ? 0 : from === "USD" || from === "USDT" ? 2 : 6;
    setAmount(v.toFixed(decimals).replace(/\.?0+$/, ""));
  }

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
      router.push("/app/wallet/history?category=swap");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const usdHint = useMemo(() => {
    if (!quote || !amount.trim()) return null;
    return quote.netUsdAfterFee.toLocaleString(loc, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }, [quote, amount, loc]);

  const canSubmit = Boolean(quote && amount.trim() && !loading);

  return (
    <div className="wallet-theme flex min-h-[70vh] flex-col pb-4">
      <WalletSubpageHeader title={t("wallet_swap_title")} backHref="/app/wallet" />

      <div className="wallet-swap-shell">
        <div className="wallet-swap-card wallet-swap-card-pay">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("wallet_swap_you_pay")}
            </p>
            <p className="text-[10px] font-semibold tabular-nums text-[color:var(--fd-muted)]">
              {fromBalance.toLocaleString(loc, { maximumFractionDigits: 8 })} {from}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-[1.65rem] font-black tabular-nums text-[color:var(--fd-primary-dark)] outline-none placeholder:text-[color:var(--fd-muted)]/40"
            />
            <AssetPicker assets={SWAP_ASSETS} selected={from} onPick={pickFrom} exclude={to} />
          </div>
          {usdHint ? (
            <p className="mt-1 text-[11px] font-medium tabular-nums text-[color:var(--fd-muted)]">≈ {usdHint}</p>
          ) : null}
          <div className="mt-3 flex gap-2">
            {(
              [
                ["wallet_swap_half", 0.5],
                ["wallet_swap_max", 1],
              ] as const
            ).map(([key, frac]) => (
              <button key={key} type="button" onClick={() => setFraction(frac)} className="wallet-swap-chip">
                {t(key)}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={flip} className="wallet-swap-flip" aria-label="Flip">
          <IconSwapBrand className="h-6 w-6" />
        </button>

        <div className="wallet-swap-card wallet-swap-card-receive">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("wallet_swap_you_receive")}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p className="min-w-0 flex-1 text-[1.65rem] font-black tabular-nums text-[color:var(--fd-text)]">
              {quote
                ? quote.toAmount.toLocaleString(loc, { maximumFractionDigits: from === "CDF" ? 0 : 8 })
                : "—"}
            </p>
            <AssetPicker assets={SWAP_ASSETS} selected={to} onPick={pickTo} exclude={from} />
          </div>
        </div>
      </div>

      {quote?.rateLabel ? (
        <p className="mt-4 text-center text-xs font-semibold text-[color:var(--fd-text)]">{quote.rateLabel}</p>
      ) : null}

      {quote?.involvesCdf ? (
        <div className="wallet-swap-volatile mt-3">
          <span className="wallet-swap-volatile-icon" aria-hidden>
            ⚡
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold leading-snug text-[color:var(--fd-brown)]">
              {t("wallet_swap_cdf_volatile")}
            </p>
            <p className="mt-0.5 text-[10px] tabular-nums text-[color:var(--fd-brown)]/80">
              1 USD = {quote.cdfPerUsd.toLocaleString(loc)} CDF · {t("wallet_swap_quote_refresh")}{" "}
              <strong>0:{String(countdown).padStart(2, "0")}</strong>
            </p>
          </div>
        </div>
      ) : quote ? (
        <p className="mt-3 text-center text-[10px] tabular-nums text-[color:var(--fd-muted)]">
          {t("wallet_swap_quote_refresh")} 0:{String(countdown).padStart(2, "0")}
        </p>
      ) : null}

      <p className="mt-3 text-center text-[10px] text-[color:var(--fd-muted)]">
        {quote
          ? t("wallet_swap_fee_pct_line", {
              pct: (quote.feeRate * 100).toFixed(1).replace(/\.0$/, ""),
              feeUsd: quote.feeUsd.toLocaleString(loc, { maximumFractionDigits: 2 }),
            })
          : t("wallet_swap_fee_hint", {
              pctStandard: String(swapFeePercentLabel("USDT", "USD")),
              pctFiatCrypto: String(swapFeePercentLabel("USD", "USDT")),
            })}
      </p>

      {err ? (
        <div className="mt-3">
          <WalletErrorBanner>{clientErrorText(t, err)}</WalletErrorBanner>
        </div>
      ) : null}

      <button
        type="button"
        className={`${walletPrimaryBtnClass} mt-4`}
        disabled={!canSubmit}
        onClick={() => void confirm()}
      >
        {loading ? "…" : t("wallet_swap_exchange")}
      </button>

      <div className="mt-auto pt-6">
        <McBuleliPoweredFooter />
      </div>
    </div>
  );
}

function AssetPicker({
  assets,
  selected,
  onPick,
  exclude,
}: {
  assets: readonly SwapAsset[];
  selected: SwapAsset;
  onPick: (a: SwapAsset) => void;
  exclude?: SwapAsset;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="wallet-swap-asset-btn flex items-center gap-1.5"
      >
        <WalletAssetIcon asset={selected} size={28} />
        <span className="text-sm font-bold">{selected}</span>
        <span className="text-[color:var(--fd-muted)]">▾</span>
      </button>
      {open ? (
        <div className="wallet-swap-asset-menu absolute right-0 top-full z-20 mt-1 min-w-[7rem]">
          {assets
            .filter((a) => a !== exclude)
            .map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  onPick(a);
                  setOpen(false);
                }}
                className={`wallet-swap-asset-option ${a === selected ? "wallet-swap-asset-option-active" : ""}`}
              >
                <WalletAssetIcon asset={a} size={24} />
                <span className="font-bold">{a}</span>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
