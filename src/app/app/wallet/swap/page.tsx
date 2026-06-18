"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { SWAP_FEE_USD } from "@/lib/wallet-fees";
import { clientErrorText } from "@/lib/client-error-text";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { IconSwap } from "@/components/wallet/wallet-action-grid";
import {
  WalletErrorBanner,
  WalletFieldLabel,
  WalletFormCard,
  WalletStatusBanner,
  walletInputClass,
  walletPrimaryBtnClass,
} from "@/components/wallet/wallet-form";

const STEPS = [
  { id: "pair", label: "Paire" },
  { id: "amount", label: "Montant" },
  { id: "confirm", label: "OK" },
] as const;

const SWAP_ASSETS = ["USDT", "PI", "USD", "CDF"] as const;
type SwapAsset = (typeof SWAP_ASSETS)[number];

export default function WalletSwapPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(0);
  const [from, setFrom] = useState<SwapAsset>("USDT");
  const [to, setTo] = useState<SwapAsset>("PI");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{ toAmount: number; netUsdAfterFee: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const pullQuote = useCallback(async () => {
    setErr(null);
    setQuote(null);
    if (!amount.trim() || step < 1) return;
    const res = await fetch(
      `/api/wallet/swap/quote?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`,
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "wallet_swap_failed");
      return;
    }
    setQuote({ toAmount: data.toAmount, netUsdAfterFee: data.netUsdAfterFee });
  }, [amount, from, to, step]);

  useEffect(() => {
    const id = window.setTimeout(() => void pullQuote(), 400);
    return () => window.clearTimeout(id);
  }, [pullQuote]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";

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

  const stepLabels = useMemo(
    () =>
      STEPS.map((s, i) =>
        locale === "fr" ? s.label : ["Pair", "Amount", "Confirm"][i]!,
      ),
    [locale],
  );

  return (
    <div className="wallet-theme pb-10">
      <WalletSubpageHeader title={t("wallet_swap_title")} backHref="/app/wallet" />

      <WalletFormCard>
        <div className="mb-2 flex items-center gap-2 text-[color:var(--fd-primary)]">
          <IconSwap />
          <span className="text-xs font-bold uppercase">{t("wallet_swap_title")}</span>
        </div>

        <FiatStepper steps={STEPS.map((s, i) => ({ id: s.id, label: stepLabels[i]! }))} current={step} />

        {step === 0 ? (
          <>
            <WalletFieldLabel label={t("wallet_swap_from")}>
              <select value={from} onChange={(e) => setFrom(e.target.value as SwapAsset)} className={walletInputClass}>
                {SWAP_ASSETS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </WalletFieldLabel>
            <WalletFieldLabel label={t("wallet_swap_to")}>
              <select value={to} onChange={(e) => setTo(e.target.value as SwapAsset)} className={walletInputClass}>
                {SWAP_ASSETS.filter((a) => a !== from).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </WalletFieldLabel>
            <button type="button" className={walletPrimaryBtnClass} disabled={from === to} onClick={() => setStep(1)}>
              →
            </button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <WalletFieldLabel label={t("wallet_swap_amount")}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className={walletInputClass}
              />
            </WalletFieldLabel>
            {quote ? (
              <WalletStatusBanner tone="info">
                {t("wallet_swap_receive")}:{" "}
                <strong className="tabular-nums">
                  {quote.toAmount.toLocaleString(loc, { maximumFractionDigits: 8 })} {to}
                </strong>
              </WalletStatusBanner>
            ) : null}
            <div className="flex gap-2">
              <button type="button" className={walletPrimaryBtnClass} onClick={() => setStep(0)}>
                ←
              </button>
              <button type="button" className={walletPrimaryBtnClass} disabled={!quote} onClick={() => setStep(2)}>
                →
              </button>
            </div>
          </>
        ) : null}

        {step === 2 && quote ? (
          <>
            <WalletStatusBanner tone="success">
              <p className="font-bold tabular-nums">
                {Number(amount).toLocaleString(loc)} {from} → {quote.toAmount.toLocaleString(loc, { maximumFractionDigits: 8 })} {to}
              </p>
              <p className="mt-1 text-[11px] opacity-90">{t("wallet_swap_fee_line", { feeUsd: SWAP_FEE_USD })}</p>
            </WalletStatusBanner>
            {err ? <WalletErrorBanner>{clientErrorText(t, err)}</WalletErrorBanner> : null}
            <div className="flex gap-2">
              <button type="button" className={walletPrimaryBtnClass} onClick={() => setStep(1)}>
                ←
              </button>
              <button type="button" className={walletPrimaryBtnClass} disabled={loading} onClick={() => void confirm()}>
                {loading ? "…" : t("wallet_swap_confirm")}
              </button>
            </div>
          </>
        ) : null}
      </WalletFormCard>
    </div>
  );
}
