"use client";

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

type ProviderOption = { provider: string; label: string };

export default function WalletFiatDepositClient() {
  const { t, locale } = useI18n();
  const [asset, setAsset] = useState<"USD" | "CDF">("USD");
  const [gross, setGross] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersErr, setProvidersErr] = useState<string | null>(null);
  const [providerManual, setProviderManual] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [okId, setOkId] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setProvidersErr(null);
      setProvidersLoading(true);
      try {
        const url = `/api/config/pawapay/active-conf?country=COD&operationType=DEPOSIT&currency=${asset}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          if (!cancelled) {
            setProviders([]);
            setProvidersErr(typeof data?.error === "string" ? data.error : "Provider list unavailable");
          }
          return;
        }
        const cod = (data.countries as Array<any> | undefined)?.find((c) => c?.country === "COD");
        const list = (cod?.providers as Array<any> | undefined) ?? [];
        const opts: ProviderOption[] = list
          .map((p) => ({
            provider: String(p.provider),
            label: String(p.displayName ?? p.provider),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        if (!cancelled) {
          setProviders(opts);
          if (opts.length && !opts.some((x) => x.provider === provider)) {
            setProvider(opts[0]!.provider);
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
    setErr(null);
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_pawapay_deposit_failed");
        return;
      }
      if (typeof data.depositId === "string") setOkId(data.depositId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormCard>
      <FieldLabel label={t("wallet_transfer_asset")}>
        <select value={asset} onChange={(e) => setAsset(e.target.value as "USD" | "CDF")} className={inputClass}>
          <option value="USD">USD</option>
          <option value="CDF">CDF</option>
        </select>
      </FieldLabel>

      <FieldLabel label={t("wallet_fiat_gross")}>
        <input value={gross} onChange={(e) => setGross(e.target.value)} inputMode="decimal" className={inputClass} />
      </FieldLabel>

      <FieldLabel label={t("wallet_phone_number")}>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          inputMode="tel"
          placeholder="99xxxxxxx ou 24399xxxxxxx"
          className={inputClass}
        />
      </FieldLabel>

      <FieldLabel label={t("wallet_mobile_money_provider")}>
        {providers.length > 0 ? (
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={providersLoading}
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
            className={inputClass}
            placeholder="MTN_MOMO_COD, AIRTEL_MONEY_COD, ..."
          />
        )}
      </FieldLabel>
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

      {err ? <ErrorBanner>{clientErrorText(t, err)}</ErrorBanner> : null}

        {okId ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
            Deposit initiated. ID: <span className="font-mono">{okId}</span>
          </p>
        ) : null}

        <button
          type="button"
          disabled={
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

