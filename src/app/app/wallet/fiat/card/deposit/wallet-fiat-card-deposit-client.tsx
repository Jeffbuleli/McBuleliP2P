"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ErrorBanner,
  FieldLabel,
  FormCard,
  inputClass,
  primaryBtnClass,
} from "@/components/forms/standard-form";
import { useI18n } from "@/components/i18n-provider";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { clientErrorText } from "@/lib/client-error-text";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { IconBankCard } from "@/components/wallet/fiat-icons";

const STEPS = [
  { id: "amount", label: "Montant" },
  { id: "confirm", label: "OK" },
] as const;

export default function WalletFiatCardDepositClient({
  fiatPaused = false,
}: {
  fiatPaused?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [asset, setAsset] = useState<"USD" | "CDF">("USD");
  const [gross, setGross] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pct = Math.round(FIAT_FEE_RATE * 100);
  const summary = useMemo(() => {
    const g = Number(gross);
    if (!Number.isFinite(g) || g <= 0) return null;
    const fee = g * FIAT_FEE_RATE;
    const net = g - fee;
    if (net <= 0) return null;
    return { fee, net, g };
  }, [gross]);

  async function submit() {
    if (fiatPaused || !summary) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fiat/card/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, grossAmount: gross }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_fiat_deposit_failed");
        return;
      }
      if (typeof data.checkoutUrl === "string") {
        window.location.href = data.checkoutUrl;
        return;
      }
      if (typeof data.depositId === "string") {
        router.push(`/app/wallet/fiat/status/${encodeURIComponent(data.depositId)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const locked = fiatPaused;

  return (
    <FormCard>
      <div className="mb-3 flex items-center gap-2 text-[color:var(--fd-primary)]">
        <IconBankCard />
        <span className="text-xs font-bold uppercase tracking-wide">{t("wallet_fiat_rail_card")}</span>
      </div>

      <FiatStepper
        steps={STEPS.map((s, i) => ({
          id: s.id,
          label: locale === "fr" ? s.label : ["Amount", "Confirm"][i]!,
        }))}
        current={step}
      />

      {fiatPaused ? (
        <p className="mb-4 text-sm text-amber-800">{t("wallet_fiat_paused_hint")}</p>
      ) : null}

      {step === 0 ? (
        <>
          <FieldLabel label={t("wallet_transfer_asset")}>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value as "USD" | "CDF")}
              disabled={locked}
              className={`${inputClass} disabled:opacity-60`}
            >
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </FieldLabel>
          <FieldLabel label={t("wallet_fiat_gross")}>
            <input
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              inputMode="decimal"
              disabled={locked}
              className={`${inputClass} disabled:opacity-60`}
            />
          </FieldLabel>
          {summary ? (
            <p className="text-xs text-[color:var(--fd-muted)]">
              {t("wallet_fiat_net")}: {summary.net.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")} {asset} ·{" "}
              {t("wallet_fiat_fee", { pct })}
            </p>
          ) : null}
          <button
            type="button"
            className={primaryBtnClass}
            disabled={locked || !summary}
            onClick={() => setStep(1)}
          >
            →
          </button>
        </>
      ) : null}

      {step === 1 && summary ? (
        <>
          <div className="rounded-2xl bg-[color:var(--fd-mint)]/40 p-3 text-sm tabular-nums">
            <p>
              {summary.g.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")} {asset}
            </p>
            <p className="text-[color:var(--fd-muted)]">{t("wallet_fiat_card_checkout_hint")}</p>
          </div>
          {err ? <ErrorBanner>{clientErrorText(t, err)}</ErrorBanner> : null}
          <div className="flex gap-2">
            <button type="button" className={primaryBtnClass} onClick={() => setStep(0)}>
              ←
            </button>
            <button type="button" className={primaryBtnClass} disabled={loading} onClick={() => void submit()}>
              {loading ? "…" : t("wallet_fiat_card_pay")}
            </button>
          </div>
        </>
      ) : null}
    </FormCard>
  );
}
