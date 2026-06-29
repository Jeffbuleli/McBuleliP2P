"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { clientErrorText } from "@/lib/client-error-text";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { IconMobileMoney } from "@/components/wallet/fiat-icons";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";
import {
  WalletErrorBanner,
  WalletFieldLabel,
  WalletFormCard,
  WalletStatusBanner,
  walletInputClass,
} from "@/components/wallet/wallet-form";
import { FiatProviderPicker } from "@/components/wallet/fiat-provider-picker";
import { COD_MOBILE_FALLBACK, detectCodMobileMethodFromPhone, filterCodMobileProviders } from "@/lib/cod-mobile-providers";
import { FlowAssetToggle, FlowNavRow } from "@/components/wallet/wallet-flow-shell";

type ProviderOption = { provider: string; label: string };

export default function WalletFiatDepositClient({ fiatPaused = false }: { fiatPaused?: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAsset = searchParams.get("asset");
  const assetLocked = urlAsset === "USD" || urlAsset === "CDF";
  const [step, setStep] = useState(0);
  const [asset, setAsset] = useState<"USD" | "CDF">(assetLocked ? urlAsset : "USD");
  const [gross, setGross] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const steps = useMemo(
    () => [
      { id: "amount", label: t("wallet_fiat_form_step_amount") },
      { id: "network", label: t("wallet_fiat_form_step_network") },
      { id: "confirm", label: t("wallet_fiat_form_step_confirm") },
    ],
    [t],
  );

  useEffect(() => {
    if (urlAsset === "USD" || urlAsset === "CDF") setAsset(urlAsset);
  }, [urlAsset]);

  const pct = Math.round(FIAT_FEE_RATE * 100);
  const summary = useMemo(() => {
    const g = Number(gross);
    if (!Number.isFinite(g) || g <= 0) return null;
    const fee = g * FIAT_FEE_RATE;
    const net = g - fee;
    if (net <= 0) return null;
    return { fee, net, g };
  }, [gross]);

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

  async function submit() {
    if (fiatPaused || !summary) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fiat/deposit", {
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
        setErr(typeof data.error === "string" ? data.error : "wallet_fiat_deposit_failed");
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
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <WalletFormCard>
      <div className="mb-3 flex items-center gap-2 text-emerald-300">
        <IconMobileMoney />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em]">
          {t("wallet_fiat_rail_momo")}
        </span>
      </div>

      <FiatStepper steps={steps} current={step} />

      {fiatPaused ? <WalletStatusBanner tone="warn">{t("wallet_fiat_paused_hint")}</WalletStatusBanner> : null}

      {step === 0 ? (
        <>
          <WalletFieldLabel label={t("wallet_transfer_asset")}>
            {assetLocked ? (
              <div className="mb-1 flex items-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-500/12 px-3 py-2.5">
                <WalletAssetIcon asset={asset} size={24} />
                <span className="text-sm font-bold text-[color:var(--fd-text)]">{asset}</span>
              </div>
            ) : (
              <div className="mb-1">
                <FlowAssetToggle
                  assets={["USD", "CDF"]}
                  value={asset}
                  onChange={(a) => setAsset(a as "USD" | "CDF")}
                  disabled={locked}
                />
              </div>
            )}
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
          <FlowNavRow onBack={() => router.push("/app/wallet")} onNext={() => setStep(1)} nextDisabled={locked || !summary} />
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
          <FlowNavRow
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            nextDisabled={locked || !phoneNumber.trim() || !provider}
          />
        </>
      ) : null}

      {step === 2 && summary ? (
        <>
          <WalletStatusBanner tone="success">
            <p className="font-bold tabular-nums">
              {summary.g.toLocaleString(loc)} {asset}
            </p>
            <p className="text-[11px] opacity-90">{providers.find((p) => p.provider === provider)?.label}</p>
          </WalletStatusBanner>
          <p className="text-xs text-[color:var(--fd-muted)]">{t("wallet_fiat_status_pending_body")}</p>
          {err ? <WalletErrorBanner>{clientErrorText(t, err)}</WalletErrorBanner> : null}
          <FlowNavRow
            onBack={() => setStep(1)}
            onNext={() => void submit()}
            nextDisabled={loading}
            nextLabel={t("wallet_fiat_deposit_submit")}
            loading={loading}
          />
        </>
      ) : null}
    </WalletFormCard>
  );
}
