"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { isFreshpaySupportedForCountry } from "@/lib/freshpay/availability";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { IconMobileMoney } from "@/components/wallet/fiat-icons";
import {
  COD_MOBILE_FALLBACK,
  filterCodMobileProviders,
} from "@/lib/cod-mobile-providers";

type ProviderOption = { provider: string; label: string };

const STEPS = [
  { id: "amount", label: "Montant" },
  { id: "network", label: "Réseau" },
  { id: "confirm", label: "OK" },
] as const;

export default function WalletFiatWithdrawClient({
  fiatPaused = false,
}: {
  fiatPaused?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mobileOk, setMobileOk] = useState<boolean | null>(null);
  const [asset, setAsset] = useState<"USD" | "CDF">("USD");
  const [gross, setGross] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pct = Math.round(FIAT_FEE_RATE * 100);
  const summary = useMemo(() => {
    const g = Number(gross);
    if (!Number.isFinite(g) || g <= 0) return null;
    const fee = g * FIAT_FEE_RATE;
    const net = g - fee;
    return { fee, net, g };
  }, [gross]);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      const res = await fetch("/api/auth/me");
      const data = await res.json().catch(() => ({}));
      const cc =
        typeof data?.user?.countryCode === "string" ? (data.user.countryCode as string) : null;
      if (!cancelled) setMobileOk(isFreshpaySupportedForCountry(cc));
    }
    void loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setProvidersLoading(true);
      try {
        const res = await fetch("/api/config/mobile-money/providers");
        const data = await res.json().catch(() => ({}));
        const raw: ProviderOption[] = ((data.providers as Array<{ provider: string; label: string }>) ?? []).map(
          (p) => ({ provider: p.provider, label: p.label }),
        );
        const use =
          filterCodMobileProviders(raw).length > 0
            ? filterCodMobileProviders(raw)
            : COD_MOBILE_FALLBACK.map((p) => ({ provider: p.provider, label: p.label }));
        if (!cancelled) {
          setProviders(use);
          if (use[0] && !provider) setProvider(use[0].provider);
        }
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!fiatPaused && mobileOk === false) {
    return (
      <FormCard>
        <p className="text-sm text-amber-900">{t("wallet_fiat_unavailable")}</p>
      </FormCard>
    );
  }

  async function submit() {
    if (fiatPaused || !summary) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fiat/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset,
          grossAmount: gross,
          phoneNumber,
          provider,
          providerLabel: providers.find((p) => p.provider === provider)?.label ?? provider,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_fiat_withdraw_failed");
        return;
      }
      if (typeof data.payoutId === "string") {
        router.push(`/app/wallet/fiat/status/${encodeURIComponent(data.payoutId)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const locked = fiatPaused;

  return (
    <FormCard>
      <div className="mb-3 flex items-center gap-2 text-[color:var(--fd-primary)]">
        <IconMobileMoney />
        <span className="text-xs font-bold uppercase tracking-wide">{t("wallet_fiat_rail_momo")}</span>
      </div>

      <FiatStepper
        steps={STEPS.map((s, i) => ({
          id: s.id,
          label: locale === "fr" ? s.label : ["Amount", "Network", "Confirm"][i]!,
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

      {step === 1 ? (
        <>
          <FieldLabel label={t("wallet_phone_number")}>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              inputMode="tel"
              placeholder="09xxxxxxxx"
              disabled={locked}
              className={`${inputClass} disabled:opacity-60`}
            />
          </FieldLabel>
          <FieldLabel label={t("wallet_mobile_money_provider")}>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={locked || providersLoading}
              className={`${inputClass} disabled:opacity-60`}
            >
              {providers.map((p) => (
                <option key={p.provider} value={p.provider}>
                  {p.label}
                </option>
              ))}
            </select>
          </FieldLabel>
          <div className="flex gap-2">
            <button type="button" className={primaryBtnClass} onClick={() => setStep(0)}>
              ←
            </button>
            <button
              type="button"
              className={primaryBtnClass}
              disabled={locked || !phoneNumber.trim() || !provider}
              onClick={() => setStep(2)}
            >
              →
            </button>
          </div>
        </>
      ) : null}

      {step === 2 && summary ? (
        <>
          <div className="rounded-2xl bg-[color:var(--fd-mint)]/40 p-3 text-sm tabular-nums">
            <p>
              {summary.g.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")} {asset}
            </p>
            <p className="text-[color:var(--fd-muted)]">{providers.find((p) => p.provider === provider)?.label}</p>
          </div>
          {err ? <ErrorBanner>{clientErrorText(t, err)}</ErrorBanner> : null}
          <div className="flex gap-2">
            <button type="button" className={primaryBtnClass} onClick={() => setStep(1)}>
              ←
            </button>
            <button type="button" className={primaryBtnClass} disabled={loading} onClick={() => void submit()}>
              {loading ? "…" : t("wallet_fiat_submit")}
            </button>
          </div>
        </>
      ) : null}
    </FormCard>
  );
}
