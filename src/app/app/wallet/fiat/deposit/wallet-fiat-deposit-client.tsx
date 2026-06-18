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
import {
  COD_MOBILE_FALLBACK,
  filterCodMobileProviders,
} from "@/lib/cod-mobile-providers";

type ProviderOption = { provider: string; label: string };

export default function WalletFiatDepositClient({
  fiatPaused = false,
}: {
  fiatPaused?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [asset, setAsset] = useState<"USD" | "CDF">("USD");
  const [gross, setGross] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersErr, setProvidersErr] = useState<string | null>(null);
  const [providerManual, setProviderManual] = useState("");
  const [useManualProvider, setUseManualProvider] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [errDetail, setErrDetail] = useState<string | null>(null);
  const [okId, setOkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const providerLabel = useMemo(() => {
    if (providers.length > 0) {
      return providers.find((p) => p.provider === provider)?.label ?? null;
    }
    return providerManual.trim() ? providerManual.trim() : null;
  }, [providers, provider, providerManual]);

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
      setProvidersErr(null);
      setProvidersLoading(true);
      try {
        const res = await fetch("/api/config/mobile-money/providers");
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          if (!cancelled) {
            setProviders(
              COD_MOBILE_FALLBACK.map((p) => ({ provider: p.provider, label: p.label })),
            );
            setProvidersErr(typeof data?.error === "string" ? data.error : "Provider list unavailable");
          }
          return;
        }
        const raw: ProviderOption[] = ((data.providers as Array<{ provider: string; label: string }>) ?? [])
          .map((p) => ({
            provider: String(p.provider),
            label: String(p.label ?? p.provider),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        const opts = filterCodMobileProviders(raw);
        const use =
          opts.length > 0
            ? opts
            : COD_MOBILE_FALLBACK.map((p) => ({ provider: p.provider, label: p.label }));
        if (!cancelled) {
          setProviders(use);
          if (use.length && !use.some((x) => x.provider === provider)) {
            setProvider(use[0]!.provider);
          } else if (!provider && use[0]) {
            setProvider(use[0].provider);
          }
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
  }, [asset]);

  async function submit() {
    if (fiatPaused) return;
    setErr(null);
    setErrDetail(null);
    setOkId(null);
    setLoading(true);
    try {
      const providerFinal =
        providers.length > 0 ? provider : providerManual.trim();
      const res = await fetch("/api/wallet/fiat/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset,
          grossAmount: gross,
          phoneNumber,
          provider: providerFinal,
          providerLabel,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_fiat_deposit_failed");
        setErrDetail(typeof data.detail === "string" ? data.detail : null);
        return;
      }
      if (typeof data.depositId === "string") {
        setOkId(data.depositId);
        router.push(`/app/wallet/fiat/status/${encodeURIComponent(data.depositId)}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const locked = fiatPaused;

  return (
    <FormCard>
      {fiatPaused ? (
        <div className="mb-4 rounded-2xl border border-amber-600/40 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">{t("wallet_fiat_paused_title")}</p>
          <p className="mt-1 leading-relaxed">{t("wallet_fiat_paused_body")}</p>
        </div>
      ) : null}
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

      <FieldLabel label={t("wallet_phone_number")}>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          inputMode="tel"
          placeholder="99xxxxxxx ou 24399xxxxxxx"
          disabled={locked}
          className={`${inputClass} disabled:opacity-60`}
        />
      </FieldLabel>

      <FieldLabel label={t("wallet_mobile_money_provider")}>
        {providers.length > 0 && !useManualProvider ? (
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
        ) : (
          <input
            value={providerManual}
            onChange={(e) => setProviderManual(e.target.value)}
            disabled={locked}
            className={`${inputClass} disabled:opacity-60`}
            placeholder="airtel, orange, mpesa, africell"
          />
        )}
      </FieldLabel>
      {providers.length > 0 ? (
        <button
          type="button"
          disabled={locked}
          className="text-left text-xs font-semibold text-emerald-800 underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
          onClick={() => setUseManualProvider((v) => !v)}
        >
          {useManualProvider ? "Use network list" : "Enter provider code manually"}
        </button>
      ) : null}
      {providersErr ? <ErrorBanner>{providersErr}</ErrorBanner> : null}

        {summary ? (
          <div className="rounded-2xl border border-emerald-900/15 bg-emerald-50/70 p-4 text-sm dark:border-emerald-800/30 dark:bg-emerald-950/30">
            <p className="text-stone-700 dark:text-stone-200">
              {t("wallet_fiat_fee", { pct })}:{" "}
              <strong className="tabular-nums text-stone-900 dark:text-stone-100">
                {summary.fee.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 })}{" "}
                {asset}
              </strong>
            </p>
            <p className="mt-2 text-stone-700 dark:text-stone-200">
              {t("wallet_fiat_net")}:{" "}
              <strong className="tabular-nums text-stone-900 dark:text-stone-100">
                {summary.net.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 })}{" "}
                {asset}
              </strong>
            </p>
          </div>
        ) : null}

      {err ? (
        <ErrorBanner>
          <div>{clientErrorText(t, err)}</div>
          {errDetail ? <div className="mt-2 font-mono text-[11px] opacity-90">{errDetail}</div> : null}
        </ErrorBanner>
      ) : null}

      {okId ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
          {t("wallet_fiat_deposit_request_sent")}
        </p>
      ) : null}

        <button
          type="button"
          disabled={
            locked ||
            loading ||
            !summary ||
            !phoneNumber.trim() ||
            (providers.length > 0 ? !provider.trim() : !providerManual.trim())
          }
          onClick={() => void submit()}
          className={primaryBtnClass}
        >
          {loading ? "…" : t("wallet_fiat_deposit_submit")}
        </button>
    </FormCard>
  );
}

