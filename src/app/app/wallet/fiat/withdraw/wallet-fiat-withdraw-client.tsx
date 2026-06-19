"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { clientErrorText } from "@/lib/client-error-text";
import { isFreshpaySupportedForCountry } from "@/lib/freshpay/availability";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { IconMobileMoney } from "@/components/wallet/fiat-icons";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";
import {
  WalletErrorBanner,
  WalletFieldLabel,
  WalletFormCard,
  WalletStatusBanner,
  walletInputClass,
  walletPrimaryBtnClass,
} from "@/components/wallet/wallet-form";
import { COD_MOBILE_FALLBACK, detectCodMobileMethodFromPhone, filterCodMobileProviders } from "@/lib/cod-mobile-providers";
import { FiatProviderPicker } from "@/components/wallet/fiat-provider-picker";

type ProviderOption = { provider: string; label: string };

const STEPS = [
  { id: "amount", label: "Montant" },
  { id: "network", label: "Réseau" },
  { id: "confirm", label: "OK" },
] as const;

export default function WalletFiatWithdrawClient({ fiatPaused = false }: { fiatPaused?: boolean }) {
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
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        const cc = typeof data?.user?.countryCode === "string" ? (data.user.countryCode as string) : null;
        if (!cancelled) setMobileOk(isFreshpaySupportedForCountry(cc));
      })
      .catch(() => {
        if (!cancelled) setMobileOk(null);
      });
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

  useEffect(() => {
    const detected = detectCodMobileMethodFromPhone(phoneNumber);
    if (detected && providers.some((p) => p.provider === detected)) {
      setProvider(detected);
    }
  }, [phoneNumber, providers]);

  if (!fiatPaused && mobileOk === false) {
    return (
      <WalletFormCard>
        <WalletStatusBanner tone="warn">{t("wallet_fiat_unavailable")}</WalletStatusBanner>
      </WalletFormCard>
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
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <WalletFormCard>
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

      {fiatPaused ? <WalletStatusBanner tone="warn">{t("wallet_fiat_paused_hint")}</WalletStatusBanner> : null}

      {step === 0 ? (
        <>
          <WalletFieldLabel label={t("wallet_transfer_asset")}>
            <div className="mb-2 flex gap-2">
              {(["USD", "CDF"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={locked}
                  onClick={() => setAsset(a)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 ${
                    asset === a
                      ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-mint)]"
                      : "border-[color:var(--fd-border)] bg-white"
                  }`}
                >
                  <WalletAssetIcon asset={a} size={24} />
                  <span className="text-sm font-bold">{a}</span>
                </button>
              ))}
            </div>
          </WalletFieldLabel>
          <WalletFieldLabel label={t("wallet_fiat_gross")}>
            <input
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              inputMode="decimal"
              disabled={locked}
              className={`${walletInputClass} disabled:opacity-60`}
            />
          </WalletFieldLabel>
          {summary ? (
            <WalletStatusBanner tone="info">
              {t("wallet_fiat_net")}: {summary.net.toLocaleString(loc)} {asset} · {t("wallet_fiat_fee", { pct })}
            </WalletStatusBanner>
          ) : null}
          <button type="button" className={walletPrimaryBtnClass} disabled={locked || !summary} onClick={() => setStep(1)}>
            →
          </button>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <WalletFieldLabel label={t("wallet_phone_number")}>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              inputMode="tel"
              placeholder="09xxxxxxxx"
              disabled={locked}
              className={`${walletInputClass} disabled:opacity-60`}
            />
          </WalletFieldLabel>
          <WalletFieldLabel label={t("wallet_mobile_money_provider")}>
            <FiatProviderPicker
              providers={providers}
              value={provider}
              onChange={setProvider}
              disabled={locked || providersLoading}
            />
          </WalletFieldLabel>
          <div className="flex gap-2">
            <button type="button" className={walletPrimaryBtnClass} onClick={() => setStep(0)}>
              ←
            </button>
            <button
              type="button"
              className={walletPrimaryBtnClass}
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
          <WalletStatusBanner tone="success">
            <p className="font-bold tabular-nums">
              {summary.g.toLocaleString(loc)} {asset}
            </p>
            <p className="text-[11px] opacity-90">{providers.find((p) => p.provider === provider)?.label}</p>
            <p className="text-[11px] opacity-90">{phoneNumber}</p>
          </WalletStatusBanner>
          <p className="text-xs text-[color:var(--fd-muted)]">{t("wallet_fiat_status_pending_body")}</p>
          {err ? <WalletErrorBanner>{clientErrorText(t, err)}</WalletErrorBanner> : null}
          <div className="flex gap-2">
            <button type="button" className={walletPrimaryBtnClass} onClick={() => setStep(1)}>
              ←
            </button>
            <button type="button" className={walletPrimaryBtnClass} disabled={loading} onClick={() => void submit()}>
              {loading ? "…" : t("wallet_fiat_submit")}
            </button>
          </div>
        </>
      ) : null}
    </WalletFormCard>
  );
}
